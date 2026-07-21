import { expect, type Page } from '@playwright/test'

export async function openSetup(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Set up your game' })).toBeVisible()
}

export async function startGame(page: Page, playerCount = 4): Promise<void> {
  await openSetup(page)
  await page.getByRole('button', { name: String(playerCount), exact: true }).click()
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(page.getByRole('toolbar', { name: 'Game controls' })).toBeVisible()
}

export async function mockScryfall(page: Page): Promise<void> {
  await page.route('https://cards.scryfall.io/**', route => route.abort())
  await page.route('https://api.scryfall.com/**', async route => {
    const url = new URL(route.request().url())
    const query = url.searchParams.get('q') ?? ''
    const isBackground = query.includes('type:background')
    const payload = isBackground
      ? {
          data: [
            {
              name: 'Agent of the Shadow Thieves',
              type_line: 'Legendary Enchantment — Background',
              oracle_text: 'Commander creatures you own have menace.',
              image_uris: {
                art_crop: 'https://cards.scryfall.io/art_crop/front/a/b/background.jpg',
              },
            },
          ],
        }
      : {
          data: [
            {
              name: 'Wilson, Refined Grizzly',
              type_line: 'Legendary Creature — Bear Warrior',
              oracle_text: 'Choose a Background',
              image_uris: {
                art_crop: 'https://cards.scryfall.io/art_crop/front/a/b/wilson.jpg',
              },
            },
          ],
        }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
}

export async function expectNoPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight)
}
