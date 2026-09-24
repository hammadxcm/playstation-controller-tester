import { useMemo } from 'react'
import { Button } from '@/components/ui'
import { useAddDevice } from '@/state/hooks'
import { detectSupport, ENGINE_LABEL, phaseFor } from './support'
import { ParallaxGlow } from './ParallaxGlow'

/** Both ways in: the Gamepad API (press any button) and WebHID pairing (Chrome/Edge desktop). */
export function AddDevice() {
  const support = useMemo(
    () =>
      detectSupport(
        navigator as unknown as { getGamepads?: unknown; hid?: unknown },
        navigator.userAgent,
      ),
    [],
  )
  const { busy, err, add } = useAddDevice()
  const phase = phaseFor(support, busy, err)
  return (
    <section
      className="landing-section add-device"
      id="add-device"
      aria-labelledby="add-device-title"
    >
      <ParallaxGlow />
      <h2 id="add-device-title" className="display">
        Add a device
      </h2>
      <div className="add-grid">
        <article className="card add-card" data-phase={phase}>
          <div className="add-head">
            <span className="add-step">1</span>
            <h3>Press any button</h3>
          </div>
          <p className="muted">
            Plug in over USB or pair over Bluetooth, then press any button. Browsers only reveal a
            gamepad after its first input. Works with DualSense, DualShock 4, Xbox and generic pads.
          </p>
          {phase === 'unsupported' ? (
            <p className="small" style={{ color: 'var(--bad)' }}>
              {ENGINE_LABEL[support.engine]} has no Gamepad API. Try Chrome, Edge, Firefox or
              Safari.
            </p>
          ) : (
            <div className="listen" aria-live="polite">
              <span className="listen-dot" />
              Listening for a controller…
            </div>
          )}
        </article>
        <article className="card add-card" data-phase={support.webhid ? phase : 'unsupported'}>
          <div className="add-head">
            <span className="add-step">2</span>
            <h3>Pair for Pro Mode</h3>
          </div>
          <p className="muted">
            WebHID talks to the controller directly: adaptive triggers, lightbar, player LEDs, mic
            LED, touchpad, gyro, battery and firmware. DualSense, DualSense Edge and DualShock 4.
          </p>
          {support.webhid ? (
            <div className="row">
              <Button primary data-pulse="" disabled={busy} onClick={() => void add()}>
                {busy ? 'Waiting for the picker…' : 'Pair over USB or Bluetooth'}
              </Button>
              {err && (
                <span className="small" style={{ color: 'var(--bad)' }}>
                  {err}
                </span>
              )}
            </div>
          ) : (
            <p className="small dim">
              Not available in {ENGINE_LABEL[support.engine]}. Pro Mode needs Chrome or Edge on
              desktop.
            </p>
          )}
        </article>
      </div>
      <table className="table support-table">
        <thead>
          <tr>
            <th></th>
            <th>Chrome / Edge</th>
            <th>Firefox</th>
            <th>Safari</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Buttons, sticks, triggers</td>
            <td>✓</td>
            <td>✓</td>
            <td>✓</td>
          </tr>
          <tr>
            <td>Rumble</td>
            <td>✓</td>
            <td>partial</td>
            <td>–</td>
          </tr>
          <tr>
            <td>Trigger rumble (Xbox)</td>
            <td>✓ Win/mac</td>
            <td>–</td>
            <td>–</td>
          </tr>
          <tr>
            <td>Pro Mode (PS4/PS5 via WebHID)</td>
            <td>✓ desktop</td>
            <td>–</td>
            <td>–</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
