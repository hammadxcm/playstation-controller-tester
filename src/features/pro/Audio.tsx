import { useEffect, useRef, useState } from 'react'
import type { AudioPath, HidController } from '@/core/hid/controller'
import {
  audioSupported,
  createMicMeter,
  createPlayer,
  findControllerAudio,
  type AudioDevices,
  type MicMeter,
  type Player,
} from '@/core/audio/usbAudio'
import { Badge, Button, Card, Slider, Toggle } from '@/components/ui'
import { onRaf } from '@/lib/motion'
import { useStore } from '@/state/store'

const logTo = () => useStore.getState().pushHidLog
const run = (p: Promise<unknown>) =>
  p.catch((e: unknown) =>
    logTo()({
      t: performance.now(),
      dir: 'error',
      note: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    }),
  )

/** Speaker, headphone and microphone tests over the controller's USB sound card. */
export function Audio({ hid }: { hid: HidController }) {
  const [devices, setDevices] = useState<AudioDevices | null>(null)
  const [sink, setSink] = useState('')
  const [mic, setMic] = useState('')
  const [err, setErr] = useState('')
  const player = useRef<Player | null>(null)
  const meter = useRef<MicMeter | null>(null)
  const bar = useRef<HTMLElement>(null)
  const [metering, setMetering] = useState(false)
  const [haptics, setHaptics] = useState(false)
  const audio = useStore((s) => s.hidOut.audio) ?? {
    path: 'headphones' as AudioPath,
    headphoneVolume: 0.6,
    speakerVolume: 0.6,
    micVolume: 0.6,
  }
  const usb = hid.transport === 'usb'

  const scan = async () => {
    setErr('')
    try {
      const d = await findControllerAudio()
      setDevices(d)
      setSink((s) => s || d.outputs[0]?.deviceId || '')
      setMic((m) => m || d.inputs[0]?.deviceId || '')
      if (!d.outputs.length)
        setErr(
          'No controller sound card found. Audio needs a USB connection; Bluetooth audio is not supported here.',
        )
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }
  const ensurePlayer = async () => {
    if (player.current) return player.current
    player.current = await createPlayer(sink)
    player.current.graph.haptics.gain.value = haptics ? 1 : 0
    return player.current
  }
  useEffect(() => {
    if (player.current) player.current.graph.haptics.gain.value = haptics ? 1 : 0
  }, [haptics])
  useEffect(
    () => () => {
      void player.current?.close()
      meter.current?.stop()
    },
    [],
  )
  useEffect(() => {
    if (!metering) return
    return onRaf(() => {
      bar.current?.style.setProperty('width', `${(meter.current?.level() ?? 0) * 100}%`)
    })
  }, [metering])

  const setAudio = (patch: Partial<typeof audio>) =>
    hid.setAudio && run(hid.setAudio({ ...audio, ...patch }))
  const tone = (hz: number) => run(ensurePlayer().then((p) => p.tone(hz, 1000)))
  const playFile = (f: File) =>
    run(f.arrayBuffer().then((b) => ensurePlayer().then((p) => p.file(b))))
  const toggleMeter = async () => {
    if (metering) {
      meter.current?.stop()
      meter.current = null
      setMetering(false)
      return
    }
    try {
      meter.current = await createMicMeter(mic)
      setMetering(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  if (!audioSupported()) {
    return (
      <Card title="Audio">
        <p className="muted">
          Speaker and mic tests need Web Audio output selection, which only desktop Chrome and Edge
          provide.
        </p>
      </Card>
    )
  }
  return (
    <Card
      title="Audio"
      right={usb ? <Badge tone="good">USB</Badge> : <Badge tone="ok">USB only</Badge>}
    >
      {!devices ? (
        <div className="row">
          <Button primary small onClick={() => void scan()} disabled={!usb}>
            Find controller sound card
          </Button>
          <span className="small muted">
            Asks for microphone permission once so device names become visible.
          </span>
        </div>
      ) : (
        <div className="stack">
          <div className="row">
            <select
              className="select"
              value={sink}
              onChange={(e) => {
                setSink(e.target.value)
                void player.current?.close()
                player.current = null
              }}
              aria-label="Output device"
            >
              {devices.outputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            <Button small onClick={() => tone(440)} disabled={!sink}>
              Tone 440 Hz
            </Button>
            <Button small onClick={() => tone(120)} disabled={!sink}>
              Bass 120 Hz
            </Button>
            <label className="btn btn-sm">
              Play file
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => e.target.files?.[0] && playFile(e.target.files[0])}
              />
            </label>
            <Button small onClick={() => player.current?.stop()}>
              Stop
            </Button>
            <Toggle
              label="Also drive haptic motors (ch 3/4)"
              checked={haptics}
              onChange={setHaptics}
            />
          </div>
          {hid.setAudio && (
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <span className="small muted">Route to</span>
              {(['headphones', 'speaker', 'both'] as AudioPath[]).map((p) => (
                <Button
                  key={p}
                  small
                  primary={audio.path === p}
                  onClick={() => setAudio({ path: p })}
                >
                  {p}
                </Button>
              ))}
              <div style={{ flex: 1, minWidth: 140 }}>
                <Slider
                  label="Speaker volume"
                  value={audio.speakerVolume}
                  onChange={(v) => setAudio({ speakerVolume: v })}
                  format={(v) => `${Math.round(v * 100)} %`}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <Slider
                  label="Headphone volume"
                  value={audio.headphoneVolume}
                  onChange={(v) => setAudio({ headphoneVolume: v })}
                  format={(v) => `${Math.round(v * 100)} %`}
                />
              </div>
            </div>
          )}
          <div className="row">
            <select
              className="select"
              value={mic}
              onChange={(e) => setMic(e.target.value)}
              aria-label="Microphone"
            >
              {devices.inputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            <Button small primary={metering} onClick={() => void toggleMeter()} disabled={!mic}>
              {metering ? 'Stop mic meter' : 'Mic level meter'}
            </Button>
            <div className="bar" style={{ flex: 1, minWidth: 120 }}>
              <i ref={bar} />
            </div>
            {hid.setAudio && (
              <div style={{ minWidth: 140 }}>
                <Slider
                  label="Mic gain"
                  value={audio.micVolume}
                  onChange={(v) => setAudio({ micVolume: v })}
                  format={(v) => `${Math.round(v * 100)} %`}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {err && (
        <p className="small" style={{ color: 'var(--bad)' }}>
          {err}
        </p>
      )}
      <p className="small dim">
        Over USB the DualSense is a 4-channel sound card: channels 1/2 are audio (speaker or
        headset, chosen with the routing buttons), channels 3/4 drive the haptic motors. Bluetooth
        audio needs an Opus stream and is out of scope.
      </p>
    </Card>
  )
}
