import type { Family } from '@/core/gamepad/identify'

export type XY = [number, number]
export interface SilhouetteLayout {
  body: string
  ls: XY
  rs: XY
  dpad: XY
  face: XY
  select: XY
  start: XY
  home: XY
  touchpad?: [number, number, number, number]
  /** extra button drawn as a small circle, e.g. Xbox Share (index 17) */
  aux?: XY
  l1: [number, number, number, number]
  r1: [number, number, number, number]
  l2: [number, number, number, number]
  r2: [number, number, number, number]
}

const PS_BODY =
  'M62,64 Q66,36 100,36 L300,36 Q334,36 338,64 L368,186 Q374,236 336,238 Q306,240 292,208 L278,182 L122,182 L108,208 Q94,240 64,238 Q26,236 32,186 Z'
const XBOX_BODY =
  'M70,60 Q80,34 110,34 L290,34 Q320,34 330,60 L362,176 Q372,226 336,232 Q310,236 296,208 L280,176 Q240,164 200,164 Q160,164 120,176 L104,208 Q90,236 64,232 Q28,226 38,176 Z'

const ps = (touch: [number, number, number, number], select: XY, start: XY, home: XY): SilhouetteLayout => ({
  body: PS_BODY,
  ls: [150, 148], rs: [250, 148], dpad: [96, 104], face: [304, 104],
  select, start, home, touchpad: touch,
  l1: [72, 22, 60, 12], r1: [268, 22, 60, 12], l2: [82, 6, 44, 12], r2: [274, 6, 44, 12],
})

export const LAYOUTS: Record<Family, SilhouetteLayout> = {
  dualsense: { ...ps([146, 50, 108, 74], [128, 66], [272, 66], [200, 168]), aux: [200, 196] },
  dualshock4: ps([152, 52, 96, 66], [130, 74], [270, 74], [200, 166]),
  xbox: {
    body: XBOX_BODY,
    ls: [98, 96], rs: [252, 150], dpad: [148, 150], face: [302, 96],
    select: [166, 96], start: [234, 96], home: [200, 62], aux: [200, 118],
    l1: [72, 20, 60, 12], r1: [268, 20, 60, 12], l2: [82, 4, 44, 12], r2: [274, 4, 44, 12],
  },
  generic: ps([152, 52, 96, 66], [130, 74], [270, 74], [200, 166]),
}
