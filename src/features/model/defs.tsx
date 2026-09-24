/** Shared gradients and the one static shadow filter. Referenced by id from both model layers. */
export function Defs() {
  return (
    <defs>
      <linearGradient id="m-shell-light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6f7fa" />
        <stop offset="0.6" stopColor="#dfe2ea" />
        <stop offset="1" stopColor="#b9bec9" />
      </linearGradient>
      <linearGradient id="m-shell-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a3f4b" />
        <stop offset="1" stopColor="#171a21" />
      </linearGradient>
      <linearGradient id="m-shell-gray" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8b919f" />
        <stop offset="1" stopColor="#4c5160" />
      </linearGradient>
      <linearGradient id="m-plate" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a2e39" />
        <stop offset="1" stopColor="#12151b" />
      </linearGradient>
      <linearGradient id="m-pad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#30343f" />
        <stop offset="1" stopColor="#1c1f27" />
      </linearGradient>
      <radialGradient id="m-cap" cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#555b6a" />
        <stop offset="0.7" stopColor="#23262e" />
        <stop offset="1" stopColor="#121419" />
      </radialGradient>
      <radialGradient id="m-btn" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#3f4454" />
        <stop offset="1" stopColor="#1e2129" />
      </radialGradient>
      <radialGradient id="m-well" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.75" stopColor="#0d0f14" />
        <stop offset="1" stopColor="#262a34" />
      </radialGradient>
      <radialGradient id="m-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.95 }} />
        <stop offset="0.55" style={{ stopColor: 'var(--accent)', stopOpacity: 0.35 }} />
        <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
      </radialGradient>
      <radialGradient id="m-heat" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.6 }} />
        <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
      </radialGradient>
      <filter id="m-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#000" floodOpacity="0.5" />
      </filter>
    </defs>
  )
}
