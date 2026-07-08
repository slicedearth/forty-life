# MTG Life Counter

A simple, touch-friendly life counter for Magic: The Gathering, built for a single shared device passed around the table.

## Features

- 2–6 player support with a seating-aware layout — players on the "far" side of the screen get their counter rotated 180° so life totals read right-side up from their seat
- Standard (20) or Commander (40) starting life, or a custom total
- Tap the top half of your counter to gain life, the bottom half to lose it
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
