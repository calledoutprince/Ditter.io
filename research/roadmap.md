# Ditter.io Roadmap

**A living document for the future of Ditter.io: a physics-driven dithering studio.**

---

## ✅ Foundation (Shipped)

> Everything here is live and tested.

- Per-layer state architecture (each layer has its own effect, colors, opacity, visibility)
- Layer panel with inline rename (F2/double-click), eye toggle, thumbnail
- Physics canvas with layer selection (blue outline), drag-and-drop, Ctrl+V paste
- **1-Bit (Atkinson)** dithering — real error-diffusion algorithm
- **Halftone** — real Bayer 4×4 ordered dither matrix
- **ASCII** — real character-rendering pipeline with 8× upscale
- **3-Color mapping** (Shadow / Midtone / Highlight) — live color pickers per layer
- Custom sliders (blue-fill track, percentage pill)
- PNG export with nearest-neighbour upscaling (1×/2×/4×)
- Key bindings: Delete, F2, Ctrl+Z, Ctrl+V, Tab, Escape, ?
- effectEnabled: false by default — raw image shows until user picks an effect

---

## Phase 1 (v0.4.x) — Richer Dithering & Visual Depth

_Goal: make Ditter.io the most expressive dither tool — deep controls, more algorithms, more ways to shape the image._

### v0.4.0 — Pre-Processing Pipeline
- **Pre-Blur** (0–20 px) — soften image before dithering to smooth band edges
- **Pre-Brightness** (-100 → +100) — lift or crush exposure before threshold
- **Pre-Contrast** (-100 → +100) — expand or compress tonal range
- **Pre-Sharpness** (0–100) — unsharp-mask pass to punch up edges
- **Gamma** (0.2–4.0) — non-linear tone curve before the dither pass

### v0.4.1 — Expanded Algorithm Library
- **Floyd-Steinberg** — the standard error-diffusion reference
- **Jarvis-Judice-Ninke** — 12-neighbor spread; smoothest gradients
- **Stucki** — sharper JJN variant
- **Burkes** — faster, lighter variant
- **Sierra** family (Full / Two-Row / Lite)
- **Bayer 2×2 / 8×8 / 16×16** — finer or coarser ordered patterns
- **Checkerboard** — sharp alternating grid pattern
- **Serpentine scan toggle** — reverses diffusion direction on alternate rows (kills directional bias)
- **Bit Depth** (1–8 bit) — quantise to N output levels, not just 1-bit B&W
- **Color Space selector** — Luma / RGB / CIELAB for the threshold calculation

### v0.4.2 — Palette Presets & Color Tools
- **Retro presets** — Game Boy (4), PICO-8 (16), Commodore 64 (16), CGA/EGA, Vaporwave, Ink/Paper
- **Custom palette import** — paste hex codes or import from Lospec URL
- **Auto-extraction** — extract dominant colors from source image to pre-fill Shadow/Midtone/Highlight
- **"Surprise me"** — random curated palette for quick inspiration

### v0.4.3 — Post-Processing & Blending
- **Noise/Grain overlay** (0–100%) — adds film grain after dithering for a "human" imperfect feel
- **Diffusion Bias** (-1.0 → +1.0) — nudge quantisation toward lighter or darker output
- **Intensity blend** (0–100%) — blend dithered result with the original image

### v0.4.4 — Text Layers
- Add a text element type to the canvas (alongside image layers)
- Integrate Google Fonts for a robust type selection
- Toggle: text sits *under* the dither effect pipeline or floats *above* it cleanly

### v0.4.5 — Masks & Lenses
- Circle and rectangle area-of-focus shapes on the canvas
- Dither effect applies only *inside* (or outside) the shape — revealing raw image beyond
- Shape fills: solid color, gradient, image, or video

### v0.4.6 — Additional Effects
- **Radial dither** — effect intensity radiates from a center point
- **Wave distortion** — sinusoidal warp applied before the dither pass
- **"Ditter on Glass"** — experimental optical refraction / frosted-glass look

---

## Phase 2 (v0.5.x) — Animation & Motion

_Goal: bring dithered frames to life for motion designers, social content, and lo-fi video._

### v0.5.0 — Effect Animation Behaviors
- Animate dither patterns procedurally: Vertical, Horizontal, Diagonal (all 4 directions)
- Configurable speed and direction per layer

### v0.5.1 — Frame Input
- Import GIF or short video clip → split into editable frames
- Per-frame dither settings, or batch-apply a single parameter set across all frames
- Frame timing editor (adjust delay per frame)

### v0.5.2 — Motion Export
- **Animated GIF** — via \gif.js\ (client-side, no server)
- **WebM** — canvas \MediaRecorder\ for transparency support
- **MP4** — via \CCapture.js\ or native browser recording APIs

---

## Phase 3 (v0.6.x) — Workflow, Integrations & Reach

_Goal: fit into professional design workflows and make Ditter.io shareable._

### v0.6.0 — Vector Export
- Output SVG dither patterns — scalable for branding, UI, and print
- Illustrator / Figma friendly import

### v0.6.1 — Shareable Links
- Encode all effect settings into URL parameters
- Share a link → recipient opens the exact same canvas state

### v0.6.2 — Figma / Framer / Affinity Integration
- Phase 3a: Direct clipboard export as flattened raster PNG
- Phase 3b: Investigate editable vector clipboard payloads

### v0.6.3 — Contextual Menus (Right-Click)
- Custom canvas context menu with quick actions:
  - Apply suggested effects, duplicate layer, quick export, group selection

### v0.6.4 — Grouping ("Frames")
- Group image + text layers into a single "Frame" rigid body
- Shared physics behavior and shared effect boundary

---

## Phase 4 (v0.7.x) — UX Polish & Persistence

_Goal: make the tool reliable, immersive, and enjoyable for long sessions._

### v0.7.0 — Local Persistence (IndexedDB)
- Auto-save canvas layout, images, and all effect parameters to the browser
- Survive page refresh and browser crashes without losing work

### v0.7.1 — Sound Design
- Tactile UI sounds (\howler.js\ or Web Audio API)
- Triggers: first image import, element drop, heavy effect toggle, export complete

### v0.7.2 — First-Time User Experience (FTUE)
- Lightweight, beautiful onboarding animation on first launch
- Introduces the physics + dithering concept interactively

---

## Phase 5 (v1.0.x) — Cloud & Community (Long-Term)

_Goal: transform Ditter.io from a local studio into a platform._

### v1.0.0 — Accounts & Freemium Model
- Core features (prototyping, local save, basic export) remain **free and login-free forever**
- Premium tier via Supabase / Firebase:
  - Cloud workspace sync across devices
  - Server-side video rendering (for long or HD exports)
  - Early access to experimental effects

---
