export interface HapticCaps {
  dual: boolean
  trigger: boolean
}

type Actuator = GamepadHapticActuator & { effects?: string[]; type?: string }

export function hapticCaps(gp: Gamepad | null): HapticCaps {
  const a = gp?.vibrationActuator as Actuator | undefined
  if (!a || typeof a.playEffect !== 'function') return { dual: false, trigger: false }
  const effects = a.effects ?? (a.type === 'dual-rumble' ? ['dual-rumble'] : [])
  return { dual: effects.includes('dual-rumble'), trigger: effects.includes('trigger-rumble') }
}

export interface RumbleParams {
  duration: number
  strong?: number
  weak?: number
  leftTrigger?: number
  rightTrigger?: number
}

/** Fire-and-forget rumble; resolves with the effect result or 'unsupported'. */
export async function rumble(gp: Gamepad | null, p: RumbleParams): Promise<string> {
  const a = gp?.vibrationActuator as Actuator | undefined
  const caps = hapticCaps(gp)
  if (!a || !caps.dual) return 'unsupported'
  const wantsTrigger = (p.leftTrigger ?? 0) > 0 || (p.rightTrigger ?? 0) > 0
  const type = wantsTrigger && caps.trigger ? 'trigger-rumble' : 'dual-rumble'
  try {
    return await a.playEffect(type as GamepadHapticEffectType, {
      duration: p.duration,
      startDelay: 0,
      strongMagnitude: p.strong ?? 0,
      weakMagnitude: p.weak ?? 0,
      ...(type === 'trigger-rumble'
        ? { leftTrigger: p.leftTrigger ?? 0, rightTrigger: p.rightTrigger ?? 0 }
        : {}),
    })
  } catch (e) {
    const name = (e as { name?: unknown } | null)?.name
    return typeof name === 'string' ? name : 'error'
  }
}

export async function stopRumble(gp: Gamepad | null): Promise<void> {
  const a = gp?.vibrationActuator as Actuator | undefined
  if (a && typeof a.reset === 'function') await a.reset().catch(() => undefined)
}
