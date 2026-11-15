# CAPTCHA HELL

> Prove you're human. We dare you.

A comedic browser game made for a one-day Stupid Ideas Hackathon. Survive increasingly unfair CAPTCHA challenges set by THE GATEKEEPER, a smug little security guard who lives inside a cursed late-90s security program. The more you succeed, the more he panics.

## Current state

- Title screen, HUD (lives, level, countdown, score, run time, Gatekeeper panic meter)
- **Level 1: Runaway CAPTCHA** - find the three traffic lights in 20 seconds while tiles shuffle and the targets try to dodge your cursor
- **Level 2: The Gatekeeper's Impossible Maze** - click START, then steer the cursor through a hand-built corridor to FINISH within 25 seconds. Touching a wall costs a life. When you near the exit the Gatekeeper moves it (once per attempt), then brings a security gate online.
- Gatekeeper placeholder with emotions (`smug`, `annoyed`, `nervous`, `panicking`, `meltdown`) and dialogue driven by real gameplay events
- Level complete screens, game over, restart, and a Final Evaluation placeholder

Not yet built: the Final Evaluation itself and the ACCESS DENIED ending.

### Level 5: The Human Inspection Department (webcam)

Uses MediaPipe Face Landmarker in the browser: face, smile and open-mouth checks, each held for 700 ms. Video never leaves the browser. The camera needs a deliberate click, plus HTTPS or `localhost`. If it is denied or unavailable you can retry, use a clearly labelled presenter mode (no computer vision), or skip the level at no cost. The model is in `public/models/`; `npm install` copies the WASM runtime into `public/mediapipe/` (see `scripts/copy-mediapipe.mjs`). Detection thresholds live in `INSPECTION` in `src/lib/gameConfig.ts`.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000> (desktop Chrome is the primary target).

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Start the dev server       |
| `npm run build`     | Production build           |
| `npm start`         | Serve the production build |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | TypeScript (no emit)       |

## Project structure

```
src/app/                    Next.js App Router entry (layout, page, global styles)
src/components/             Game, HUD, Gatekeeper, RunawayCaptcha, screens
src/hooks/useGameEngine.ts  Typed useReducer game state, timers, Gatekeeper dialogue
src/lib/gameTypes.ts        Shared types
src/lib/gameConfig.ts       Tunable numbers (time, points, dodge, shuffle, maze) and dialogue
src/lib/mazeGeometry.ts     Hand-designed maze layout and collision helpers (maze units)
public/sprites/gatekeeper/  Gatekeeper sprite PNGs, one per emotion
```

Cursor position and tile movement live inside `RunawayCaptcha`; only discrete events (hit, wrong pick, dodge) reach the global reducer.

## Tech

Next.js (App Router), TypeScript (strict), Tailwind CSS, Motion, Lucide React. No backend or external services.
