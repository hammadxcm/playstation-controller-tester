import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({
  title,
  right,
  children,
  className = '',
}: {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
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

export function Button({
  primary,
  small,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; small?: boolean }) {
  return (
    <button
      type="button"
      className={`btn ${primary ? 'btn-primary' : ''} ${small ? 'btn-sm' : ''} ${className}`}
      {...rest}
    />
  )
}

export function Badge({
  tone = '',
  children,
}: {
  tone?: '' | 'good' | 'ok' | 'bad' | 'accent'
  children: ReactNode
}) {
  return <span className={`badge ${tone ? `badge-${tone}` : ''}`}>{children}</span>
}

export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  format,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="slider">
      <label>
        <span>{label}</span>
        <span className="mono">{format ? format(value) : value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function Metric({
  label,
  value,
  tone,
  large,
}: {
  label: string
  value: ReactNode
  tone?: 'good' | 'ok' | 'bad'
  large?: boolean
}) {
  return (
    <div className={`metric ${large ? 'lg' : ''}`}>
      <span className="value" style={tone ? { color: `var(--${tone})` } : undefined}>
        {value}
      </span>
      <span className="label">{label}</span>
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ink = 'tab-ink',
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  ink?: string
}) {
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = tabs.findIndex((t) => t.id === value)
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!
    onChange(next.id)
    ;(e.currentTarget.children[tabs.indexOf(next)] as HTMLElement | undefined)?.focus()
    e.preventDefault()
  }
  return (
    <div className="tabs" role="tablist" onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          aria-selected={t.id === value}
          aria-controls={`panel-${t.id}`}
          tabIndex={t.id === value ? 0 : -1}
          className="tab"
          onClick={() => onChange(t.id)}
        >
          {t.id === value && (
            <i className="tab-ink" style={{ viewTransitionName: ink }} aria-hidden />
          )}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export { ProgressRing, type ProgressRingHandle } from './ProgressRing'
