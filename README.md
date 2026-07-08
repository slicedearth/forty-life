# MTG Life Counter

A simple, touch-friendly life counter for Magic: The Gathering, built for a single shared device passed around the table.

## Features

- 2–6 player support with a seating-aware layout — players on the "far" side of the screen get their counter rotated 180° so life totals read right-side up from their seat
- Standard (20) or Commander (40) starting life, or a custom total
- Custom player names and colors, set up before the game starts or edited anytime from a player's detail panel
- Search [Scryfall](https://scryfall.com/) for a commander (results limited to legal commanders) and use its art as a player's counter background — Partner, Partner with, Choose a Background, Friends forever, and Doctor's companion / Time Lord Doctor pairings are all detected automatically, with the second commander's art split alongside the first
- Tap the top half of your counter (marked with a "+") to gain life, the bottom half (marked with a "−") to lose it — hold either half to rapidly change life by 5
- Per-player poison counter and commander damage tracking (per opponent), available via the "···" button on each counter — small pips on each counter (showing that opponent's commander art, or a color dot if they didn't pick one) let you log damage from a specific opponent in one tap (hold to add 5 at once), always shown on a dark backdrop so they stay visible over busy commander art
- Quick -10/+10 life buttons alongside -5/-1/+1/+5 in a player's detail panel
- Monarch and Initiative tracking, toggled from a player's detail panel — a small crown/key badge on their counter shows who currently holds each
- A single compact menu button (Undo / Reset Life / New Game / Day-Night toggle) instead of a row of buttons, to keep the center of the screen uncluttered
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
