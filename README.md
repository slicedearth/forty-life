# MTG Life Counter

A simple, touch-friendly life counter for Magic: The Gathering, built for a single shared device passed around the table.

## Features

- 2–6 player support with a seating-aware layout — players on the "far" side of the screen get their counter rotated 180° so life totals read right-side up from their seat
- Standard (20) or Commander (40) starting life, or a custom total
- Custom player names and colors, set up before the game starts or edited anytime from a player's detail panel
- Search [Scryfall](https://scryfall.com/) for a commander (results limited to legal commanders) and use its art as a player's counter background — Partner, Partner with, Choose a Background, Friends forever, and Doctor's companion / Time Lord Doctor pairings are all detected automatically, with the second commander's art split alongside the first
- Tap the top half of your counter to gain life, the bottom half to lose it — hold either half to rapidly change life by 5
- Per-player poison counter and commander damage tracking (per opponent), available via the "···" button on each counter
- Undo the last life/poison/commander-damage change
- Game state persists to `localStorage`, so a refresh won't lose your progress
- Reset life totals for a rematch, or start a new game with different players/settings

## Built With

- [Svelte 5](https://svelte.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Installs dependencies                       |
| `npm run dev`       | Starts local dev server                     |
| `npm run build`     | Builds the production site to `./dist/`     |
| `npm run preview`   | Previews the build locally before deploying |
| `npm run check`     | Type-checks the project                     |
