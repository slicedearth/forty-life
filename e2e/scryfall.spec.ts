import { expect, test } from '@playwright/test'
import { mockScryfall, openSetup } from './helpers.js'

test.use({ serviceWorkers: 'block' })

test('commander and Background searches use deterministic Scryfall responses', async ({ page }) => {
  await mockScryfall(page)
  await openSetup(page)

  const primarySearch = page.getByRole('textbox', { name: 'Search for a commander' }).first()
  await primarySearch.fill('wilson')
  await page.getByRole('button', { name: /Wilson, Refined Grizzly/ }).click()
  await expect(primarySearch).toHaveValue('Wilson, Refined Grizzly')

  const backgroundSearch = page.getByRole('textbox', { name: 'Search background (optional)…' })
  await backgroundSearch.fill('agent')
  await page.getByRole('button', { name: 'Agent of the Shadow Thieves' }).click()
  await expect(backgroundSearch).toHaveValue('Agent of the Shadow Thieves')
})

test('Scryfall failures are visible and do not block game setup', async ({ page }) => {
  await page.route('https://api.scryfall.com/**', route =>
    route.fulfill({ status: 429, contentType: 'application/json', body: '{}' })
  )
  await openSetup(page)

  await page.getByRole('textbox', { name: 'Search for a commander' }).first().fill('atraxa')
  await expect(page.getByRole('alert').filter({ hasText: 'Scryfall is unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start game' })).toBeEnabled()
})
