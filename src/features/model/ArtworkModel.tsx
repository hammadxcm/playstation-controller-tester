import { useEffect, useRef, useState } from 'react'
import { onRaf } from '@/lib/motion'
import { useFrame, useHidState, useSampled } from '@/state/hooks'
import type { HidState } from '@/core/hid/controller'
import { STD } from '@/core/gamepad/types'
import { prepareArtwork, type PreparedArtwork } from './artwork/prepare'
import { ART_FILES, SPECS, type ArtworkKind } from './artwork/specs'
import { useControllerRig } from './useControllerRig'
import './model.css'

interface Box { x: number; y: number; w: number; h: number }
interface Anchors { touchpad: Box; ls: Box; rs: Box; mute?: Box; gripL?: Box; gripR?: Box }

const cache = new Map<ArtworkKind, PreparedArtwork>()
const box = (el: Element | null): Box | undefined => {
  if (!el || !(el as SVGGraphicsElement).getBBox) return undefined
  try {
    const b = (el as SVGGraphicsElement).getBBox()
    return { x: b.x, y: b.y, w: b.width, h: b.height }
  } catch {
    return undefined
  }
}

/** Accurate DualSense / Edge / DualShock 4 drawing (artwork © Xuezhou Dai, MIT) driven by the shared rig. */
export function ArtworkModel({ kind, compact, showValues }: { kind: ArtworkKind; compact?: boolean; showValues?: boolean }) {
  const spec = SPECS[kind]
  const wrapper = useRef<HTMLDivElement>(null)
  const art = useRef<SVGSVGElement>(null)
  const overlay = useRef<SVGSVGElement>(null)
  const [prepared, setPrepared] = useState<PreparedArtwork | null>(cache.get(kind) ?? null)
  const [anchors, setAnchors] = useState<Anchors | null>(null)
  const hid = useRef<HidState | null>(null)
  const frame = useRef({ lx: 0, ly: 0, rx: 0, ry: 0, l2: 0, r2: 0 })

  useEffect(() => {
    let alive = true
    const hit = cache.get(kind)
    const ready = hit ? Promise.resolve(hit) : ART_FILES[kind]().then((m) => {
      const p = prepareArtwork(m.default, spec)
      cache.set(kind, p)
      return p
    })
    void ready.then((p) => { if (alive) setPrepared(p) })
    return () => {
      alive = false
    }
  }, [kind, spec])

  // Measure once the drawing is in the DOM: overlay elements are placed from real bounding boxes.
  useEffect(() => {
    const root = art.current
    if (!prepared || !root) return
    const byId = (id?: string) => (id ? root.querySelector(`#${CSS.escape(id)}`) : null)
    const touchpad = box(byId(spec.anchors.touchpad))
    const ls = box(byId(spec.sticks.ls.cap))
    const rs = box(byId(spec.sticks.rs.cap))
    if (!touchpad || !ls || !rs) return
    setAnchors({ touchpad, ls, rs, mute: box(byId(spec.anchors.mute)), gripL: box(byId(spec.anchors.gripL)), gripR: box(byId(spec.anchors.gripR)) })
  }, [prepared, spec])

  useControllerRig(wrapper, { travel: spec.travel, key: anchors })

  useFrame((f) => {
    frame.current = { lx: f.axes[0] ?? 0, ly: f.axes[1] ?? 0, rx: f.axes[2] ?? 0, ry: f.axes[3] ?? 0, l2: f.buttons[STD.l2]?.value ?? 0, r2: f.buttons[STD.r2]?.value ?? 0 }
  })
  useHidState((s) => {
    hid.current = s
  })

  // Touch points + HID-only buttons at display rate, from refs.
  useEffect(() => {
    const ov = overlay.current
    const root = wrapper.current
    if (!ov || !root || !anchors) return
    const pts = [0, 1].map((i) => ov.querySelector(`[data-touch="${i}"]`) as SVGGElement | null)
    const extra = new Map<string, Element[]>()
    root.querySelectorAll('[data-part^="x:"]').forEach((el) => {
      const k = el.getAttribute('data-part')!.slice(2)
      extra.set(k, [...(extra.get(k) ?? []), el])
    })
    const last = new Map<string, boolean>()
    return onRaf(() => {
      const s = hid.current
      const tp = anchors.touchpad
      pts.forEach((g, i) => {
        const t = s?.touches[i]
        if (!g) return
        const on = !!t?.active
        if (g.getAttribute('data-on') !== String(on)) g.setAttribute('data-on', String(on))
        if (on && t) g.setAttribute('transform', `translate(${(tp.x + t.x * tp.w).toFixed(1)} ${(tp.y + t.y * tp.h).toFixed(1)})`)
      })
      if (s) {
        for (const [k, els] of extra) {
          const on = !!s.buttons[k]
          if (last.get(k) !== on) {
            last.set(k, on)
            els.forEach((el) => el.setAttribute('data-on', String(on)))
          }
        }
      }
    })
  }, [anchors])

  const values = useSampled(() => ({ ...frame.current, touches: hid.current?.touches ?? [] }), 8)
  const vb = prepared?.viewBox ?? '0 0 1117 892'
  const aspect = prepared ? `${prepared.width} / ${prepared.height}` : '1117 / 892'
  const a = anchors
  const fs = prepared ? prepared.width / 45 : 24
  const lsC = a ? [a.ls.x + a.ls.w / 2, a.ls.y + a.ls.h / 2, a.ls.w / 2 + spec.travel * 0.3] : null
  const rsC = a ? [a.rs.x + a.rs.w / 2, a.rs.y + a.rs.h / 2, a.rs.w / 2 + spec.travel * 0.3] : null

  return (
    <div ref={wrapper} className={`model art art-${spec.style} ${compact ? 'compact' : ''}`} data-kind={kind} style={{ aspectRatio: aspect }}>
      <div className="model-glow" />
      {prepared ? (
        <svg ref={art} className="model-art" viewBox={vb} role="img" aria-label={`${kind} controller, live`} dangerouslySetInnerHTML={{ __html: prepared.inner }} />
      ) : (
        <div className="model-loading" />
      )}
      <svg ref={overlay} className="model-overlay" viewBox={vb} aria-hidden>
        {a && (
          <>
            {spec.lightbar === 'strips' && (
              <g className="m-lightbar">
                <path className="m-lb-glow" strokeWidth={fs * 0.9} fill="none" strokeLinecap="round" d={`M${a.touchpad.x - fs * 0.2},${a.touchpad.y + fs * 1.4} Q${a.touchpad.x - fs * 0.9},${a.touchpad.y + a.touchpad.h / 2} ${a.touchpad.x + fs * 1.2},${a.touchpad.y + a.touchpad.h - fs * 0.4}`} />
                <path className="m-lb-glow" strokeWidth={fs * 0.9} fill="none" strokeLinecap="round" d={`M${a.touchpad.x + a.touchpad.w + fs * 0.2},${a.touchpad.y + fs * 1.4} Q${a.touchpad.x + a.touchpad.w + fs * 0.9},${a.touchpad.y + a.touchpad.h / 2} ${a.touchpad.x + a.touchpad.w - fs * 1.2},${a.touchpad.y + a.touchpad.h - fs * 0.4}`} />
                <path className="m-lb m-lb-stroke" strokeWidth={fs * 0.28} fill="none" strokeLinecap="round" d={`M${a.touchpad.x - fs * 0.2},${a.touchpad.y + fs * 1.4} Q${a.touchpad.x - fs * 0.9},${a.touchpad.y + a.touchpad.h / 2} ${a.touchpad.x + fs * 1.2},${a.touchpad.y + a.touchpad.h - fs * 0.4}`} />
                <path className="m-lb m-lb-stroke" strokeWidth={fs * 0.28} fill="none" strokeLinecap="round" d={`M${a.touchpad.x + a.touchpad.w + fs * 0.2},${a.touchpad.y + fs * 1.4} Q${a.touchpad.x + a.touchpad.w + fs * 0.9},${a.touchpad.y + a.touchpad.h / 2} ${a.touchpad.x + a.touchpad.w - fs * 1.2},${a.touchpad.y + a.touchpad.h - fs * 0.4}`} />
              </g>
            )}
            {spec.lightbar === 'top' && (
              <g className="m-lightbar">
                <rect className="m-lb-glow" x={a.touchpad.x + a.touchpad.w * 0.18} y={a.touchpad.y - fs * 1.1} width={a.touchpad.w * 0.64} height={fs * 0.8} rx={fs * 0.4} strokeWidth={fs * 0.6} fill="none" />
                <rect className="m-lb" x={a.touchpad.x + a.touchpad.w * 0.18} y={a.touchpad.y - fs * 1.1} width={a.touchpad.w * 0.64} height={fs * 0.8} rx={fs * 0.4} />
              </g>
            )}
            {spec.leds && (
              <g className="m-leds">
                {[-2, -1, 0, 1, 2].map((i) => (
                  <g key={i} className="m-led" data-led={i + 2}>
                    <circle cx={a.touchpad.x + a.touchpad.w / 2 + i * fs * 0.8} cy={a.touchpad.y + a.touchpad.h + fs * 1.1} r={fs * 0.3} fill="#fff" opacity={0.35} />
                    <circle cx={a.touchpad.x + a.touchpad.w / 2 + i * fs * 0.8} cy={a.touchpad.y + a.touchpad.h + fs * 1.1} r={fs * 0.13} fill="#fff" />
                  </g>
                ))}
              </g>
            )}
            {a.mute && <circle className="m-mic" cx={a.mute.x + a.mute.w / 2} cy={a.mute.y - fs * 0.6} r={fs * 0.16} fill="#ff9b3d" data-mode="off" />}
            {a.gripL && <ellipse className="m-heat" data-heat="l" cx={a.gripL.x + a.gripL.w * 0.3} cy={a.gripL.y + a.gripL.h * 0.72} rx={a.gripL.w * 0.35} ry={a.gripL.h * 0.3} fill="url(#m-heat-art)" />}
            {a.gripR && <ellipse className="m-heat" data-heat="r" cx={a.gripR.x + a.gripR.w * 0.7} cy={a.gripR.y + a.gripR.h * 0.72} rx={a.gripR.w * 0.35} ry={a.gripR.h * 0.3} fill="url(#m-heat-art)" />}
            <defs>
              <radialGradient id="m-heat-art" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.55 }} />
                <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            {[0, 1].map((i) => (
              <g key={i} data-touch={i} data-on="false" className="m-touch">
                <circle r={fs * 0.7} />
                <text y={-fs * 1.1} fontSize={fs * 0.9} textAnchor="middle" className="m-text">{values.touches[i]?.active ? `${Math.round(values.touches[i]!.x * 1920)},${Math.round(values.touches[i]!.y * 1080)}` : ''}</text>
                <text y={fs * 1.6} fontSize={fs * 0.9} textAnchor="middle" className="m-text">{values.touches[i]?.active ? `#${values.touches[i]!.id}` : ''}</text>
              </g>
            ))}
            {showValues && lsC && rsC && (
              <g className="m-values">
                {[lsC, rsC].map(([cx, cy, r], i) => (
                  <g key={i}>
                    <line x1={cx! - r!} y1={cy} x2={cx! + r!} y2={cy} className="m-dash" />
                    <line x1={cx} y1={cy! - r!} x2={cx} y2={cy! + r!} className="m-dash" />
                    <circle cx={cx! + (i ? values.rx : values.lx) * spec.travel} cy={cy! + (i ? values.ry : values.ly) * spec.travel} r={fs * 0.12} fill="#f25757" />
                    <text x={cx} y={cy! + r! + fs * 1.4} fontSize={fs * 0.9} textAnchor="middle" className="m-text">X {(i ? values.rx : values.lx).toFixed(3)}</text>
                    <text x={cx} y={cy! + r! + fs * 2.4} fontSize={fs * 0.9} textAnchor="middle" className="m-text">Y {(i ? values.ry : values.ly).toFixed(3)}</text>
                  </g>
                ))}
                <rect x={a.touchpad.x} y={a.touchpad.y} width={a.touchpad.w} height={a.touchpad.h} className="m-dash" fill="none" />
                <text x={a.touchpad.x} y={a.touchpad.y - fs * 0.3} fontSize={fs * 0.8} className="m-text">L2 {values.l2.toFixed(2)}</text>
                <text x={a.touchpad.x + a.touchpad.w} y={a.touchpad.y - fs * 0.3} fontSize={fs * 0.8} textAnchor="end" className="m-text">R2 {values.r2.toFixed(2)}</text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  )
}
