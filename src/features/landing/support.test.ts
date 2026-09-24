import { describe, expect, it } from 'vitest'
import { detectSupport, engineFor, phaseFor } from './support'

const UA = {
  chrome:
    'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0',
  firefox: 'Mozilla/5.0 (X11; Linux) Gecko/20100101 Firefox/152.0',
  safari:
    'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  other: 'curl/8.0',
}

describe('support', () => {
  it('names the engine from the user agent', () => {
    expect(engineFor(UA.chrome)).toBe('chromium')
    expect(engineFor(UA.edge)).toBe('chromium')
    expect(engineFor(UA.firefox)).toBe('firefox')
    expect(engineFor(UA.safari)).toBe('safari')
    expect(engineFor(UA.other)).toBe('other')
  })
  it('detects the Gamepad API and WebHID', () => {
    expect(detectSupport({ getGamepads: () => [], hid: {} }, UA.chrome)).toEqual({
      gamepad: true,
      webhid: true,
      engine: 'chromium',
    })
    expect(detectSupport({ getGamepads: () => [] }, UA.firefox)).toEqual({
      gamepad: true,
      webhid: false,
      engine: 'firefox',
    })
    expect(detectSupport({ hid: null }, UA.other)).toEqual({
      gamepad: false,
      webhid: false,
      engine: 'other',
    })
  })
  it('orders the phases: unsupported, error, pairing, waiting', () => {
    const none = { gamepad: false, webhid: false, engine: 'other' as const }
    const full = { gamepad: true, webhid: true, engine: 'chromium' as const }
    expect(phaseFor(none, true, 'x')).toBe('unsupported')
    expect(phaseFor(full, true, 'x')).toBe('error')
    expect(phaseFor(full, true, '')).toBe('pairing')
    expect(phaseFor(full, false, '')).toBe('waiting')
    expect(phaseFor({ ...none, gamepad: true }, false, '')).toBe('waiting')
  })
})
