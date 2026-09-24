import { useRef, useState } from 'react'
import { identify } from '@/core/gamepad/identify'
import { ControllerModel } from '@/features/model/ControllerModel'
import { ProgressRing, type ProgressRingHandle } from '@/components/ui'
import { onRaf } from '@/lib/motion'
import { hapticCaps, rumble, stopRumble } from '@/core/gamepad/haptics'
import { getGamepad } from '@/core/gamepad/poller'
import { Badge, Button, Card, Slider } from '@/components/ui'
import { useSampled } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'
import { fx } from '@/state/fx'

const PRESETS = [
  { label: 'Heavy only', strong: 1, weak: 0 },
  { label: 'Light only', strong: 0, weak: 1 },
  { label: 'Both', strong: 1, weak: 1 },
  { label: 'Gentle', strong: 0.3, weak: 0.3 },
]

export function Haptics() {
  const pad = useActivePad()
  const hid = useStore((s) => s.hid)
  const gp = useSampled(() => (pad ? getGamepad(pad.index) : null), 2)
  const caps = hapticCaps(gp)
  const [strong, setStrong] = useState(1)
  const [weak, setWeak] = useState(0.5)
  const [lt, setLt] = useState(0.5)
  const [rt, setRt] = useState(0.5)
  const [duration, setDuration] = useState(800)
  const [result, setResult] = useState('')
  const ring = useRef<ProgressRingHandle>(null)
  const stopRing = useRef<(() => void) | null>(null)
  const runRing = (ms: number) => {
    stopRing.current?.()
    const t0 = performance.now()
    const off = onRaf(() => {
      const p = Math.min(1, (performance.now() - t0) / ms)
      ring.current?.set(p)
      if (p >= 1) off()
    })
    stopRing.current = () => { off(); ring.current?.set(0) }
  }
  const fire = async (s: number, w: number, l = 0, r = 0) => {
    setResult('playing…')
    runRing(duration)
    fx.emit('rumble', { strong: s, weak: w, lt: l, rt: r, durationMs: duration })
    const res = await rumble(pad ? getGamepad(pad.index) : null, { duration, strong: s, weak: w, leftTrigger: l, rightTrigger: r })
    setResult(res)
  }
  const fireHid = async (s: number, w: number) => {
    if (!hid) return
    setResult('HID rumble…')
    runRing(duration)
    try {
      await hid.rumble(s, w)
      setTimeout(() => void hid.rumble(0, 0).then(() => setResult('complete')).catch((e: Error) => setResult(e.message)), duration)
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e))
    }
  }
  const family = pad ? identify(pad.id).family : 'generic'
  return (
    <div className="stack">
      <Card>
        <ControllerModel family={family} edge={!!hid?.caps.edge} compact />
        <p className="small muted" style={{ textAlign: 'center' }}>The model shakes and the grips glow for whichever motor is running.</p>
      </Card>
    <div className="grid-2">
      <Card title="Rumble (Gamepad API)" right={<div className="row"><ProgressRing ref={ring} size={28} stroke={4} />{caps.dual ? <Badge tone="good">supported</Badge> : <Badge tone="bad">not supported here</Badge>}</div>}>
        <Slider label="Strong motor (left, low-frequency)" value={strong} onChange={setStrong} format={(v) => `${Math.round(v * 100)} %`} />
        <Slider label="Weak motor (right, high-frequency)" value={weak} onChange={setWeak} format={(v) => `${Math.round(v * 100)} %`} />
        <Slider label="Duration" value={duration} min={100} max={3000} step={100} onChange={setDuration} format={(v) => `${v} ms`} />
        <div className="row">
          <Button primary disabled={!caps.dual} onClick={() => fire(strong, weak)}>Play</Button>
          {PRESETS.map((p) => <Button key={p.label} small disabled={!caps.dual} onClick={() => fire(p.strong, p.weak)}>{p.label}</Button>)}
          <Button small onClick={() => { fx.emit('stop', undefined); stopRing.current?.(); void stopRumble(pad ? getGamepad(pad.index) : null) }}>Stop</Button>
        </div>
        {result && <p className="small mono muted">result: {result}</p>}
        <p className="small muted">Firefox and Safari expose little or no rumble. Chrome and Edge are the most complete. On DualSense over Bluetooth, use Pro Mode rumble below if this does nothing.</p>
      </Card>
      <Card title="Trigger rumble" right={caps.trigger ? <Badge tone="good">supported</Badge> : <Badge>unsupported</Badge>}>
        <Slider label="Left trigger" value={lt} onChange={setLt} format={(v) => `${Math.round(v * 100)} %`} />
        <Slider label="Right trigger" value={rt} onChange={setRt} format={(v) => `${Math.round(v * 100)} %`} />
        <div className="row">
          <Button primary disabled={!caps.trigger} onClick={() => fire(0, 0, lt, rt)}>Play triggers</Button>
          <Button small disabled={!caps.trigger} onClick={() => fire(strong, weak, lt, rt)}>Play all four</Button>
        </div>
        <p className="small muted">Xbox impulse triggers via Chrome 126+ on Windows and macOS (Linux and ChromeOS over Bluetooth only). For DualSense adaptive triggers use Pro Mode.</p>
      </Card>
      {hid?.caps.rumble && (
        <Card title={`Rumble via WebHID (${hid.label})`} right={<Badge tone="accent">Pro Mode</Badge>}>
          <div className="row">
            <Button primary onClick={() => fireHid(strong, weak)}>Play</Button>
            {PRESETS.map((p) => <Button key={p.label} small onClick={() => fireHid(p.strong, p.weak)}>{p.label}</Button>)}
            <Button small onClick={() => hid.rumble(0, 0)}>Stop</Button>
          </div>
          <p className="small muted">Writes the motor bytes directly, so it works on Bluetooth and in browsers whose Gamepad API rumble is missing.</p>
        </Card>
      )}
    </div>
    </div>
  )
}
