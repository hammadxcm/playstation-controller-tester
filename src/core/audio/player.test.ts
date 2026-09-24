// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { audioSupported, createMicMeter, createPlayer, findControllerAudio } from './usbAudio'

class Param {
  value = 1
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
}
class Node {
  gain = new Param()
  frequency = new Param()
  buffer: unknown = null
  fftSize = 0
  connect = vi.fn(() => this)
  start = vi.fn()
  stop = vi.fn()
  getFloatTimeDomainData = (b: Float32Array) => b.fill(0.25)
}
class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  currentTime = 0
  destination = {
    maxChannelCount: 4,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
  }
  sinkId = ''
  closed = false
  sources: Node[] = []
  constructor() {
    FakeAudioContext.instances.push(this)
  }
  setSinkId = vi.fn(async (id: string) => {
    this.sinkId = id
  })
  createGain = () => new Node()
  createChannelMerger = () => new Node()
  createOscillator = () => {
    const n = new Node()
    this.sources.push(n)
    return n
  }
  createBufferSource = () => {
    const n = new Node()
    this.sources.push(n)
    return n
  }
  createMediaStreamSource = () => new Node()
  createAnalyser = () => new Node()
  decodeAudioData = vi.fn(async () => ({ duration: 1 }))
  close = vi.fn(async () => {
    this.closed = true
  })
}

const install = () => {
  Object.defineProperty(FakeAudioContext.prototype, 'setSinkId', {
    value: async () => undefined,
    configurable: true,
  })
  vi.stubGlobal('AudioContext', FakeAudioContext)
  const tracks = [{ stop: vi.fn() }]
  const devices = [
    { kind: 'audiooutput', label: '', deviceId: 'o1', groupId: '', toJSON: () => ({}) },
    { kind: 'audioinput', label: '', deviceId: 'i1', groupId: '', toJSON: () => ({}) },
  ]
  let labelled = false
  const md = {
    enumerateDevices: vi.fn(async () =>
      devices.map((d) => ({ ...d, label: labelled ? 'DualSense Wireless Controller' : '' })),
    ),
    getUserMedia: vi.fn(async () => {
      labelled = true
      return { getTracks: () => tracks }
    }),
  }
  Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true })
  return { md, tracks }
}

describe('usbAudio runtime', () => {
  it('reports support from AudioContext.setSinkId and mediaDevices', () => {
    install()
    Object.defineProperty(AudioContext.prototype, 'setSinkId', {
      value: async () => undefined,
      configurable: true,
    })
    expect(audioSupported()).toBe(true)
  })
  it('asks for permission once to reveal device labels', async () => {
    const { md, tracks } = install()
    const d = await findControllerAudio()
    expect(md.getUserMedia).toHaveBeenCalledTimes(1)
    expect(tracks[0]!.stop).toHaveBeenCalled()
    expect(d.outputs[0]?.deviceId).toBe('o1')
    expect(d.inputs[0]?.deviceId).toBe('i1')
    await findControllerAudio()
    expect(md.getUserMedia).toHaveBeenCalledTimes(1)
  })
  it('creates a player that routes to the sink, plays tones and files, stops and closes', async () => {
    install()
    const p = await createPlayer('o1')
    const ctx = FakeAudioContext.instances.at(-1)!
    expect(ctx.sinkId).toBe('o1')
    expect(p.graph.channels).toBe(4)
    p.tone(440, 500)
    expect(ctx.sources.length).toBe(1)
    expect(ctx.sources[0]!.start).toHaveBeenCalled()
    await p.file(new ArrayBuffer(8))
    expect(ctx.sources[0]!.stop).toHaveBeenCalled()
    expect(ctx.decodeAudioData).toHaveBeenCalled()
    ctx.sources[1]!.stop = vi.fn(() => {
      throw new Error('already stopped')
    })
    p.stop()
    p.stop()
    await p.close()
    expect(ctx.closed).toBe(true)
  })
  it('meters the microphone and releases it', async () => {
    const { tracks } = install()
    const m = await createMicMeter('i1')
    expect(m.level()).toBeCloseTo(1)
    m.stop()
    expect(tracks[0]!.stop).toHaveBeenCalled()
  })
})
