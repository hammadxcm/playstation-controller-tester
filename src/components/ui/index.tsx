import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ title, right, children, className = '' }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Button({ primary, small, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; small?: boolean }) {
  return <button type="button" className={`btn ${primary ? 'btn-primary' : ''} ${small ? 'btn-sm' : ''} ${className}`} {...rest} />
}

export function Badge({ tone = '', children }: { tone?: '' | 'good' | 'ok' | 'bad' | 'accent'; children: ReactNode }) {
  return <span className={`badge ${tone ? `badge-${tone}` : ''}`}>{children}</span>
}

export function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange, format }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="slider">
      <label>
        <span>{label}</span>
        <span className="mono">{format ? format(value) : value}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function Metric({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'ok' | 'bad' }) {
  return (
    <div className="metric">
      <span className="value" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</span>
      <span className="label">{label}</span>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className="tab" onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
