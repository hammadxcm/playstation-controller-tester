import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react'

export interface ProgressRingHandle {
  /** 0..1, written straight to the DOM */
  set(p: number): void
}

/** Imperative progress ring; setting it never re-renders React. */
export const ProgressRing = forwardRef<
  ProgressRingHandle,
  { size?: number; stroke?: number; children?: ReactNode; initial?: number }
>(function ProgressRing({ size = 64, stroke = 6, children, initial = 0 }, ref) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const arc = useRef<SVGCircleElement>(null)
  useImperativeHandle(
    ref,
    () => ({
      set(p) {
        arc.current?.style.setProperty(
          'stroke-dashoffset',
          String(c * (1 - Math.max(0, Math.min(1, p)))),
        )
      },
    }),
    [c],
  )
  return (
    <div className="ring" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} aria-hidden>
        <circle
          className="track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          ref={arc}
          className="arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - initial)}
        />
      </svg>
      {children && <span className="ring-label">{children}</span>}
    </div>
  )
})
