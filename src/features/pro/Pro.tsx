import { Fragment, useEffect, useRef, useState } from 'react'
import type { HidController, HidState, MicLedMode } from '@/core/hid/controller'
import { hex, type HidLogEntry } from '@/core/hid/log'
import { PLAYER_LED } from '@/core/hid/dualsense/output'
import { webHidSupported } from '@/core/hid/registry'
import { Badge, Button, Card, Metric, Slider, Tabs, Toggle } from '@/components/ui'
import { ControllerModel } from '@/features/model/ControllerModel'
import { smooth, onRaf } from '@/lib/motion'
import { useAddDevice, useHidState, useReopenGranted, useSampled } from '@/state/hooks'
import { useStore } from '@/state/store'
import { build, defaults, PARAMS, type Mode } from './triggerParams'
import { Audio } from './Audio'
import './pro.css'

const logTo = () => useStore.getState().pushHidLog
/** Run a controller command and route failures into the HID console instead of the void. */
const run = (p: Promise<unknown>) => p.catch((e: unknown) => logTo()({ t: performance.now(), dir: 'error', note: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }))

function Connect() {
  const { busy, err, add } = useAddDevice()
  useReopenGranted()
  return (
    <Card title="Pro Mode (WebHID)">
      <p className="muted">Talk to the controller directly for what the Gamepad API can't reach: adaptive triggers, lightbar, player LEDs, mic LED, touchpad, gyro and accelerometer, battery, firmware and factory data. DualSense, DualSense Edge and DualShock 4 over USB or Bluetooth in Chrome and Edge.</p>
      <div className="row"><Button primary data-pulse="" disabled={busy} onClick={() => void add()}>Add device</Button>{err && <span className="small" style={{ color: 'var(--bad)' }}>{err}</span>}</div>
      <p className="small dim">If nothing shows up, close Steam, PS Remote Play, DS4Windows or reWASD: they grab the HID reports first. Bluetooth pads start in a reduced mode; the app switches them to full reports automatically.</p>
    </Card>
  )
}

/** Live state of every connected pad, sampled for the device list. */
function useAllStates(hids: HidController[]) {
  const states = useRef(new Map<HidController, HidState>())
  useEffect(() => {
    const offs = hids.map((h) => h.subscribe((s) => states.current.set(h, s)))
    return () => offs.forEach((o) => o())
  }, [hids])
  return useSampled(() => new Map(states.current), 2)
}

function Devices() {
  const hids = useStore((s) => s.hids)
  const active = useStore((s) => s.activeHid)
  const setActive = useStore((s) => s.setActiveHid)
  const removeHid = useStore((s) => s.removeHid)
  const states = useAllStates(hids)
  const { err, add } = useAddDevice()
  useEffect(() => {
    const onDisconnect = (e: HIDConnectionEvent) => {
      const i = useStore.getState().hids.findIndex((h) => h.device === e.device)
      if (i >= 0) { void useStore.getState().hids[i]!.close(); removeHid(i) }
    }
    navigator.hid.addEventListener('disconnect', onDisconnect)
    return () => navigator.hid.removeEventListener('disconnect', onDisconnect)
  }, [removeHid])
  return (
    <Card title="Devices" right={<Button primary small onClick={() => void add()}>Add device</Button>}>
      <div className="stack">
        {hids.map((h, i) => {
          const s = states.get(h)
          return (
            <div key={i} className={`device ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActive(i)}>
              <div className="stack" style={{ gap: 2 }}>
                <strong>{h.label}</strong>
                <span className="row small muted">
                  <Badge tone={h.transport === 'unknown' ? 'ok' : 'accent'}>{h.transport === 'unknown' ? 'detecting…' : h.transport.toUpperCase()}</Badge>
                  {s && <span>{s.battery.percent} % {s.battery.state === 'charging' ? '⚡' : ''}</span>}
                  {h.caps.edge && <Badge>Edge</Badge>}
                </span>
              </div>
              <Button small onClick={(e) => { e.stopPropagation(); void h.close(); removeHid(i) }} aria-label={`Disconnect ${h.label}`}>✕</Button>
            </div>
          )
        })}
      </div>
      {err && <span className="small" style={{ color: 'var(--bad)' }}>{err}</span>}
    </Card>
  )
}

function InputPanel({ hid }: { hid: HidController }) {
  const last = useRef<HidState | null>(null)
  const cells = useRef<Map<string, HTMLElement>>(new Map())
  const bars = useRef<Record<string, HTMLElement | null>>({})
  useHidState((s) => {
    last.current = s
    for (const [k, v] of Object.entries(s.buttons)) cells.current.get(k)?.setAttribute('data-on', String(v))
    bars.current.l2?.style.setProperty('width', `${(s.triggers.l2 / 255) * 100}%`)
    bars.current.r2?.style.setProperty('width', `${(s.triggers.r2 / 255) * 100}%`)
  })
  const v = useSampled(() => last.current, 8)
  const [showHex, setShowHex] = useState(false)
  const buttons = v ? Object.keys(v.buttons) : []
  return (
    <div className="stack">
      {v && (
        <div className="metrics">
          <Metric label="LX" value={v.sticks.lx} /><Metric label="LY" value={v.sticks.ly} /><Metric label="RX" value={v.sticks.rx} /><Metric label="RY" value={v.sticks.ry} />
          <Metric label="Hat" value={v.hat === 8 ? '–' : v.hat} /><Metric label="Seq" value={String(v.extra.seq ?? '–')} />
          {hid.caps.edge && <Metric label="Profile" value={String(v.extra.profile ?? '–')} />}
          {hid.caps.edge && <Metric label="Trigger stops" value={String(v.extra.triggerLevel ?? '–')} />}
        </div>
      )}
      <div className="row"><span className="mono small" style={{ width: 28 }}>L2</span><div className="bar" style={{ flex: 1 }}><i ref={(el) => { bars.current.l2 = el }} /></div><span className="mono small" style={{ width: 32, textAlign: 'right' }}>{v?.triggers.l2 ?? 0}</span></div>
      <div className="row"><span className="mono small" style={{ width: 28 }}>R2</span><div className="bar" style={{ flex: 1 }}><i ref={(el) => { bars.current.r2 = el }} /></div><span className="mono small" style={{ width: 32, textAlign: 'right' }}>{v?.triggers.r2 ?? 0}</span></div>
      <div className="btn-grid">
        {buttons.map((b) => <div key={b} ref={(el) => { if (el) cells.current.set(b, el) }} className="btn-cell" data-on="false"><span className="name">{b}</span></div>)}
      </div>
      {v && (
        <div className="metrics">
          <Metric label="Battery" value={`${v.battery.percent} %`} tone={v.battery.percent > 30 ? 'good' : v.battery.percent > 10 ? 'ok' : 'bad'} />
          <Metric label="State" value={v.battery.state} />
          <Metric label="USB" value={v.flags.usb ? 'yes' : 'no'} />
          <Metric label="Headset" value={v.flags.headphones ? 'yes' : 'no'} />
          <Metric label="Mic" value={v.flags.mic ? 'plugged' : v.extra.micMuted ? 'muted' : 'built-in'} />
        </div>
      )}
      <Toggle label="Show raw report" checked={showHex} onChange={setShowHex} />
      {showHex && v && <pre className="hex">[{v.reportId.toString(16).padStart(2, '0')}] {hex(v.raw, 96)}</pre>}
    </div>
  )
}

function FactoryPanel({ hid }: { hid: HidController }) {
  const [info, setInfo] = useState<Record<string, string>>({})
  const [factory, setFactory] = useState<Record<string, string | number | undefined> | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void hid.info().then(setInfo) }, [hid])
  const read = async () => {
    if (!hid.factory) return
    setBusy(true)
    setFactory(await hid.factory().catch(() => ({})))
    setBusy(false)
  }
  const rows = { ...info, ...(factory ?? {}) }
  return (
    <div className="stack">
      <dl className="kv">
        {Object.entries(rows).filter(([k]) => k !== 'product').map(([k, val]) => <Fragment key={k}><dt>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt><dd className="mono">{val === undefined ? '–' : k === 'batteryMv' ? `${val} mV` : String(val)}</dd></Fragment>)}
      </dl>
      {hid.factory ? <div><Button small primary disabled={busy} onClick={() => void read()}>{busy ? 'Reading…' : factory ? 'Read again' : 'Read factory data'}</Button></div> : <p className="small muted">Factory data is only available on DualSense controllers.</p>}
      <p className="small dim">Serial, PCBA id, MCU id, Bluetooth address, battery voltage and touchpad firmware come from Sony's factory command channel; a field stays empty when the controller refuses that command.</p>
    </div>
  )
}

function Console({ hid }: { hid: HidController }) {
  const log = useStore((s) => s.hidLog)
  const clear = useStore((s) => s.clearHidLog)
  const fmt = (e: HidLogEntry) => `${(e.t / 1000).toFixed(3)}  ${e.dir.padEnd(11)} ${e.reportId !== undefined ? `0x${e.reportId.toString(16).padStart(2, '0')} ` : ''}${e.note ?? ''}${e.ms !== undefined ? ` (${e.ms.toFixed(1)} ms)` : ''}${e.bytes ? `\n    ${hex(e.bytes)}` : ''}`
  const text = log.map(fmt).join('\n')
  const errors = log.filter((e) => e.dir === 'error').length
  return (
    <div className="stack">
      <div className="row">
        {errors ? <Badge tone="bad">{errors} errors</Badge> : <Badge tone="good">no errors</Badge>}
        <Button small onClick={() => navigator.clipboard.writeText(text)}>Copy</Button><Button small onClick={clear}>Clear</Button>
      </div>
      <div className="row">
        <span className="small muted">Test packets:</span>
        <Button small onClick={() => run(hid.setLightbar([255, 0, 0]))}>Lightbar red</Button>
        <Button small onClick={() => { run(hid.rumble(1, 1)); setTimeout(() => run(hid.rumble(0, 0)), 300) }}>Rumble 300 ms</Button>
        {hid.caps.playerLeds && <Button small onClick={() => run(hid.setPlayerLeds(0b00100, 0))}>LED P1</Button>}
        {hid.caps.adaptiveTriggers && <Button small onClick={() => run(hid.setTrigger('left', new Uint8Array([0x21, 0xfc, 0x03, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0])))}>L2 stiff</Button>}
        {hid.caps.adaptiveTriggers && <Button small onClick={() => run(hid.setTrigger('left', new Uint8Array([0x05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])))}>L2 release</Button>}
      </div>
      <pre className="hex" style={{ maxHeight: 260 }}>{text || 'Every report sent to or received from the controller shows up here with its bytes. If something on the controller does not react, copy this and report it.'}</pre>
    </div>
  )
}

function Motion({ hid }: { hid: HidController }) {
  const cube = useRef<HTMLDivElement>(null)
  const last = useRef<HidState | null>(null)
  const cur = useRef({ roll: 0, pitch: 0 })
  useHidState((s) => { last.current = s })
  useEffect(() => onRaf(() => {
    const s = last.current
    if (!s || !cube.current) return
    const [ax, ay, az] = s.accelG
    const roll = (Math.atan2(ax, ay) * 180) / Math.PI
    const pitch = (Math.atan2(az, ay) * 180) / Math.PI
    const c = cur.current
    c.roll = smooth(c.roll, roll, 0.18)
    c.pitch = smooth(c.pitch, pitch, 0.18)
    cube.current.style.transform = `rotateX(${(-c.pitch).toFixed(2)}deg) rotateZ(${(-c.roll).toFixed(2)}deg)`
  }), [hid])
  const v = useSampled(() => last.current, 6)
  return (
    <Card title="Motion">
      <div className="cube-wrap"><div ref={cube} className="cube"><i /><i /><i /><i /><i /><i /></div></div>
      {v && (
        <div className="metrics">
          <Metric label="Gyro °/s" value={v.gyroDps.map((g) => g.toFixed(0)).join(' ')} />
          <Metric label="Accel g" value={v.accelG.map((g) => g.toFixed(2)).join(' ')} />
          <Metric label="Sensor clock" value={`${(v.sensorTs / 1e6).toFixed(2)} s`} />
        </div>
      )}
      <p className="small dim">Orientation from the accelerometer; gyro is factory-calibrated when the controller provided a calibration report.</p>
    </Card>
  )
}

const SWATCHES = ['#2f6df6', '#f25757', '#34c77b', '#f2b53a', '#c04cf2', '#ffffff']
const hexToRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

function Lightbar({ hid }: { hid: HidController }) {
  const out = useStore((s) => s.hidOut)
  const color = out.lightbar ? `#${out.lightbar.map((c) => c.toString(16).padStart(2, '0')).join('')}` : '#000000'
  const [rainbow, setRainbow] = useState(false)
  const [on, setOn] = useState(200)
  const [off, setOff] = useState(200)
  useEffect(() => {
    if (!rainbow) return
    let hue = 0
    const id = setInterval(() => {
      hue = (hue + 6) % 360
      const k = (n: number) => { const x = (n + hue / 30) % 12; return Math.round(255 * (0.5 - 0.5 * Math.max(-1, Math.min(x - 3, 9 - x, 1)))) }
      run(hid.setLightbar([k(0), k(8), k(4)]))
    }, 60)
    return () => clearInterval(id)
  }, [rainbow, hid])
  return (
    <div className="stack">
      <div className="row">
        <input type="color" value={color} onChange={(e) => { setRainbow(false); run(hid.setLightbar(hexToRgb(e.target.value))) }} aria-label="Lightbar colour" />
        {SWATCHES.map((s) => <button key={s} className="swatch" style={{ background: s, boxShadow: color === s ? `0 0 0 2px var(--fg)` : undefined }} onClick={() => { setRainbow(false); run(hid.setLightbar(hexToRgb(s))) }} aria-label={s} />)}
        <Button small onClick={() => { setRainbow(false); run(hid.setLightbar(null)) }}>Off</Button>
        <Toggle label="Rainbow" checked={rainbow} onChange={setRainbow} />
      </div>
      {hid.caps.lightbarFlash && (
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}><Slider label="Flash on" value={on} min={0} max={2550} step={10} onChange={setOn} format={(x) => `${x} ms`} /></div>
          <div style={{ flex: 1, minWidth: 140 }}><Slider label="Flash off" value={off} min={0} max={2550} step={10} onChange={setOff} format={(x) => `${x} ms`} /></div>
          <Button small onClick={() => run(hid.setLightbarFlash(on, off))}>Flash</Button><Button small onClick={() => run(hid.setLightbarFlash(0, 0))}>Stop</Button>
        </div>
      )}
    </div>
  )
}

function PlayerLeds({ hid }: { hid: HidController }) {
  const out = useStore((s) => s.hidOut.playerLeds)
  const set = (m: number, b = out.brightness) => run(hid.setPlayerLeds(m, b))
  return (
    <div className="row">
      <div className="leds">{[0, 1, 2, 3, 4].map((i) => <button key={i} className="led" data-on={!!(out.mask & (1 << i))} onClick={() => set(out.mask ^ (1 << i))} aria-label={`LED ${i + 1}`} />)}</div>
      {PLAYER_LED.map((m, i) => <Button key={i} small onClick={() => set(m)}>P{i + 1}</Button>)}
      <Button small onClick={() => set(0)}>Off</Button>
      <select className="select" value={out.brightness} onChange={(e) => set(out.mask, Number(e.target.value) as 0 | 1 | 2)} aria-label="Brightness">
        <option value={0}>bright</option><option value={1}>medium</option><option value={2}>dim</option>
      </select>
    </div>
  )
}

function MicLed({ hid }: { hid: HidController }) {
  const mode = useStore((s) => s.hidOut.micLed)
  return <div className="row">{(['off', 'on', 'pulse'] as MicLedMode[]).map((m) => <Button key={m} small primary={mode === m} onClick={() => run(hid.setMicLed(m))}>{m}</Button>)}</div>
}

function Rumble({ hid }: { hid: HidController }) {
  const [strong, setStrong] = useState(1)
  const [weak, setWeak] = useState(0.5)
  const [duration, setDuration] = useState(800)
  const play = (s: number, w: number) => { run(hid.rumble(s, w)); setTimeout(() => run(hid.rumble(0, 0)), duration) }
  return (
    <div className="row" style={{ alignItems: 'flex-end' }}>
      <div style={{ flex: 1, minWidth: 140 }}><Slider label="Strong (left)" value={strong} onChange={setStrong} format={(v) => `${Math.round(v * 100)} %`} /></div>
      <div style={{ flex: 1, minWidth: 140 }}><Slider label="Weak (right)" value={weak} onChange={setWeak} format={(v) => `${Math.round(v * 100)} %`} /></div>
      <div style={{ flex: 1, minWidth: 120 }}><Slider label="Duration" value={duration} min={100} max={3000} step={100} onChange={setDuration} format={(v) => `${v} ms`} /></div>
      <Button primary small onClick={() => play(strong, weak)}>Play</Button>
      <Button small onClick={() => play(1, 0)}>Strong</Button>
      <Button small onClick={() => play(0, 1)}>Weak</Button>
      <Button small onClick={() => run(hid.rumble(0, 0))}>Stop</Button>
    </div>
  )
}

function Trigger({ hid, side, status, engaged }: { hid: HidController; side: 'left' | 'right'; status?: number | boolean; engaged: boolean }) {
  const [mode, setMode] = useState<Mode>('feedback')
  const [vals, setVals] = useState<Record<string, number>>(defaults('feedback'))
  const change = (m: Mode) => { setMode(m); setVals(defaults(m)) }
  return (
    <div className="stack">
      <div className="row">
        <strong>{side === 'left' ? 'L2' : 'R2'}</strong>
        <Badge tone={engaged ? 'good' : ''}>{engaged ? 'effect engaged' : `status ${status ?? '–'}`}</Badge>
        {(Object.keys(PARAMS) as Mode[]).map((m) => <Button key={m} small primary={m === mode} onClick={() => change(m)}>{m}</Button>)}
      </div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        {PARAMS[mode].map((p) => (
          <div key={p.key} style={{ flex: 1, minWidth: 120 }}><Slider label={p.label} value={vals[p.key] ?? p.def} min={p.min} max={p.max} step={1} onChange={(x) => setVals({ ...vals, [p.key]: x })} /></div>
        ))}
        <Button primary small onClick={() => run(hid.setTrigger(side, build(mode, vals)))}>Apply</Button>
        <Button small onClick={() => run(hid.setTrigger(side, build('off', {})))}>Release</Button>
      </div>
    </div>
  )
}

function Output({ hid }: { hid: HidController }) {
  const last = useRef<HidState | null>(null)
  useHidState((s) => { last.current = s })
  const v = useSampled(() => last.current, 4)
  const row = (label: string, body: React.ReactNode) => (
    <tr><td className="label">{label}</td><td>{body}</td></tr>
  )
  return (
    <Card title="Output">
      <table className="table out">
        <tbody>
          {hid.caps.micLed && row('Mic LED', <MicLed hid={hid} />)}
          {hid.caps.lightbar && row('Lightbar', <Lightbar hid={hid} />)}
          {hid.caps.playerLeds && row('Player LEDs', <PlayerLeds hid={hid} />)}
          {hid.caps.rumble && row('Rumble', <Rumble hid={hid} />)}
          {hid.caps.adaptiveTriggers && row('Adaptive trigger', <Trigger hid={hid} side="left" status={v?.extra.l2Status} engaged={!!v?.extra.l2Engaged} />)}
          {hid.caps.adaptiveTriggers && row('', <Trigger hid={hid} side="right" status={v?.extra.r2Status} engaged={!!v?.extra.r2Engaged} />)}
        </tbody>
      </table>
    </Card>
  )
}

type Panel = 'input' | 'factory' | 'console'

function Workspace({ hid }: { hid: HidController }) {
  const hids = useStore((s) => s.hids)
  const [panel, setPanel] = useState<Panel>('input')
  const [showValues, setShowValues] = useState(true)
  const [compare, setCompare] = useState(false)
  const models = compare && hids.length > 1 ? hids : [hid]
  return (
    <div className="pro">
      <aside className="stack">
        <Devices />
        <Card>
          <Tabs tabs={[{ id: 'input', label: 'Input' }, { id: 'factory', label: 'Factory' }, { id: 'console', label: 'Console' }]} value={panel} onChange={setPanel} ink="panel-ink" />
          {panel === 'input' && <InputPanel hid={hid} />}
          {panel === 'factory' && <FactoryPanel key={hid.label + hids.indexOf(hid)} hid={hid} />}
          {panel === 'console' && <Console hid={hid} />}
        </Card>
      </aside>
      <section className="stack">
        <Card title={hid.label} right={<div className="row"><Toggle label="Show values" checked={showValues} onChange={setShowValues} />{hids.length > 1 && <Toggle label="Compare" checked={compare} onChange={setCompare} />}</div>}>
          <div className={models.length > 1 ? 'grid-2' : undefined}>
            {models.map((h, i) => <ControllerModel key={i} family={h.family} edge={h.caps.edge} showValues={showValues} compact={models.length > 1} />)}
          </div>
        </Card>
        {hid.caps.motion && <Motion hid={hid} />}
        <Output hid={hid} />
        {hid.family === 'dualsense' && <Audio hid={hid} />}
      </section>
    </div>
  )
}

export function Pro() {
  const hid = useStore((s) => s.hid)
  if (!webHidSupported()) {
    return (
      <Card title="Pro Mode (WebHID)">
        <p className="muted">This browser has no WebHID. Pro Mode needs desktop Chrome or Edge. Everything on the other tabs still works here.</p>
      </Card>
    )
  }
  return hid ? <Workspace hid={hid} /> : <Connect />
}
