import { expect, test } from '@playwright/test'
import { openSetup } from './helpers.js'

test('publishes install metadata and required icons', async ({ page, request }) => {
  await openSetup(page)

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/' })
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512'])
  )
})

test('serves the app shell offline after service-worker activation', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright service-worker inspection is Chromium-only')
  await openSetup(page)

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) return
    await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
    })
  })

  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Set up your game' })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
