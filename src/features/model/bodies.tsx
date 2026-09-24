/* Static shells, 400×260 viewBox. Drawn once in the body layer; never touched by the rig. */

/** Dark blocks the bumpers and triggers sit on; the shell overlaps their bottom edge. */
function Housings({ lx, rx, w }: { lx: number; rx: number; w: number }) {
  return (
    <>
      <rect x={lx} y={8} width={w} height={44} rx={12} fill="#15181f" stroke="#07080b" />
      <rect x={rx} y={8} width={w} height={44} rx={12} fill="#15181f" stroke="#07080b" />
    </>
  )
}

const DS_SHELL = 'M94,44 C116,32 158,28 200,28 C242,28 284,32 306,44 C328,56 342,84 350,124 C358,164 374,204 368,228 C362,248 340,254 322,246 C302,238 292,218 284,200 C276,188 262,184 250,186 C236,190 226,206 212,210 L188,210 C174,206 164,190 150,186 C138,184 124,188 116,200 C108,218 98,238 78,246 C60,254 38,248 32,228 C26,204 42,164 50,124 C58,84 72,56 94,44 Z'
const DS_PLATE = 'M108,58 C140,50 170,48 200,48 C230,48 260,50 292,58 C306,62 314,74 318,92 C322,112 320,132 312,150 C302,170 282,180 258,182 L142,182 C118,180 98,170 88,150 C80,132 78,112 82,92 C86,74 94,62 108,58 Z'
const DS4_SHELL = 'M96,50 C120,36 160,32 200,32 C240,32 280,36 304,50 C326,62 338,88 346,124 C354,160 368,196 362,220 C356,240 336,246 320,238 C300,230 290,212 282,196 C274,184 262,180 250,182 C236,186 226,200 212,204 L188,204 C174,200 164,186 150,182 C138,180 126,184 118,196 C110,212 100,230 80,238 C64,246 44,240 38,220 C32,196 46,160 54,124 C62,88 74,62 96,50 Z'
const XB_SHELL = 'M84,52 C98,30 130,26 160,30 C186,34 214,34 240,30 C270,26 302,30 316,52 C334,80 352,130 362,176 C372,214 360,240 336,240 C314,240 300,220 288,200 C276,182 254,178 232,182 C212,186 188,186 168,182 C146,178 124,182 112,200 C100,220 86,240 64,240 C40,240 28,214 38,176 C48,130 66,80 84,52 Z'
const XB_PLATE = 'M118,54 C150,44 250,44 282,54 C300,60 312,80 316,110 C320,140 306,166 280,172 C240,180 160,180 120,172 C94,166 80,140 84,110 C88,80 100,60 118,54 Z'

export function DualSense() {
  return (
    <g filter="url(#m-shadow)">
      <Housings lx={64} rx={262} w={74} />
      <path d={DS_SHELL} fill="url(#m-shell-light)" stroke="#9aa0ad" strokeWidth={1} />
      <path d={DS_PLATE} fill="url(#m-plate)" stroke="#0a0b0f" strokeWidth={1} />
      <path d="M62,232 C56,224 54,212 58,198" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <path d="M338,232 C344,224 346,212 342,198" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  )
}

export function DualShock4() {
  return (
    <g filter="url(#m-shadow)">
      <Housings lx={64} rx={262} w={74} />
      <path d={DS4_SHELL} fill="url(#m-shell-dark)" stroke="#07080b" strokeWidth={1} />
      <path d="M120,56 C160,48 240,48 280,56 C296,60 306,76 308,100 C310,124 300,148 276,154 L124,154 C100,148 90,124 92,100 C94,76 104,60 120,56 Z" fill="#1a1d25" stroke="#0a0b0f" strokeWidth={0.8} />
      <path d="M66,226 C60,216 60,204 64,192" stroke="#fff" strokeOpacity={0.12} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <path d="M334,226 C340,216 340,204 336,192" stroke="#fff" strokeOpacity={0.12} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Xbox() {
  return (
    <g filter="url(#m-shadow)">
      <Housings lx={60} rx={258} w={82} />
      <path d={XB_SHELL} fill="url(#m-shell-dark)" stroke="#07080b" strokeWidth={1} />
      <path d={XB_PLATE} fill="#20232c" stroke="#0a0b0f" strokeWidth={0.8} />
      <path d="M52,226 C46,214 46,196 54,184" stroke="#fff" strokeOpacity={0.1} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M348,226 C354,214 354,196 346,184" stroke="#fff" strokeOpacity={0.1} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Generic() {
  return (
    <g filter="url(#m-shadow)">
      <Housings lx={64} rx={262} w={74} />
      <path d={DS4_SHELL} fill="url(#m-shell-gray)" stroke="#2e323d" strokeWidth={1} />
      <path d="M120,58 C160,50 240,50 280,58 C296,62 306,78 308,100 C310,124 300,150 276,156 L124,156 C100,150 90,124 92,100 C94,78 104,62 120,58 Z" fill="#3a3f4b" stroke="#22252d" strokeWidth={0.8} />
    </g>
  )
}
