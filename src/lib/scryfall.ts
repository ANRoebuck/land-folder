import { useEffect, useState } from 'react'

// Real card art, fetched from the live Scryfall API by exact card name (per
// CLAUDE.md: api.scryfall.com, not recollection). Successful lookups are
// cached in localStorage indefinitely -- printings' art doesn't change.
// Requests are serialized with a gap between them, but with ~135 cards on a
// cold cache this app still exceeds Scryfall's burst allowance (observed:
// a 429 after roughly 20 requests) -- so a 429 is retried using the
// `retry-after` header rather than treated as "this card has no art", and
// only a successful fetch is ever persisted to the cache.

const CACHE_KEY = 'mtgCycleTracker.v1.scryfallImageCache'
const REQUEST_GAP_MS = 150
const MAX_ATTEMPTS = 3

interface CacheEntry {
  url: string
  fetchedAt: number
}

type Cache = Record<string, CacheEntry>

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Cache) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Cache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Image caching is a nice-to-have -- if storage is full/unavailable,
    // just skip persisting and re-fetch next time.
  }
}

let cache = readCache()
const pending = new Map<string, Promise<string | null>>()
// Names that failed for a non-retryable reason (404, network error, etc.)
// this page load. Not persisted, unlike a real cache hit -- a reload gives
// every name a fresh chance, in case the failure was transient.
const failedThisSession = new Set<string>()

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let queueTail: Promise<void> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queueTail.then(task)
  queueTail = result.then(
    () => wait(REQUEST_GAP_MS),
    () => wait(REQUEST_GAP_MS),
  )
  return result
}

/**
 * A 429 here isn't rare -- Scryfall's burst allowance is roughly 20
 * requests before it kicks in, well under this app's ~135 cards on a cold
 * cache -- so it's retried using the `retry-after` header rather than
 * treated as "this card has no art". Because the queue only runs one
 * request at a time, waiting here also naturally throttles every request
 * still behind it in the queue.
 */
async function fetchImageUrl(name: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`)
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt
      await wait(retryAfter * 1000)
      continue
    }
    if (!res.ok) return null
    const data = await res.json()
    const url: string | undefined =
      data?.image_uris?.art_crop ?? data?.card_faces?.[0]?.image_uris?.art_crop
    return url ?? null
  }
  return null
}

/** Returns a cached image URL immediately, or fetches (queued) and caches it. */
export function getCardImage(name: string): Promise<string | null> {
  const cachedUrl = cache[name]?.url
  if (cachedUrl) return Promise.resolve(cachedUrl)
  if (failedThisSession.has(name)) return Promise.resolve(null)

  const inFlight = pending.get(name)
  if (inFlight) return inFlight

  const promise = enqueue(() => fetchImageUrl(name))
    .catch(() => null)
    .then((url) => {
      if (url) {
        cache = { ...cache, [name]: { url, fetchedAt: Date.now() } }
        writeCache(cache)
      } else {
        failedThisSession.add(name)
      }
      pending.delete(name)
      return url
    })
  pending.set(name, promise)
  return promise
}

/** undefined = loading, null = no art found, string = image URL. */
export function useScryfallImage(name: string): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(() => cache[name]?.url)

  useEffect(() => {
    let cancelled = false
    setUrl(cache[name]?.url)
    getCardImage(name).then((result) => {
      if (!cancelled) setUrl(result)
    })
    return () => {
      cancelled = true
    }
  }, [name])

  return url
}
