import { Fragment, useEffect, useRef, useState } from 'react'
import type { HidController, HidState, MicLedMode } from '@/core/hid/controller'
import { PLAYER_LED } from '@/core/hid/dualsense/output'
import { reopenGranted, requestController, webHidSupported } from '@/core/hid/registry'
import { Badge, Button, Card, Metric, Slider, Toggle } from '@/components/ui'
import { hex, type HidLogEntry } from '@/core/hid/log'
import { useHidState, useSampled } from '@/state/hooks'
import { useStore } from '@/state/store'
import { build, defaults, PARAMS, type Mode } from './triggerParams'

const hexdump = (u: Uint8Array) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join(' ')
const logTo = () => useStore.getState().pushHidLog
/** Run a controller command and route failures into the HID console instead of the void. */
const run = (p: Promise<unknown>) => p.catch((e: unknown) => logTo()({ t: performance.now(), dir: 'error', note: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }))

function Connect() {
  const setHid = useStore((s) => s.setHid)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { void reopenGranted(logTo()).then((cs) => cs[0] && setHid(cs[0])) }, [setHid])
  const connect = async () => {
    setBusy(true)
    setErr('')
    try {
      const c = await requestController(logTo())
      if (c) setHid(c)
      else setErr('No controller selected.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title="Pro Mode (WebHID)">
      <p className="muted">Talk to the controller directly for the things the Gamepad API can't reach: adaptive triggers, lightbar, player LEDs, mic LED, touchpad, gyro and accelerometer, battery and firmware. Works with DualSense, DualSense Edge and DualShock 4 over USB or Bluetooth in Chrome and Edge.</p>
      <div className="row"><Button primary disabled={busy} onClick={connect}>Connect controller</Button>{err && <span className="small" style={{ color: 'var(--bad)' }}>{err}</span>}</div>
      <p className="small dim">If nothing shows up, close Steam, PS Remote Play, DS4Windows or reWASD: they grab the HID reports first. Bluetooth pads start in a reduced mode; the app switches them to full reports automatically.</p>
    </Card>
  )
}

function Panel({ hid }: { hid: HidController }) {
  const setHid = useStore((s) => s.setHid)
  const last = useRef<HidState | null>(null)
  const [info, setInfo] = useState<Record<string, string>>({})
  const [showHex, setShowHex] = useState(false)
  const touch = useRef<HTMLCanvasElement>(null)
  const cube = useRef<HTMLDivElement>(null)
  const cells = useRef<Map<string, HTMLElement>>(new Map())
  const bars = useRef<Record<string, HTMLElement | null>>({})
  const hex = useRef<HTMLPreElement>(null)
  const caps = hid.caps

  useEffect(() => { void hid.info().then(setInfo) }, [hid])
  useEffect(() => {
    const onDisconnect = (e: HIDConnectionEvent) => { if (e.device === hid.device) { void hid.close(); setHid(null) } }
    navigator.hid.addEventListener('disconnect', onDisconnect)
    return () => navigator.hid.removeEventListener('disconnect', onDisconnect)
  }, [hid, setHid])

  useHidState((s) => {
    last.current = s
    for (const [k, v] of Object.entries(s.buttons)) cells.current.get(k)?.setAttribute('data-on', String(v))
    bars.current.l2?.style.setProperty('width', `${(s.triggers.l2 / 255) * 100}%`)
    bars.current.r2?.style.setProperty('width', `${(s.triggers.r2 / 255) * 100}%`)
    if (touch.current && caps.touchpad) {
      const c = touch.current
      const ctx = c.getContext('2d')!
      if (c.width !== c.clientWidth * devicePixelRatio) { c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio }
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, 0, c.width, c.height)
      s.touches.forEach((t, i) => {
        if (!t.active) return
        ctx.fillStyle = i ? '#f2b53a' : '#2f6df6'
        ctx.beginPath(); ctx.arc(t.x * c.width, t.y * c.height, 10 * devicePixelRatio, 0, Math.PI * 2); ctx.fill()
      })
    }
    if (cube.current && caps.motion) {
      const [ax, ay, az] = s.accelG
      const roll = (Math.atan2(ax, ay) * 180) / Math.PI
      const pitch = (Math.atan2(az, ay) * 180) / Math.PI
      cube.current.style.transform = `rotateX(${-pitch}deg) rotateZ(${-roll}deg)`
    }
    if (hex.current && showHex) hex.current.textContent = `[${s.reportId.toString(16).padStart(2, '0')}] ${hexdump(s.raw)}`
  })
  const v = useSampled(() => last.current, 8)
  const buttons = v ? Object.keys(v.buttons) : []
  const disconnect = () => { void hid.close(); setHid(null) }

  return (
    <div className="stack">
      <div className="grid">
        <Card title={hid.label} right={<Button small onClick={disconnect}>Disconnect</Button>}>
          <dl className="kv">
            <dt>Transport</dt><dd>{hid.transport === 'unknown' ? 'waiting for first report…' : hid.transport.toUpperCase()}</dd>
            {Object.entries(info).filter(([k]) => k !== 'transport' && k !== 'product').map(([k, val]) => <Fragment key={k}><dt>{k}</dt><dd className="mono">{val}</dd></Fragment>)}
            <dt>Report id</dt><dd className="mono">{v ? `0x${v.reportId.toString(16).padStart(2, '0')}` : '–'}</dd>
          </dl>
          {caps.battery && v && (
            <div className="metrics">
              <Metric label="Battery" value={`${v.battery.percent} %`} tone={v.battery.percent > 30 ? 'good' : v.battery.percent > 10 ? 'ok' : 'bad'} />
              <Metric label="State" value={v.battery.state} />
              <Metric label="USB" value={v.flags.usb ? 'yes' : 'no'} />
              <Metric label="Headset" value={v.flags.headphones ? 'yes' : 'no'} />
            </div>
          )}
          <Toggle label="Show raw report" checked={showHex} onChange={setShowHex} />
          {showHex && <pre ref={hex} className="hex" />}
        </Card>
        <Card title="Raw inputs">
          {v && (
            <div className="metrics">
              <Metric label="LX" value={v.sticks.lx} /><Metric label="LY" value={v.sticks.ly} />
              <Metric label="RX" value={v.sticks.rx} /><Metric label="RY" value={v.sticks.ry} />
              <Metric label="Hat" value={v.hat === 8 ? '–' : v.hat} />
            </div>
          )}
          <div className="row"><span className="mono small" style={{ width: 28 }}>L2</span><div className="bar" style={{ flex: 1 }}><i ref={(el) => { bars.current.l2 = el }} /></div><span className="mono small" style={{ width: 32, textAlign: 'right' }}>{v?.triggers.l2 ?? 0}</span></div>
          <div className="row"><span className="mono small" style={{ width: 28 }}>R2</span><div className="bar" style={{ flex: 1 }}><i ref={(el) => { bars.current.r2 = el }} /></div><span className="mono small" style={{ width: 32, textAlign: 'right' }}>{v?.triggers.r2 ?? 0}</span></div>
          <div className="btn-grid">
            {buttons.map((b) => <div key={b} ref={(el) => { if (el) cells.current.set(b, el) }} className="btn-cell" data-on="false"><span className="name">{b}</span></div>)}
          </div>
        </Card>
      </div>
      <div className="grid">
        {caps.touchpad && (
          <Card title="Touchpad">
            <canvas ref={touch} className="touch" />
            <p className="small muted">{v?.touches.filter((t) => t.active).map((t) => `#${t.id} ${(t.x * 1920).toFixed(0)},${(t.y * 1080).toFixed(0)}`).join('  ') || 'Touch the pad with one or two fingers.'}</p>
          </Card>
        )}
        {caps.motion && v && (
          <Card title="Motion">
            <div className="cube-wrap"><div ref={cube} className="cube"><i /><i /><i /><i /><i /><i /></div></div>
            <div className="metrics">
              <Metric label="Gyro °/s" value={v.gyroDps.map((g) => g.toFixed(0)).join(' ')} />
              <Metric label="Accel g" value={v.accelG.map((g) => g.toFixed(2)).join(' ')} />
            </div>
            <p className="small dim">Orientation from the accelerometer; gyro is factory-calibrated when the controller provided a calibration report.</p>
          </Card>
        )}
        {caps.lightbar && <Lightbar hid={hid} />}
        {caps.playerLeds && <PlayerLeds hid={hid} />}
        {caps.micLed && <MicLed hid={hid} />}
      </div>
      <Console hid={hid} />
      {caps.adaptiveTriggers && (
        <div className="grid-2">
          <Trigger hid={hid} side="left" status={v?.extra.l2Status} engaged={!!v?.extra.l2Engaged} />
          <Trigger hid={hid} side="right" status={v?.extra.r2Status} engaged={!!v?.extra.r2Engaged} />
        </div>
      )}
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
    <Card title="HID console" right={<div className="row">{errors ? <Badge tone="bad">{errors} errors</Badge> : <Badge tone="good">no errors</Badge>}<Button small onClick={() => navigator.clipboard.writeText(text)}>Copy</Button><Button small onClick={clear}>Clear</Button></div>}>
      <div className="row">
        <span className="small muted">Test packets:</span>
        <Button small onClick={() => run(hid.setLightbar([255, 0, 0]))}>Lightbar red</Button>
        <Button small onClick={() => { run(hid.rumble(1, 1)); setTimeout(() => run(hid.rumble(0, 0)), 300) }}>Rumble 300 ms</Button>
        {hid.caps.playerLeds && <Button small onClick={() => run(hid.setPlayerLeds(0b00100, 0))}>LED P1</Button>}
        {hid.caps.adaptiveTriggers && <Button small onClick={() => run(hid.setTrigger('left', new Uint8Array([0x21, 0xfc, 0x03, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0])))}>L2 stiff</Button>}
        {hid.caps.adaptiveTriggers && <Button small onClick={() => run(hid.setTrigger('left', new Uint8Array([0x05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])))}>L2 release</Button>}
      </div>
      <pre className="hex" style={{ maxHeight: 220 }}>{text || 'Every report sent to or received from the controller shows up here with its bytes. If something on the controller does not react, copy this and report it.'}</pre>
    </Card>
  )
}

const SWATCHES = ['#2f6df6', '#f25757', '#34c77b', '#f2b53a', '#c04cf2', '#ffffff']
const hexToRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

function Lightbar({ hid }: { hid: HidController }) {
  const [color, setColor] = useState('#2f6df6')
  const [on, setOn] = useState(200)
  const [off, setOff] = useState(200)
  const apply = (c: string) => { setColor(c); run(hid.setLightbar(hexToRgb(c))) }
  return (
    <Card title="Lightbar">
      <div className="row">
        <input type="color" value={color} onChange={(e) => apply(e.target.value)} aria-label="Lightbar colour" />
        {SWATCHES.map((s) => <button key={s} className="swatch" style={{ background: s }} onClick={() => apply(s)} aria-label={s} />)}
        <Button small onClick={() => run(hid.setLightbar(null))}>Off</Button>
      </div>
      {hid.caps.lightbarFlash && (
        <>
          <Slider label="Flash on" value={on} min={0} max={2550} step={10} onChange={setOn} format={(x) => `${x} ms`} />
          <Slider label="Flash off" value={off} min={0} max={2550} step={10} onChange={setOff} format={(x) => `${x} ms`} />
          <div className="row"><Button small onClick={() => run(hid.setLightbarFlash(on, off))}>Start flashing</Button><Button small onClick={() => run(hid.setLightbarFlash(0, 0))}>Stop</Button></div>
        </>
      )}
    </Card>
  )
}

function PlayerLeds({ hid }: { hid: HidController }) {
  const [mask, setMask] = useState(0)
  const [bright, setBright] = useState<0 | 1 | 2>(0)
  const set = (m: number, b = bright) => { setMask(m); run(hid.setPlayerLeds(m, b)) }
  return (
    <Card title="Player LEDs">
      <div className="leds">
        {[0, 1, 2, 3, 4].map((i) => <button key={i} className="led" data-on={!!(mask & (1 << i))} onClick={() => set(mask ^ (1 << i))} aria-label={`LED ${i + 1}`} />)}
      </div>
      <div className="row">
        {PLAYER_LED.map((m, i) => <Button key={i} small onClick={() => set(m)}>P{i + 1}</Button>)}
        <Button small onClick={() => set(0)}>Off</Button>
        <select className="select" value={bright} onChange={(e) => { const b = Number(e.target.value) as 0 | 1 | 2; setBright(b); set(mask, b) }} aria-label="Brightness">
          <option value={0}>bright</option><option value={1}>medium</option><option value={2}>dim</option>
        </select>
      </div>
    </Card>
  )
}

function MicLed({ hid }: { hid: HidController }) {
  return (
    <Card title="Mic LED">
      <div className="row">{(['off', 'on', 'pulse'] as MicLedMode[]).map((m) => <Button key={m} small onClick={() => run(hid.setMicLed(m))}>{m}</Button>)}</div>
    </Card>
  )
}

function Trigger({ hid, side, status, engaged }: { hid: HidController; side: 'left' | 'right'; status?: number | boolean; engaged: boolean }) {
  const [mode, setMode] = useState<Mode>('feedback')
  const [vals, setVals] = useState<Record<string, number>>(defaults('feedback'))
  const change = (m: Mode) => { setMode(m); setVals(defaults(m)) }
  return (
    <Card title={`${side === 'left' ? 'L2' : 'R2'} adaptive trigger`} right={<Badge tone={engaged ? 'good' : ''}>{engaged ? 'effect engaged' : `status ${status ?? '–'}`}</Badge>}>
      <div className="row">
        {(Object.keys(PARAMS) as Mode[]).map((m) => <Button key={m} small primary={m === mode} onClick={() => change(m)}>{m}</Button>)}
      </div>
      {PARAMS[mode].map((p) => (
        <Slider key={p.key} label={p.label} value={vals[p.key] ?? p.def} min={p.min} max={p.max} step={1} onChange={(x) => setVals({ ...vals, [p.key]: x })} />
      ))}
      <div className="row">
        <Button primary onClick={() => run(hid.setTrigger(side, build(mode, vals)))}>Apply</Button>
        <Button onClick={() => run(hid.setTrigger(side, build('off', {})))}>Release</Button>
      </div>
    </Card>
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
  return hid ? <Panel hid={hid} /> : <Connect />
}
