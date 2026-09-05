import type { Cycle, ColorPairInfo, ThreeColorInfo } from '../data/types'
import type { HiddenState } from '../lib/storage'

interface VisibilityPanelProps {
  cycles: Cycle[]
  colorPairs: ColorPairInfo[]
  threeColorCombos: ThreeColorInfo[]
  hidden: HiddenState
  onToggleCycle: (id: string) => void
  onTogglePair: (key: string) => void
  onToggleTriple: (key: string) => void
}

export default function VisibilityPanel({
  cycles,
  colorPairs,
  threeColorCombos,
  hidden,
  onToggleCycle,
  onTogglePair,
  onToggleTriple,
}: VisibilityPanelProps) {
  return (
    <div className="visibility-panel">
      <div className="visibility-group">
        <h3>Cycles</h3>
        {cycles.map((cycle) => (
          <label key={cycle.id} className="visibility-item">
            <input
              type="checkbox"
              checked={!hidden.cycles[cycle.id]}
              onChange={() => onToggleCycle(cycle.id)}
            />
            {cycle.name}
          </label>
        ))}
      </div>
      <div className="visibility-group">
        <h3>Two-color pairs</h3>
        {colorPairs.map((pair) => (
          <label key={pair.key} className="visibility-item">
            <input
              type="checkbox"
              checked={!hidden.pairs[pair.key]}
              onChange={() => onTogglePair(pair.key)}
            />
            {pair.guild}
          </label>
        ))}
      </div>
      <div className="visibility-group">
        <h3>Three-color combos</h3>
        {threeColorCombos.map((combo) => (
          <label key={combo.key} className="visibility-item">
            <input
              type="checkbox"
              checked={!hidden.triples[combo.key]}
              onChange={() => onToggleTriple(combo.key)}
            />
            {combo.name}
          </label>
        ))}
      </div>
    </div>
  )
}
