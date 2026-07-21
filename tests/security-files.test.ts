import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readProjectFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('deployed security boundaries', () => {
  it('keeps scripts same-origin and frames disabled', () => {
    const headers = readProjectFile('public/_headers')

    expect(headers).toContain("script-src 'self'")
    expect(headers).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(headers).not.toContain('unsafe-eval')
    expect(headers).toContain("frame-ancestors 'none'")
    expect(headers).toContain('Permissions-Policy:')
    expect(headers).toContain('screen-wake-lock=(self)')
  })

  it('restricts runtime caching to known app-shell assets', () => {
    const worker = readProjectFile('public/sw.js')

    expect(worker).toContain("url.pathname.startsWith('/assets/')")
    expect(worker).toContain('APP_SHELL.includes(url.pathname)')
    expect(worker).toContain('if (!isAppShellAsset) return')
    expect(worker).toContain('if (url.origin !== self.location.origin) return')
    expect(worker).toContain('caches.match(request, { ignoreVary: true })')
    expect(worker).toContain("response.headers.get('content-type')?.includes('text/html')")
  })
})
