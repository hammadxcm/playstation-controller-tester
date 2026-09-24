import { useRef } from 'react'
import type { Family } from '@/core/gamepad/identify'
import { PROFILES } from '@/core/gamepad/profiles'
import { DualSense, DualShock4, Generic, Xbox } from './bodies'
import { Defs } from './defs'
import { GEOMETRY } from './geometry'
import { Parts } from './parts'
import { useControllerRig, type FrameSource } from './useControllerRig'
import { ArtworkModel } from './ArtworkModel'
import './model.css'

const BODIES: Record<Family, () => React.JSX.Element> = {
  dualsense: DualSense,
  dualshock4: DualShock4,
  xbox: Xbox,
  generic: Generic,
}

/** Sony and Xbox families use the accurate line-art drawings; generic pads use the generated parts model. */
export function ControllerModel({
  family,
  compact,
  edge,
  showValues,
}: {
  family: Family
  compact?: boolean
  edge?: boolean
  showValues?: boolean
}) {
  if (family !== 'generic') {
    const kind =
      family === 'xbox'
        ? 'xbox'
        : family === 'dualshock4'
          ? 'dualshock4'
          : edge
            ? 'dualsenseEdge'
            : 'dualsense'
    return <ArtworkModel kind={kind} compact={compact} showValues={showValues} />
  }
  return <PartsModel family={family} compact={compact} />
}

/** Generated controller from geometry. Body layer is static; parts layer is driven by the rig. */
export function PartsModel({
  family,
  compact,
  source,
}: {
  family: Family
  compact?: boolean
  /** scripted frames instead of the active pad (landing cards) */
  source?: FrameSource
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  const parts = useRef<SVGSVGElement>(null)
  const g = GEOMETRY[family]
  const Body = BODIES[family]
  useControllerRig(wrapper, { travel: 11, key: family, source })
  return (
    <div ref={wrapper} className={`model ${compact ? 'compact' : ''}`} data-family={family}>
      <div className="model-glow" />
      <svg className="model-body" viewBox="0 0 400 260" aria-hidden>
        <Defs />
        <Body />
      </svg>
      <svg
        ref={parts}
        key={family}
        className="model-parts"
        viewBox="0 0 400 260"
        role="img"
        aria-label={`${PROFILES[family].label} controller, live`}
      >
        <Parts g={g} />
      </svg>
    </div>
  )
}
