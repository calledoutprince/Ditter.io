# Ditter.io — Build Breakdown

_Every feature broken into the smallest shippable chunks. Each chunk = one research → build → test → push cycle._

_Each version number maps 1:1 to a patch bump in `package.json`. The # column is the definitive source of truth._

---

## Phase 1 (v0.4.x) — Richer Dithering & Visual Depth

### Pre-Processing Pipeline

| #      | Chunk                      | Status     | What ships                                                                            |
| ------ | -------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| v0.4.1 | **Pre-Blur slider**        | ✅ Shipped | Single `pre.blur` field in layer state + `filter: blur()` on tempCanvas before dither |
| v0.4.2 | **Pre-Brightness slider**  | ✅ Shipped | `pre.brightness` field + `filter: brightness()` composited at draw-time               |
| v0.4.3 | **Pre-Contrast slider**    | ✅ Shipped | `pre.contrast` field + `filter: contrast()` composited at draw-time                   |
| v0.4.4 | **Pre-Sharpness slider**   | ⏳ Next    | `pre.sharpness` field + 3×3 unsharp-mask convolution pixel loop                       |
| v0.4.5 | **Gamma slider**           | ⬜ Queued  | `pre.gamma` field + `out = 255 × (in/255)^(1/γ)` pixel loop                           |
| v0.4.6 | **Pre-Process UI section** | ✅ Shipped | Collapsible panel section in right panel with all 5 sliders wired up                  |

### Expanded Algorithm Library

| #       | Chunk                      | Status    | What ships                                                                                |
| ------- | -------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| v0.4.7  | **Floyd-Steinberg**        | ⬜ Queued | `applyFloydSteinbergDither()` in dither.js + option in algorithm selector                 |
| v0.4.8  | **Jarvis-Judice-Ninke**    | ⬜ Queued | `applyJarvisDither()` + option in selector                                                |
| v0.4.9  | **Stucki**                 | ⬜ Queued | `applyStuckiDither()` + option in selector                                                |
| v0.4.10 | **Burkes**                 | ⬜ Queued | `applyBurkesDither()` + option in selector                                                |
| v0.4.11 | **Sierra Full**            | ⬜ Queued | `applySierraDither()` + option                                                            |
| v0.4.12 | **Sierra Two-Row**         | ⬜ Queued | `applySierraTwoRowDither()` + option                                                      |
| v0.4.13 | **Sierra Lite**            | ⬜ Queued | `applySierraLiteDither()` + option                                                        |
| v0.4.14 | **Bayer 2×2**              | ⬜ Queued | `applyBayer2Dither()` + option                                                            |
| v0.4.15 | **Bayer 8×8**              | ⬜ Queued | `applyBayer8Dither()` + option                                                            |
| v0.4.16 | **Bayer 16×16**            | ⬜ Queued | `applyBayer16Dither()` + option                                                           |
| v0.4.17 | **Checkerboard**           | ⬜ Queued | `applyCheckerboardDither()` + option                                                      |
| v0.4.18 | **Algorithm selector UI**  | ⬜ Queued | Replace segmented control with a dropdown; organise by family (Error Diffusion / Ordered) |
| v0.4.19 | **Serpentine scan toggle** | ⬜ Queued | Bool flag; reverses diffusion direction on alternate rows in all error-diffusion algos    |
| v0.4.20 | **Bit Depth control**      | ⬜ Queued | Slider 1–8; quantise output to N levels instead of hard 1-bit                             |
| v0.4.21 | **Color Space selector**   | ⬜ Queued | Dropdown: Luma / RGB / CIELAB; changes luminance model used for thresholding              |

### Palette Presets & Color Tools

| #       | Chunk                     | Status    | What ships                                                                                    |
| ------- | ------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| v0.4.22 | **Palette preset data**   | ⬜ Queued | Define hex arrays for Game Boy, PICO-8, Commodore 64, CGA, EGA, Vaporwave, Ink/Paper          |
| v0.4.23 | **Preset picker UI**      | ⬜ Queued | Dropdown or swatch strip in Colors section; selecting a preset fills Shadow/Midtone/Highlight |
| v0.4.24 | **Hex import field**      | ⬜ Queued | Text input accepting comma-separated hex codes; fills first 3 into color slots                |
| v0.4.25 | **Auto color extraction** | ⬜ Queued | `extractDominantColors(imageUrl, n)` using k-means on image pixels; fills slots on import     |
| v0.4.26 | **"Surprise me" button**  | ⬜ Queued | Picks a random curated palette and applies it to the selected layer                           |

### Post-Processing & Blending

| #       | Chunk                       | Status    | What ships                                                                           |
| ------- | --------------------------- | --------- | ------------------------------------------------------------------------------------ |
| v0.4.27 | **Noise/Grain slider**      | ⬜ Queued | `post.noise` field; adds random per-pixel offset after dither pass                   |
| v0.4.28 | **Diffusion Bias slider**   | ⬜ Queued | `post.bias` field (-1 → +1); shifts quantisation threshold toward lighter or darker  |
| v0.4.29 | **Intensity blend slider**  | ⬜ Queued | `post.intensity` field; composites dithered result over original using `globalAlpha` |
| v0.4.30 | **Post-Process UI section** | ⬜ Queued | Collapsible section in right panel with the 3 sliders wired up                       |

### Text Layers

| #       | Chunk                     | Status    | What ships                                                                               |
| ------- | ------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| v0.4.31 | **Text layer type**       | ⬜ Queued | New `type: 'text'` in layer factory; stores `text`, `fontFamily`, `fontSize` fields      |
| v0.4.32 | **Text render on canvas** | ⬜ Queued | Draw text to an off-screen canvas → pass as `src` into EffectEngine same as image layers |
| v0.4.33 | **Google Fonts picker**   | ⬜ Queued | Typeahead dropdown in right panel connected to Google Fonts API                          |
| v0.4.34 | **Above/Below toggle**    | ⬜ Queued | Flag per layer; "above" layers render on top of the physics world without dither applied |
| v0.4.35 | **Text editing UI**       | ⬜ Queued | Inline text editor (click to edit on canvas) or side-panel textarea                      |

### Masks & Lenses

| #       | Chunk                          | Status    | What ships                                                                             |
| ------- | ------------------------------ | --------- | -------------------------------------------------------------------------------------- |
| v0.4.36 | **Mask shape data model**      | ⬜ Queued | New `mask` field on layer: `{ shape: 'circle' \| 'rect', x, y, w, h, inverted: bool }` |
| v0.4.37 | **Circle mask rendering**      | ⬜ Queued | Clip dither output to circle path; show raw image outside                              |
| v0.4.38 | **Rectangle mask rendering**   | ⬜ Queued | Clip to rect path; show raw image outside                                              |
| v0.4.39 | **Invert toggle**              | ⬜ Queued | Swap inside/outside — effect applies outside shape, raw shows inside                   |
| v0.4.40 | **Drag-resize mask on canvas** | ⬜ Queued | Handle corners to resize; drag body to move                                            |
| v0.4.41 | **Mask fill options**          | ⬜ Queued | Solid color, gradient, or image fill inside the shape (separate from the dither layer) |

### Additional Effects

| #       | Chunk                 | Status    | What ships                                                                             |
| ------- | --------------------- | --------- | -------------------------------------------------------------------------------------- |
| v0.4.42 | **Radial dither**     | ⬜ Queued | Effect intensity (threshold) falls off from a center point outward                     |
| v0.4.43 | **Wave distortion**   | ⬜ Queued | Sinusoidal warp applied to tempCanvas before dither (x offset = `A·sin(y·f)`)          |
| v0.4.44 | **"Ditter on Glass"** | ⬜ Queued | Research pass first; likely a frosted-glass displacement map before the threshold pass |

---

## Phase 2 (v0.5.x) — Animation & Motion

### Effect Animation Behaviors

| #      | Chunk                       | Status    | What ships                                                           |
| ------ | --------------------------- | --------- | -------------------------------------------------------------------- |
| v0.5.1 | **Animation loop system**   | ⬜ Queued | `requestAnimationFrame` loop that ticks a `phase` offset per layer   |
| v0.5.2 | **Vertical scroll**         | ⬜ Queued | Shifts dither pattern vertically each frame using phase offset       |
| v0.5.3 | **Horizontal scroll**       | ⬜ Queued | Shifts pattern horizontally                                          |
| v0.5.4 | **Diagonal scroll**         | ⬜ Queued | Combined X+Y offset per frame                                        |
| v0.5.5 | **Speed control**           | ⬜ Queued | Per-layer slider (px/frame or frames/cycle)                          |
| v0.5.6 | **Animation on/off toggle** | ⬜ Queued | Button in right panel to arm/disarm the animation loop for the layer |

### Frame Input

| #       | Chunk                      | Status    | What ships                                                                          |
| ------- | -------------------------- | --------- | ----------------------------------------------------------------------------------- |
| v0.5.7  | **GIF decoder**            | ⬜ Queued | Import animated GIF → extract frames as individual image URLs (`omggif` or similar) |
| v0.5.8  | **Video frame extractor**  | ⬜ Queued | Import short MP4/WebM → extract frames using hidden `<video>` + canvas seek         |
| v0.5.9  | **Frames timeline UI**     | ⬜ Queued | Horizontal strip in bottom panel showing frame thumbnails                           |
| v0.5.10 | **Per-frame delay editor** | ⬜ Queued | Click a frame thumbnail → set delay (ms)                                            |
| v0.5.11 | **Batch apply settings**   | ⬜ Queued | "Apply to all frames" button propagates current effect settings across all frames   |

### Motion Export

| #       | Chunk                  | Status    | What ships                                                                |
| ------- | ---------------------- | --------- | ------------------------------------------------------------------------- |
| v0.5.12 | **GIF export**         | ⬜ Queued | Capture N frames from the animation loop → encode via `gif.js` → download |
| v0.5.13 | **WebM export**        | ⬜ Queued | Use `MediaRecorder` on the canvas stream → download `.webm`               |
| v0.5.14 | **MP4 export**         | ⬜ Queued | `CCapture.js` to capture frames → mux to MP4                              |
| v0.5.15 | **Export progress UI** | ⬜ Queued | Progress bar / frame counter during encoding                              |

---

## Phase 3 (v0.6.x) — Workflow, Integrations & Reach

### Vector Export

| #      | Chunk                        | Status    | What ships                                                                          |
| ------ | ---------------------------- | --------- | ----------------------------------------------------------------------------------- |
| v0.6.1 | **SVG pixel grid generator** | ⬜ Queued | Convert processed canvas pixel data → `<rect>` elements per dark pixel → SVG string |
| v0.6.2 | **SVG download**             | ⬜ Queued | Write SVG string to Blob → trigger download as `.svg`                               |
| v0.6.3 | **SVG copy to clipboard**    | ⬜ Queued | Write SVG string to clipboard as `image/svg+xml`                                    |

### Shareable Links

| #      | Chunk                     | Status    | What ships                                                       |
| ------ | ------------------------- | --------- | ---------------------------------------------------------------- |
| v0.6.4 | **Settings serialiser**   | ⬜ Queued | Encode layer effect params into a compact URL query string       |
| v0.6.5 | **Settings deserialiser** | ⬜ Queued | On load, read URL params → hydrate layer state                   |
| v0.6.6 | **Share button UI**       | ⬜ Queued | Button in top bar → writes URL to clipboard with a success toast |

### Figma / Framer / Affinity Integration

| #      | Chunk                                 | Status    | What ships                                                      |
| ------ | ------------------------------------- | --------- | --------------------------------------------------------------- |
| v0.6.7 | **Raster clipboard copy**             | ⬜ Queued | Copy processed PNG to clipboard as `image/png` (partially done) |
| v0.6.8 | **HTML clipboard payload**            | ⬜ Queued | Construct `<img>` HTML clipboard item for Figma paste           |
| v0.6.9 | **Vector clipboard payload research** | ⬜ Queued | Investigate SVG clipboard format accepted by Figma/Affinity     |

### Contextual Menus (Right-Click)

| #       | Chunk                      | Status    | What ships                                                                  |
| ------- | -------------------------- | --------- | --------------------------------------------------------------------------- |
| v0.6.10 | **Context menu component** | ⬜ Queued | Floating menu rendered at pointer position; Escape/click-outside to dismiss |
| v0.6.11 | **Layer actions**          | ⬜ Queued | Duplicate layer, delete layer, rename                                       |
| v0.6.12 | **Effect quick-apply**     | ⬜ Queued | One-click apply presets from context menu                                   |
| v0.6.13 | **Quick export**           | ⬜ Queued | Export selected layer PNG from context menu                                 |

### Grouping ("Frames")

| #       | Chunk                      | Status    | What ships                                                               |
| ------- | -------------------------- | --------- | ------------------------------------------------------------------------ |
| v0.6.14 | **Group data model**       | ⬜ Queued | `group` field on layers; layers sharing a group id move/rotate together  |
| v0.6.15 | **Group physics body**     | ⬜ Queued | Combine Matter.js bodies into a compound body                            |
| v0.6.16 | **Group/ungroup UI**       | ⬜ Queued | Select multiple layers → "Group" button; Ungroup to release              |
| v0.6.17 | **Shared effect boundary** | ⬜ Queued | Render group layers to a shared off-screen canvas; apply one dither pass |

---

## Phase 4 (v0.7.x) — UX Polish & Persistence

| #       | Chunk                          | Status    | What ships                                                                    |
| ------- | ------------------------------ | --------- | ----------------------------------------------------------------------------- |
| v0.7.1  | **IndexedDB layer serialiser** | ⬜ Queued | Serialise `layers[]` state (excluding blob URLs) to IndexedDB on every change |
| v0.7.2  | **Blob persistence**           | ⬜ Queued | Store blob image data in IndexedDB alongside layer metadata                   |
| v0.7.3  | **Restore on load**            | ⬜ Queued | On app mount, hydrate layers from IndexedDB before first render               |
| v0.7.4  | **Clear session button**       | ⬜ Queued | "New canvas" action that wipes IndexedDB and resets state                     |
| v0.7.5  | **Sound system setup**         | ⬜ Queued | Install `howler.js`; define sound map for each trigger event                  |
| v0.7.6  | **Import sound**               | ⬜ Queued | Plays on first image import                                                   |
| v0.7.7  | **Drop sound**                 | ⬜ Queued | Plays when a physics element lands on canvas                                  |
| v0.7.8  | **Effect toggle sound**        | ⬜ Queued | Plays when an effect is armed or removed                                      |
| v0.7.9  | **Export sound**               | ⬜ Queued | Plays on successful download                                                  |
| v0.7.10 | **FTUE detection**             | ⬜ Queued | Check `localStorage` flag; show onboarding only on first visit                |
| v0.7.11 | **Onboarding animation**       | ⬜ Queued | Animated canvas showing physics drop + dither effect applying                 |
| v0.7.12 | **Dismiss + don't show again** | ⬜ Queued | "Got it" button sets the visited flag                                         |

---

## Phase 5 (v1.0.x) — Cloud & Community

| #      | Chunk                        | Status    | What ships                                                                         |
| ------ | ---------------------------- | --------- | ---------------------------------------------------------------------------------- |
| v1.0.1 | **Auth setup**               | ⬜ Queued | Supabase project + Google/GitHub OAuth                                             |
| v1.0.2 | **User account UI**          | ⬜ Queued | Avatar, login/logout button in top bar                                             |
| v1.0.3 | **Cloud workspace save**     | ⬜ Queued | On save, serialise canvas state → POST to Supabase `workspaces` table              |
| v1.0.4 | **Cloud workspace load**     | ⬜ Queued | Fetch user's workspaces; list in a "Open" modal                                    |
| v1.0.5 | **Server-side video render** | ⬜ Queued | Edge function receives frame data → encodes MP4 server-side → returns download URL |
| v1.0.6 | **Freemium gate**            | ⬜ Queued | Feature flags per user tier; show upgrade nudge for premium features               |

---
