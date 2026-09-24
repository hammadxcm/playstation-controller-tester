import { describe, expect, it } from 'vitest'
import { buildGraph, pickControllerDevices, rms, type GraphContext } from './usbAudio'

const dev = (kind: MediaDeviceKind, label: string) => ({ kind, label, deviceId: label, groupId: '', toJSON: () => ({}) }) as MediaDeviceInfo

function fakeCtx(maxChannelCount: number) {
  const connections: string[] = []
  const node = (name: string) => {
    const n = { name, gain: { value: 1 }, connect: (to: { name?: string }, _out?: number, inp?: number) => { connections.push(`${name}->${to.name ?? 'dest'}${inp !== undefined ? `:${inp}` : ''}`); return to } }
    return n as unknown as GainNode & ChannelMergerNode
  }
  let gains = 0
  const ctx: GraphContext = {
    destination: { name: 'dest', channelCount: 2, maxChannelCount, channelCountMode: 'max', channelInterpretation: 'speakers' } as GraphContext['destination'],
    createGain: () => node(`gain${gains++}`),
    createChannelMerger: (n) => node(`merger${n}`),
  }
  return { ctx, connections }
}

describe('pickControllerDevices', () => {
  it('keeps only Sony-looking devices, split by kind', () => {
    const d = pickControllerDevices([dev('audiooutput', 'DualSense Wireless Controller'), dev('audioinput', 'Wireless Controller'), dev('audiooutput', 'MacBook Pro Speakers'), dev('audioinput', '')])
    expect(d.outputs.map((x) => x.label)).toEqual(['DualSense Wireless Controller'])
    expect(d.inputs.map((x) => x.label)).toEqual(['Wireless Controller'])
  })
})

describe('buildGraph', () => {
  it('routes speaker to channels 0/1 and haptics to 2/3 on a 4-channel sink', () => {
    const { ctx, connections } = fakeCtx(4)
    const g = buildGraph(ctx)
    expect(g.channels).toBe(4)
    expect(ctx.destination.channelCount).toBe(4)
    expect(ctx.destination.channelInterpretation).toBe('discrete')
    expect(connections).toContain('gain1->merger4:0')
    expect(connections).toContain('gain1->merger4:1')
    expect(connections).toContain('gain2->merger4:2')
    expect(connections).toContain('gain2->merger4:3')
    expect(g.haptics.gain.value).toBe(0)
  })
  it('falls back to stereo without haptic channels', () => {
    const { ctx, connections } = fakeCtx(2)
    const g = buildGraph(ctx)
    expect(g.channels).toBe(2)
    expect(connections.some((c) => c.endsWith(':2'))).toBe(false)
  })
  it('treats an unknown channel count as stereo', () => {
    expect(buildGraph(fakeCtx(0).ctx).channels).toBe(2)
  })
})

describe('rms', () => {
  it('measures signal level and clamps to 1', () => {
    const buf = new Float32Array(4)
    expect(rms({ getFloatTimeDomainData: (b) => b.fill(0) }, buf)).toBe(0)
    expect(rms({ getFloatTimeDomainData: (b) => b.fill(0.1) }, buf)).toBeCloseTo(0.4)
    expect(rms({ getFloatTimeDomainData: (b) => b.fill(1) }, buf)).toBe(1)
  })
})
