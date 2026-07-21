<div align="center">

# 🃏 Forty Life

**A fast, touch-friendly life counter for Magic: The Gathering.**

Built for one shared device passed around the table — no accounts, no ads, no server.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Built with](#built-with)
- [License](#license)

## Features

### 🪑 Seating-aware layout

- Supports 2–6 players in a grid that always splits into two rows, so the device can sit flat on the table with players on either side
- Players on the "far" row get their counter rotated 180° so life totals, names, and every control read right-side up from their own seat
- Choose Standard (20) or Commander (40) starting life, or set a custom total

### ❤️ Life tracking that scales with the screen

- Tap the left half of a counter (marked "−") to lose life, the right half ("+") to gain it — hold either side to rapidly change life by 5
- The life total and the +/− indicators sit in a single aligned row and shrink automatically for 3-digit or negative totals, so nothing overlaps even on the narrowest phones
- Need a bigger jump? A player's detail panel has explicit −10/−5/−1/+1/+5/+10 buttons

### 🎨 Live commander art via Scryfall

- Search [Scryfall](https://scryfall.com/) for a commander — results are limited to cards that are actually legal to be your commander
- The card's art becomes that player's counter background automatically
- **Partner**, **Partner with**, **Choose a Background**, **Friends forever**, and **Doctor's companion / Time Lord Doctor** pairings are all detected from the card's own rules text — pick a second commander and its art splits alongside the first
- Empty searches and connection failures are shown separately, while unavailable artwork falls back to the player's assigned color
- No commander selected? The counter falls back to a color picked from a curated, high-contrast palette

### ☠️ Everything else a Commander pod needs

- **Poison counters**, tracked per player (10 is lethal)
- **Commander damage**, tracked per opponent (21 from one opponent is lethal) — on wide screens, tap a small portrait of the attacker to log damage in place; on narrow phones, a single "⚔" button opens a full menu instead so nothing gets cramped
- **Commander tax**, tracked in two-mana steps for each commander independently, including Partner pairs
- **The Monarch** and **the Initiative**, each toggled from a player's detail panel with a passive crown/key badge showing who currently holds it
- **Day/Night**, a one-tap toggle that washes the whole screen in a cool blue tint — handy for werewolf decks, visible at a glance from across the table
- **Lethal-state emphasis** highlights a counter when life reaches 0, poison reaches 10, or commander damage reaches 21

### 📱 Built for a phone on the table, not just a desktop

- Tested down to a 375px-wide screen and sideways (landscape) layouts, where tiles are short and wide instead of tall and narrow
- Respects notches and home indicators via `env(safe-area-inset-*)`
- Installs as a standalone Progressive Web App on modern mobile platforms with a dedicated home-screen icon
- Precaches the application shell for offline games after the first successful load; new Scryfall searches and uncached artwork still require a connection
- Requests a screen wake lock while a game is active where the browser supports it, so the shared display does not sleep mid-turn
- Every tap target stays reachable and non-overlapping regardless of player count, screen size, or orientation

### ↩️ Forgiving by default

- Undo reverts the last life, poison, commander-damage, or commander-tax change
- Reset Life restores everyone to their starting total for a rematch without leaving the game
- Reset and New Game use clear in-app confirmation dialogs instead of browser prompts
- Game state — life totals, colors, commanders, monarch/initiative, day/night — persists to `localStorage`, so an accidental refresh never loses the game

## Getting started

```bash
git clone https://github.com/slicedearth/mtg-life-counter.git
cd mtg-life-counter
npm install
npm run dev
```

Then open the printed local URL on your phone or laptop and start a game.

## Commands

| Command             | Action                                       |
| :------------------ | :-------------------------------------------- |
| `npm install`       | Installs dependencies                          |
| `npm run dev`       | Starts the local dev server                    |
| `npm run build`     | Builds the production site to `./dist/`        |
| `npm run preview`   | Previews the production build locally          |
| `npm run check`     | Type-checks the project                        |

## Project structure

```
src/
├── App.svelte                  # Top-level game state: players, history, monarch/initiative, day/night
├── main.ts                     # Entry point
├── app.css                     # Tailwind entry + theme tokens
└── lib/
    ├── SetupScreen.svelte         # Player count, starting life, names/colors/commanders
    ├── PlayerCounter.svelte       # A single player's tile: tap zones, badges, quick actions
    ├── PlayerDetail.svelte        # Full per-player panel: rename, life, poison, commander damage
    ├── CommanderDamageMenu.svelte # Narrow-screen menu for assigning commander damage
    ├── ConfirmDialog.svelte       # Responsive reset and new-game confirmations
    ├── CommanderPicker.svelte     # Scryfall search + Partner/Background pairing UI
    ├── scryfall.ts                # Scryfall API client and partner-mode detection
    └── types.ts                   # Shared types, layouts, and the color palette
public/
├── icons/                      # Favicon, install icons, and Apple touch icon
├── manifest.webmanifest        # PWA identity and standalone display metadata
└── sw.js                       # Offline app-shell cache and navigation fallback
```

## Built with

- [Svelte 5](https://svelte.dev/) — UI framework, using runes (`$state`, `$derived`)
- [Vite](https://vite.dev/) — dev server and build tool
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [TypeScript](https://www.typescriptlang.org/) — throughout
- [Lucide](https://lucide.dev/) — consistent, accessible interface icons
- [Scryfall API](https://scryfall.com/docs/api) — commander search and card art, called directly from the client
- Web App Manifest and Service Worker — dependency-free installation and offline app-shell support

## License

[MIT](LICENSE) © slicedearth
