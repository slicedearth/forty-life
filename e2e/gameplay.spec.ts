import { expect, test } from '@playwright/test'
import { startGame } from './helpers.js'

test('life, poison, Undo, and reset remain consistent', async ({ page }) => {
  await startGame(page, 2)

  const playerOne = page.locator('[data-player-id="0"]')
  await page.getByRole('button', { name: "Decrease Player 1's life" }).click()
  await expect(playerOne.getByText('39', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(playerOne.getByText('40', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Open details for Player 1' }).click()
  const poison = page.locator('section').filter({ hasText: 'Poison (10 is lethal)' })
  await poison.getByRole('button', { name: '+1' }).click()
  await expect(poison.getByText('1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Open details for Player 1' }).click()
  await expect(page.locator('section').filter({ hasText: 'Poison (10 is lethal)' }).getByText('0', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: "Decrease Player 1's life" }).click()
  await page.getByRole('button', { name: 'Reset life' }).click()
  await expect(page.getByRole('dialog', { name: 'Reset this game?' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset game' }).click()
  await expect(playerOne.getByText('40', { exact: true })).toBeVisible()
})

test('a running game is restored from validated local storage', async ({ page }) => {
  await startGame(page, 2)
  await page.getByRole('button', { name: "Decrease Player 1's life" }).click()
  await page.reload()

  await expect(page.locator('[data-player-id="0"]').getByText('39', { exact: true })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: 'Game controls' })).toBeVisible()
})
