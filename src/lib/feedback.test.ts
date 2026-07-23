import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestHaptic } from './feedback'

describe('haptic feedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses a short vibration when the browser supports it', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })

    expect(requestHaptic()).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(8)
  })

  it('fails quietly when vibration is unavailable or blocked', () => {
    vi.stubGlobal('navigator', {})
    expect(requestHaptic()).toBe(false)

    vi.stubGlobal('navigator', { vibrate: vi.fn(() => { throw new Error('blocked') }) })
    expect(requestHaptic()).toBe(false)
  })
})
