/**
 * DualSense over USB is a 4-channel USB sound card: channels 0/1 carry audio (headphones or
 * speaker, chosen through the HID audio path), channels 2/3 drive the left/right haptic motors.
 * Everything here is Web Audio; the HID side (path, volumes) lives in the device driver.
 */

export const audioSupported = (): boolean =>
  typeof AudioContext !== 'undefined' &&
  'setSinkId' in AudioContext.prototype &&
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.enumerateDevices

const SONY = /dualsense|wireless controller|playstation/i

export interface AudioDevices {
  outputs: MediaDeviceInfo[]
  inputs: MediaDeviceInfo[]
}

/** Sony-looking audio devices. Labels are empty until the page has microphone permission. */
export function pickControllerDevices(all: MediaDeviceInfo[]): AudioDevices {
  const sony = all.filter((d) => SONY.test(d.label))
  return {
    outputs: sony.filter((d) => d.kind === 'audiooutput'),
    inputs: sony.filter((d) => d.kind === 'audioinput'),
  }
}

export async function findControllerAudio(): Promise<AudioDevices> {
  let all = await navigator.mediaDevices.enumerateDevices()
  if (!all.some((d) => d.label)) {
    // Labels need a granted capture permission; ask once, then release the track.
    const s = await navigator.mediaDevices.getUserMedia({ audio: true })
    s.getTracks().forEach((t) => t.stop())
    all = await navigator.mediaDevices.enumerateDevices()
  }
  return pickControllerDevices(all)
}

/** Minimal surface of the Web Audio graph we build, so it can be faked in tests. */
export interface GraphContext {
  destination: {
    channelCount: number
    maxChannelCount: number
    channelCountMode: string
    channelInterpretation: string
  }
  createGain(): GainNode
  createChannelMerger(n: number): ChannelMergerNode
}

export interface Graph {
  /** connect a stereo source here */
  input: GainNode
  speaker: GainNode
  haptics: GainNode
  channels: number
}

/** Stereo source → (speaker gain → ch0/1) and (haptic gain → ch2/3) when the sink offers 4 channels. */
export function buildGraph(ctx: GraphContext): Graph {
  const channels = Math.min(4, Math.max(2, ctx.destination.maxChannelCount || 2))
  const input = ctx.createGain()
  const speaker = ctx.createGain()
  const haptics = ctx.createGain()
  haptics.gain.value = 0
  const merger = ctx.createChannelMerger(channels)
  input.connect(speaker)
  input.connect(haptics)
  speaker.connect(merger, 0, 0)
  speaker.connect(merger, 0, 1)
  if (channels === 4) {
    haptics.connect(merger, 0, 2)
    haptics.connect(merger, 0, 3)
  }
  ctx.destination.channelCount = channels
  ctx.destination.channelCountMode = 'explicit'
  ctx.destination.channelInterpretation = 'discrete'
  merger.connect(ctx.destination as unknown as AudioNode)
  return { input, speaker, haptics, channels }
}

export interface Player {
  ctx: AudioContext
  graph: Graph
  tone(hz: number, ms: number): void
  file(buffer: ArrayBuffer): Promise<void>
  stop(): void
  close(): Promise<void>
}

export async function createPlayer(sinkId: string): Promise<Player> {
  const ctx = new AudioContext()
  await (ctx as AudioContext & { setSinkId(id: string): Promise<void> }).setSinkId(sinkId)
  const graph = buildGraph(ctx as unknown as GraphContext)
  let current: AudioScheduledSourceNode | null = null
  const stop = () => {
    try {
      current?.stop()
    } catch {
      /* already stopped */
    }
    current = null
  }
  return {
    ctx,
    graph,
    tone(hz, ms) {
      stop()
      const o = ctx.createOscillator()
      o.frequency.value = hz
      const env = ctx.createGain()
      env.gain.setValueAtTime(0.0001, ctx.currentTime)
      env.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02)
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
      o.connect(env).connect(graph.input)
      o.start()
      o.stop(ctx.currentTime + ms / 1000 + 0.05)
      current = o
    },
    async file(buffer) {
      stop()
      const data = await ctx.decodeAudioData(buffer)
      const src = ctx.createBufferSource()
      src.buffer = data
      src.connect(graph.input)
      src.start()
      current = src
    },
    stop,
    close: () => ctx.close(),
  }
}

export interface MicMeter {
  /** 0..1 RMS level */
  level(): number
  stop(): void
}

export async function createMicMeter(deviceId: string): Promise<MicMeter> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false },
  })
  const ctx = new AudioContext()
  const src = ctx.createMediaStreamSource(stream)
  const an = ctx.createAnalyser()
  an.fftSize = 1024
  src.connect(an)
  const buf = new Float32Array(an.fftSize)
  return {
    level: () => rms(an, buf),
    stop() {
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}

export function rms(
  an: { getFloatTimeDomainData(b: Float32Array): void },
  buf: Float32Array,
): number {
  an.getFloatTimeDomainData(buf)
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i]! * buf[i]!
  return Math.min(1, Math.sqrt(s / buf.length) * 4)
}
