const LIGHT_HAPTIC_MS = 8

export function requestHaptic(duration = LIGHT_HAPTIC_MS): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false

  try {
    return navigator.vibrate(duration)
  } catch {
    return false
  }
}
