import { expect, test } from '@playwright/test'
import { openSetup, startGame } from './helpers.js'

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

test('the last pod can be reused without restoring game counters', async ({ page }) => {
  await openSetup(page)
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByRole('textbox', { name: 'Player 1 name' }).fill('Alice')
  await page.getByRole('textbox', { name: 'Player 2 name' }).fill('Bob')
  await page.getByRole('spinbutton', { name: 'Custom starting life' }).fill('37')
  await page.getByRole('button', { name: 'Start game' }).click()

  await page.getByRole('button', { name: 'Open details for Alice' }).click()
  const poison = page.locator('section').filter({ hasText: 'Poison (10 is lethal)' })
  await poison.getByRole('button', { name: '+1' }).click()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'New game' }).click()
  await page.getByRole('dialog', { name: 'Start a new game?' })
    .getByRole('button', { name: 'New game' })
    .click()
  await expect(page.getByRole('heading', { name: 'Set up your game' })).toBeVisible()

  await page.getByRole('button', { name: 'Reuse pod' }).click()
  await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('textbox', { name: 'Player 1 name' })).toHaveValue('Alice')
  await expect(page.getByRole('textbox', { name: 'Player 2 name' })).toHaveValue('Bob')
  await expect(page.getByRole('spinbutton', { name: 'Custom starting life' })).toHaveValue('37')

  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.locator('[data-player-id="0"]').getByText('37', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Open details for Alice' }).click()
  await expect(page.locator('section').filter({ hasText: 'Poison (10 is lethal)' }).getByText('0', { exact: true })).toBeVisible()
})

test('life changes provide visible and assistive feedback', async ({ page }) => {
  await startGame(page, 2)

  const playerOne = page.locator('[data-player-id="0"]')
  await page.getByRole('button', { name: "Decrease Player 1's life" }).click()

  await expect(playerOne.locator('[data-life-total]')).toHaveClass(/life-decrease/)
  await expect(page.locator('[data-game-announcement]')).toHaveText(
    'Player 1 lost 1 life. 39 life remaining.'
  )

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('[data-game-announcement]')).toHaveText(
    'Undid the last life change for Player 1.'
  )
})
