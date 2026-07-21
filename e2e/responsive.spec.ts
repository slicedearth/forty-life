import { expect, test } from '@playwright/test'
import { expectNoPageOverflow, startGame } from './helpers.js'

test('six-player portrait layout uses the compact commander-damage menu without overflow', async ({ page }) => {
  await startGame(page, 6)
  await expectNoPageOverflow(page)

  const damageButtons = page.getByRole('button', { name: 'Assign commander damage' })
  await expect(damageButtons).toHaveCount(6)
  await damageButtons.first().click()
  await expect(page.getByRole('dialog', { name: 'Commander damage' })).toBeVisible()
})

test('short landscape layout keeps controls inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 })
  await startGame(page, 6)
  await expectNoPageOverflow(page)

  const toolbar = await page.getByRole('toolbar', { name: 'Game controls' }).boundingBox()
  expect(toolbar).not.toBeNull()
  if (toolbar) {
    expect(toolbar.x).toBeGreaterThanOrEqual(0)
    expect(toolbar.y).toBeGreaterThanOrEqual(0)
    expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(667)
    expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(375)
  }
})

test('wide mobile landscape keeps player names clear of the center controls', async ({ page }) => {
  await page.setViewportSize({ width: 915, height: 340 })
  await startGame(page, 6)
  await expectNoPageOverflow(page)

  const toolbar = await page.getByRole('toolbar', { name: 'Game controls' }).boundingBox()
  expect(toolbar).not.toBeNull()

  const names = page.locator('[data-player-name]')
  await expect(names).toHaveCount(6)

  if (toolbar) {
    for (const name of await names.all()) {
      await expect(name).toBeVisible()
      const nameBox = await name.boundingBox()
      expect(nameBox).not.toBeNull()

      if (nameBox) {
        expect(nameBox.height).toBeGreaterThanOrEqual(20)
        const overlapsToolbar = !(
          nameBox.x + nameBox.width <= toolbar.x ||
          nameBox.x >= toolbar.x + toolbar.width ||
          nameBox.y + nameBox.height <= toolbar.y ||
          nameBox.y >= toolbar.y + toolbar.height
        )
        expect(overlapsToolbar).toBe(false)
      }
    }
  }
})
