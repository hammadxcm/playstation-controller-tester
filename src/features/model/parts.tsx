import type { ControllerGeometry, FaceKey, Rect, XY } from './geometry'
import type { StdButton } from '@/core/gamepad/types'

type Part = StdButton

export function Stick({
  c: [x, y],
  r,
  part,
  click,
  label,
}: {
  c: XY
  r: number
  part: 'ls' | 'rs'
  click: Part
  label: string
}) {
  return (
    <g data-part={part}>
      <circle cx={x} cy={y} r={r} fill="url(#m-well)" stroke="#0a0b0f" strokeWidth={1.5} />
      <ellipse data-sub="shadow" cx={x} cy={y + 4} rx={15} ry={12} fill="#000" opacity={0.5} />
      <circle cx={x} cy={y} r={10} fill="#111319" />
      <g data-part={click} data-sub="cap">
        <circle className="m-halo" cx={x} cy={y} r={r + 4} fill="url(#m-halo)" />
        <circle
          className="m-cap"
          cx={x}
          cy={y}
          r={16}
          fill="url(#m-cap)"
          stroke="#07080b"
          strokeWidth={1}
        />
        <text className="m-label m-glyph" x={x} y={y + 1}>
          {label}
        </text>
      </g>
      <ellipse data-sub="hi" cx={x - 5} cy={y - 6} rx={6} ry={4} fill="#fff" opacity={0.14} />
    </g>
  )
}

export function FaceButton({ g, k }: { g: ControllerGeometry['face']; k: FaceKey }) {
  const dx = k === 'east' ? g.d : k === 'west' ? -g.d : 0
  const dy = k === 'south' ? g.d : k === 'north' ? -g.d : 0
  const x = g.c[0] + dx
  const y = g.c[1] + dy
  return (
    <g data-part={k}>
      <circle className="m-halo" cx={x} cy={y} r={g.r + 9} fill="url(#m-halo)" />
      <circle cx={x} cy={y} r={g.r + 1.2} fill="#07080b" />
      <circle className="m-cap" cx={x} cy={y} r={g.r} fill="url(#m-btn)" />
      <circle className="m-ripple" cx={x} cy={y} r={g.r} fill="var(--accent)" />
      <text
        className="m-label m-glyph"
        x={x}
        y={y + 0.5}
        style={{ fill: g.color[k], fontSize: 10 }}
      >
        {g.glyph[k]}
      </text>
    </g>
  )
}

const DIRS: [Part, number, number][] = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
]

export function DPad({ g }: { g: ControllerGeometry['dpad'] }) {
  const [cx, cy] = g.c
  const dish = g.style === 'dish'
  return (
    <g className="m-dpad">
      {dish && <circle cx={cx} cy={cy} r={24} fill="url(#m-well)" stroke="#0a0b0f" />}
      <rect x={cx - 8} y={cy - 8} width={16} height={16} fill="#1b1e26" />
      {DIRS.map(([part, dx, dy]) => {
        const w = dx ? 22 : 15
        const h = dy ? 22 : 15
        const x = cx + dx * 15 - w / 2
        const y = cy + dy * 15 - h / 2
        return (
          <g key={part} data-part={part} data-dir={part}>
            <rect
              className="m-halo"
              x={x - 4}
              y={y - 4}
              width={w + 8}
              height={h + 8}
              rx={6}
              fill="url(#m-halo)"
            />
            <rect
              className="m-cap m-arm"
              x={x}
              y={y}
              width={w}
              height={h}
              rx={3}
              fill={dish ? 'url(#m-btn)' : 'url(#m-plate)'}
              stroke="#07080b"
              strokeWidth={0.8}
            />
            <text
              className="m-label m-glyph"
              x={cx + dx * 15}
              y={cy + dy * 15 + 0.5}
              style={{ fontSize: 8 }}
            >
              {part === 'up' ? '▲' : part === 'down' ? '▼' : part === 'left' ? '◀' : '▶'}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function Trigger({
  part,
  r: [x, y, w, h],
  label,
  impulse,
}: {
  part: 'l2' | 'r2'
  r: Rect
  label: string
  impulse: boolean
}) {
  return (
    <g data-part={part} className="m-trigger" style={{ ['--v' as string]: 0 }}>
      <rect
        className="m-tbody"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={5}
        fill="url(#m-shell-dark)"
        stroke="#07080b"
        strokeWidth={0.8}
      />
      <rect className="m-tfill" x={x} y={y} width={w} height={h} rx={5} fill="var(--accent)" />
      {impulse && (
        <rect className="m-impulse" x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={7} />
      )}
      <text className="m-label" x={x + w / 2} y={y + h / 2 + 0.5}>
        {label}
      </text>
    </g>
  )
}

export function Bumper({
  part,
  r: [x, y, w, h],
  label,
}: {
  part: 'l1' | 'r1'
  r: Rect
  label: string
}) {
  return (
    <g data-part={part}>
      <rect
        className="m-halo"
        x={x - 3}
        y={y - 3}
        width={w + 6}
        height={h + 6}
        rx={7}
        fill="url(#m-halo)"
      />
      <rect
        className="m-cap"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={5}
        fill="url(#m-shell-dark)"
        stroke="#07080b"
        strokeWidth={0.8}
      />
      <text className="m-label m-glyph" x={x + w / 2} y={y + h / 2 + 0.5}>
        {label}
      </text>
    </g>
  )
}

export function SmallButton({
  part,
  c: [x, y],
  shape,
  label,
}: {
  part: Part
  c: XY
  shape: 'pill' | 'circle' | 'bar'
  label?: string
}) {
  const body =
    shape === 'circle' ? (
      <circle className="m-cap" cx={x} cy={y} r={10} fill="url(#m-btn)" stroke="#07080b" />
    ) : shape === 'bar' ? (
      <rect
        className="m-cap"
        x={x - 9}
        y={y - 3.5}
        width={18}
        height={7}
        rx={3.5}
        fill="url(#m-btn)"
        stroke="#07080b"
      />
    ) : (
      <rect
        className="m-cap"
        x={x - 4}
        y={y - 9}
        width={8}
        height={18}
        rx={4}
        fill="url(#m-btn)"
        stroke="#07080b"
      />
    )
  return (
    <g data-part={part}>
      {shape === 'circle' ? (
        <circle className="m-halo" cx={x} cy={y} r={18} fill="url(#m-halo)" />
      ) : (
        <rect
          className="m-halo"
          x={x - 14}
          y={y - 14}
          width={28}
          height={28}
          rx={8}
          fill="url(#m-halo)"
        />
      )}
      {body}
      {label && (
        <text
          className="m-label"
          x={x}
          y={shape === 'circle' ? y + 0.5 : y + 16}
          style={{ fontSize: shape === 'circle' ? 7 : 6.5 }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

export function Touchpad({ r: [x, y, w, h] }: { r: Rect }) {
  return (
    <g data-part="touchpad">
      <rect
        className="m-halo"
        x={x - 4}
        y={y - 4}
        width={w + 8}
        height={h + 8}
        rx={12}
        fill="url(#m-halo)"
      />
      <rect
        className="m-cap"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={9}
        fill="url(#m-pad)"
        stroke="#07080b"
        strokeWidth={1}
      />
      <rect
        x={x + 3}
        y={y + 3}
        width={w - 6}
        height={h - 6}
        rx={7}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.05}
      />
    </g>
  )
}

export function Lightbar({ lb }: { lb: NonNullable<ControllerGeometry['lightbar']> }) {
  if (lb.kind === 'top') {
    return (
      <g className="m-lightbar">
        <path className="m-lb-glow" d={lb.d} strokeWidth={8} fill="none" strokeLinejoin="round" />
        <path className="m-lb" d={lb.d} />
      </g>
    )
  }
  return (
    <g className="m-lightbar">
      <path className="m-lb-glow" d={lb.left} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path className="m-lb-glow" d={lb.right} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path
        className="m-lb m-lb-stroke"
        d={lb.left}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        className="m-lb m-lb-stroke"
        d={lb.right}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}

export function PlayerLeds({ leds }: { leds: XY[] }) {
  return (
    <g className="m-leds">
      {leds.map(([x, y], i) => (
        <g key={i} className="m-led" data-led={i}>
          <circle cx={x} cy={y} r={5} fill="#fff" opacity={0.35} />
          <circle cx={x} cy={y} r={2} fill="#fff" />
        </g>
      ))}
    </g>
  )
}

export function MicLed({ c: [x, y] }: { c: XY }) {
  return <circle className="m-mic" cx={x} cy={y} r={2.4} fill="#ff9b3d" data-mode="off" />
}

export function GripHeat({ g }: { g: ControllerGeometry['grips'] }) {
  return (
    <>
      <ellipse
        className="m-heat"
        data-heat="l"
        cx={g.left[0]}
        cy={g.left[1]}
        rx={30}
        ry={42}
        fill="url(#m-heat)"
      />
      <ellipse
        className="m-heat"
        data-heat="r"
        cx={g.right[0]}
        cy={g.right[1]}
        rx={30}
        ry={42}
        fill="url(#m-heat)"
      />
    </>
  )
}

/** All moving parts for one geometry, in paint order. */
export function Parts({ g }: { g: ControllerGeometry }) {
  return (
    <>
      <Trigger part="l2" r={g.l2} label={g.labels.l2} impulse={g.impulseTriggers} />
      <Trigger part="r2" r={g.r2} label={g.labels.r2} impulse={g.impulseTriggers} />
      <Bumper part="l1" r={g.l1} label={g.labels.l1} />
      <Bumper part="r1" r={g.r1} label={g.labels.r1} />
      <GripHeat g={g.grips} />
      {g.touchpad && <Touchpad r={g.touchpad} />}
      {g.lightbar && <Lightbar lb={g.lightbar} />}
      {g.leds && <PlayerLeds leds={g.leds} />}
      {g.mic && <MicLed c={g.mic} />}
      <DPad g={g.dpad} />
      {(['north', 'south', 'east', 'west'] as FaceKey[]).map((k) => (
        <FaceButton key={k} g={g.face} k={k} />
      ))}
      <SmallButton part="select" c={g.select} shape="pill" label={g.labels.select} />
      <SmallButton part="start" c={g.start} shape="pill" label={g.labels.start} />
      <SmallButton part="home" c={g.home} shape="circle" label={g.labels.home} />
      {g.aux && (
        <SmallButton
          part="touchpad"
          c={g.aux}
          shape="bar"
          label={g.touchpad ? undefined : g.labels.aux}
        />
      )}
      <Stick c={g.ls} r={g.stickR} part="ls" click="l3" label="L3" />
      <Stick c={g.rs} r={g.stickR} part="rs" click="r3" label="R3" />
    </>
  )
}
