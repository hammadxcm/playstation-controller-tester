import { useRef } from 'react'
import type { Family } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { DualSense, DualShock4, Generic, Xbox } from './bodies'
import { Defs } from './defs'
import { GEOMETRY } from './geometry'
import { Parts } from './parts'
import { useControllerRig } from './useControllerRig'
import { ArtworkModel } from './ArtworkModel'
import './model.css'

const BODIES: Record<Family, () => React.JSX.Element> = { dualsense: DualSense, dualshock4: DualShock4, xbox: Xbox, generic: Generic }

/** Sony families use the accurate line-art drawings; others use the generated parts model. */
export function ControllerModel({ family, compact, edge, showValues }: { family: Family; compact?: boolean; edge?: boolean; showValues?: boolean }) {
  if (family === 'dualsense' || family === 'dualshock4') {
    return <ArtworkModel kind={family === 'dualshock4' ? 'dualshock4' : edge ? 'dualsenseEdge' : 'dualsense'} compact={compact} showValues={showValues} />
  }
  return <PartsModel family={family} compact={compact} />
}

/** Generated controller from geometry. Body layer is static; parts layer is driven by the rig. */
export function PartsModel({ family, compact }: { family: Family; compact?: boolean }) {
  const wrapper = useRef<HTMLDivElement>(null)
  const parts = useRef<SVGSVGElement>(null)
  const g = GEOMETRY[family]
  const Body = BODIES[family]
  useControllerRig(wrapper, { travel: 11, key: family })
  return (
    <div ref={wrapper} className={`model ${compact ? 'compact' : ''}`} data-family={family}>
      <div className="model-glow" />
      <svg className="model-body" viewBox="0 0 400 260" aria-hidden>
        <Defs />
        <Body />
      </svg>
      <svg ref={parts} key={family} className="model-parts" viewBox="0 0 400 260" role="img" aria-label={`${PROFILES[family].label} controller, live`}>
        <Parts g={g} />
      </svg>
    </div>
  )
}
