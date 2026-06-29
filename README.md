# 🎯 Skill Check Simulator

A browser-based **Dead by Daylight skill check trainer** built with React, TypeScript, and Vite. Practice and master skill checks with multiple themes, game modes, and real-time audio feedback — right in your browser.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-brightgreen?style=for-the-badge)](https://skillcheck.ga.ci/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Tech](https://img.shields.io/badge/Built%20With-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev)

---

## ✨ Features

- 🎮 **Two Game Modes** — `Play` (free practice) and `Arcade` (lives-based progression with levels)
- 🎨 **Three Themes** — `Default`, `DBD` (Dead by Daylight), and `VD` — each with unique visual and audio styles
- 🔊 **Dynamic Audio** — Procedurally synthesized SFX with optional static MP3 backsound per theme
- 🤖 **Bot Preview** — Auto-demo mode that plays itself when idle, showing how skill checks work
- 📊 **Live Stats** — Tracks total hits, great hits, misses, streaks, best streak, and time played
- 🏆 **Session History** — Persistent session records with shareable stat cards
- 💾 **Session Restore** — Detects and offers to resume an interrupted game session
- ⏱️ **Stopwatch Widget** — In-session timer with pause/resume support
- ⚙️ **Configurable Settings** — Needle speed, zone size, zone count, overcharge mode, continuation mode, random start, auto-spawn, fail threshold, and more
- 📤 **Share Cards** — Export your session stats as a beautiful image (portrait, landscape, card, or story format)
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Build Tool | [Vite](https://vitejs.dev) |
| Rendering | HTML5 Canvas (game engine) |
| Audio | Web Audio API (procedural synthesis + static MP3) |
| Styling | Vanilla CSS |
| Linting | ESLint + typescript-eslint |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/qya/skillcheck-simulator.git
cd skillcheck-simulator

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server with HMR |
| `npm run build` | Type-check and build production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the entire project |

---

## 🗂️ Project Structure

```
skillcheck-simulator/
├── public/
│   ├── favicon.svg
│   └── sfx/
│       ├── dbd/          # DBD theme audio files (backsound, start, good, great, miss)
│       └── vd/           # VD theme audio files
├── src/
│   ├── components/
│   │   ├── ArcadeHUD.tsx         # Arcade mode lives/score overlay
│   │   ├── Header.tsx            # Top navigation bar
│   │   ├── Loader.tsx            # Splash/loading screen
│   │   ├── ModePicker.tsx        # Mode selection screen
│   │   ├── RestoreSessionDialog.tsx  # Resume interrupted session dialog
│   │   ├── SettingsDrawer.tsx    # Settings panel
│   │   ├── ShareDialog.tsx       # Share/export stat card dialog
│   │   ├── StatsBar.tsx          # Inline stats bar
│   │   ├── StatsCard.tsx         # Session stat card component
│   │   ├── StatsDrawer.tsx       # Full stats history drawer
│   │   ├── StopwatchWidget.tsx   # In-session stopwatch
│   │   └── StreakBar.tsx         # Streak progress indicator
│   ├── App.tsx       # Main game logic & canvas engine
│   ├── audio.ts      # Web Audio API sound system
│   ├── types.ts      # Shared TypeScript types
│   ├── utils.ts      # Utility functions & share card renderer
│   └── index.css     # Global styles & design system
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎮 How to Play

1. **Choose a mode** — *Play* for open practice, *Arcade* for a challenge with lives
2. **Tap / press Space** when the needle lands inside the white zone
3. Hit the **inner great zone** for bonus points and a streak boost
4. Missing resets your streak (and costs a life in Arcade mode)
5. Use **Settings** ⚙️ to tune difficulty, theme, zone size, and more

---

## 🎵 Adding Custom SFX

Place `.mp3` files in the theme folder under `public/sfx/<theme>/`:

| Filename | Trigger |
|---|---|
| `backsound.mp3` | Looping background music while playing |
| `first.mp3` | First sound on session start |
| `start.mp3` | Session start / warning sound |
| `good.mp3` | Successful hit |
| `great.mp3` | Great hit (inner zone) |
| `miss.mp3` | Missed skill check |

If a file is missing the engine falls back to procedurally generated audio automatically.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Made with ❤️ for the DBD community
