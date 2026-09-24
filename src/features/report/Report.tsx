import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { identify } from '@/core/gamepad/identify'
import { Badge, Button, Card } from '@/components/ui'
import { useStore } from '@/state/store'
import { useActivePad } from '@/state/hooks'

function download(name: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.click()
}

export function Report() {
  const report = useStore((s) => s.report)
  const setReport = useStore((s) => s.setReport)
  const pad = useActivePad()
  const ref = useRef<HTMLDivElement>(null)
  if (!report) {
    return (
      <Card title="Report">
        <p className="muted">
          Run the Health check first. The result lands here with JSON and PNG export for warranty or
          RMA tickets.
        </p>
      </Card>
    )
  }
  const p = identify(report.padId)
  const json = {
    app: 'controller-tester',
    version: 1,
    generatedAt: report.at,
    browser: navigator.userAgent,
    controller: { id: report.padId, name: p.name, family: p.family, vid: p.vid, pid: p.pid },
    score: report.score,
    metrics: report.metrics,
  }
  const summary =
    `Controller health: ${report.score.score}/100 (${report.score.grade}) — ${p.name}\n` +
    Object.entries(report.metrics)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  const tone = report.score.grade <= 'B' ? 'good' : report.score.grade === 'C' ? 'ok' : 'bad'
  return (
    <div className="grid-2">
      <div ref={ref}>
        <Card title="Health report" right={<Badge>{new Date(report.at).toLocaleString()}</Badge>}>
          <div className="row" style={{ alignItems: 'baseline', gap: 16 }}>
            <span className="score" style={{ color: `var(--${tone})` }}>
              {report.score.score}
            </span>
            <span className="score dim">{report.score.grade}</span>
            <div className="stack small muted">
              <span>{p.name}</span>
              <span className="mono">{report.padId}</span>
            </div>
          </div>
          <table className="table">
            <tbody>
              {Object.entries(report.metrics).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="mono">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Score breakdown</h3>
          <table className="table">
            <tbody>
              {Object.entries(report.score.breakdown).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="mono">{v.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Card title="Export">
        <div className="row">
          <Button
            primary
            onClick={() =>
              download(
                'controller-report.json',
                'data:application/json;charset=utf-8,' +
                  encodeURIComponent(JSON.stringify(json, null, 2)),
              )
            }
          >
            Download JSON
          </Button>
          <Button
            onClick={() =>
              ref.current &&
              toPng(ref.current, {
                pixelRatio: 2,
                backgroundColor: getComputedStyle(document.body).backgroundColor,
              }).then((u) => download('controller-report.png', u))
            }
          >
            Download PNG
          </Button>
          <Button onClick={() => navigator.clipboard.writeText(summary)}>Copy summary</Button>
          <Button small onClick={() => setReport(null)}>
            Clear
          </Button>
        </div>
        <pre className="hex" style={{ maxHeight: 260 }}>
          {summary}
        </pre>
        {pad && pad.id !== report.padId && (
          <p className="small muted">
            This report is for a different controller than the one currently selected.
          </p>
        )}
      </Card>
    </div>
  )
}
