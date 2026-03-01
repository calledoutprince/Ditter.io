# Ditter.io

**A physics-driven dithering studio.** Import an image, apply a 1-bit, halftone, or ASCII dithering effect, then export directly to SVG, Figma, or Framer — all on an infinite pannable canvas.

---

## What it does

| Step | Action                                                                        |
| ---- | ----------------------------------------------------------------------------- |
| 1    | **Import** any image via the left panel or drag-and-drop                      |
| 2    | **Tune** the effect: algorithm, pixel scale, contrast, accent colour          |
| 3    | **Arrange** assets on the physics canvas — they float, bounce, and spin       |
| 4    | **Export** as SVG download, Figma clipboard paste, or a Framer Code Component |

---

## Tech Stack

| Concern       | Library                           |
| ------------- | --------------------------------- |
| UI framework  | React 19 + Vite 7                 |
| Physics       | Matter.js (via `usePhysics` hook) |
| Animation     | Framer Motion                     |
| Icons         | Lucide React                      |
| Vectorisation | Potrace                           |
| Testing       | Vitest + jsdom                    |

---

## Project Structure

```
src/
├── App.jsx                     # Root component — camera, panels, keyboard shortcuts
├── index.css                   # Design tokens + all component styles
│
├── components/
│   ├── EffectEngine.jsx        # Hidden canvas — runs dithering pipeline
│   ├── PhysicsElement.jsx      # DOM wrapper synced to a Matter.js body
│   └── Dropdown.jsx            # Animated custom select component
│
└── utils/
    ├── usePhysics.jsx          # React hook — boots & manages Matter.js engine
    ├── vectorizer.js           # Potrace wrapper — PNG → SVG compound path
    └── integrations.js         # Figma clipboard payload + Framer component codegen
```

---

## Getting Started

```bash
npm install
npm run dev        # Dev server at http://localhost:5173
npm test           # Run Vitest suite
npm run check      # Lint + build (pre-deploy gate)
```

---

## Keyboard Shortcuts

| Key                 | Action                            |
| ------------------- | --------------------------------- |
| `Space` + Drag      | Pan canvas                        |
| `Ctrl/Cmd` + Scroll | Zoom in / out                     |
| `Shift+1`           | Fit canvas to view                |
| `Shift+0`           | Reset zoom to 100%                |
| `Tab`               | Toggle all UI panels (focus mode) |

---

## Roadmap

See [`roadmap.md`](./research/) for the full phased feature roadmap.
