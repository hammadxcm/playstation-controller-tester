import { useMemo } from 'react'
import { Button } from '@/components/ui'
import { useT } from '@/i18n/useT'
import { useAddDevice } from '@/state/hooks'
import { detectSupport, ENGINE_LABEL, phaseFor } from './support'
import { ParallaxGlow } from './ParallaxGlow'

/** Both ways in: the Gamepad API (press any button) and WebHID pairing (Chrome/Edge desktop). */
export function AddDevice() {
  const t = useT()
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
  const engine = support.engine === 'other' ? t('add.thisBrowser') : ENGINE_LABEL[support.engine]
  return (
    <section
      className="landing-section add-device"
      id="add-device"
      aria-labelledby="add-device-title"
    >
      <ParallaxGlow />
      <h2 id="add-device-title" className="display">
        {t('add.title')}
      </h2>
      <div className="add-grid">
        <article className="card add-card" data-phase={phase}>
          <div className="add-head">
            <span className="add-step" aria-hidden>
              1
            </span>
            <h3>{t('add.step1')}</h3>
          </div>
          <p className="muted">{t('add.step1Body')}</p>
          {phase === 'unsupported' ? (
            <p className="small bad">{t('add.noGamepad', { engine })}</p>
          ) : (
            <div className="listen" aria-live="polite">
              <span className="listen-dot" aria-hidden />
              {t('add.listening')}
            </div>
          )}
        </article>
        <article className="card add-card" data-phase={support.webhid ? phase : 'unsupported'}>
          <div className="add-head">
            <span className="add-step" aria-hidden>
              2
            </span>
            <h3>{t('add.step2')}</h3>
          </div>
          <p className="muted">{t('add.step2Body')}</p>
          {support.webhid ? (
            <div className="row">
              <Button primary data-pulse="" disabled={busy} onClick={() => void add()}>
                {busy ? t('add.pairing') : t('add.pair')}
              </Button>
              {err && (
                <span className="small bad" role="alert">
                  {err}
                </span>
              )}
            </div>
          ) : (
            <p className="small dim">{t('add.noWebHid', { engine })}</p>
          )}
        </article>
      </div>
      <table className="table support-table">
        <caption className="visually-hidden">{t('add.table.feature')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('add.table.feature')}</th>
            <th scope="col">Chrome / Edge</th>
            <th scope="col">Firefox</th>
            <th scope="col">Safari</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t('add.table.buttons')}</th>
            <td>✓</td>
            <td>✓</td>
            <td>✓</td>
          </tr>
          <tr>
            <th scope="row">{t('add.table.rumble')}</th>
            <td>✓</td>
            <td>{t('add.table.partial')}</td>
            <td>–</td>
          </tr>
          <tr>
            <th scope="row">{t('add.table.triggerRumble')}</th>
            <td>✓ {t('add.table.winmac')}</td>
            <td>–</td>
            <td>–</td>
          </tr>
          <tr>
            <th scope="row">{t('add.table.pro')}</th>
            <td>✓ {t('add.table.desktop')}</td>
            <td>–</td>
            <td>–</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
