# Ditter.io — Build Breakdown

_Every feature broken into the smallest shippable chunks. Each chunk = one research → build → test → push cycle._

---

## Phase 1 — Richer Dithering & Visual Depth

### 1.1 Pre-Processing Pipeline

| #     | Chunk                      | What ships                                                                            |
| ----- | -------------------------- | ------------------------------------------------------------------------------------- |
| 1.1.1 | **Pre-Blur slider**        | Single `pre.blur` field in layer state + `filter: blur()` on tempCanvas before dither |
| 1.1.2 | **Pre-Brightness slider**  | `pre.brightness` field + `filter: brightness()` composited at draw-time               |
| 1.1.3 | **Pre-Contrast slider**    | `pre.contrast` field + `filter: contrast()` composited at draw-time                   |
| 1.1.4 | **Pre-Sharpness slider**   | `pre.sharpness` field + 3×3 unsharp-mask convolution pixel loop                       |
| 1.1.5 | **Gamma slider**           | `pre.gamma` field + `out = 255 × (in/255)^(1/γ)` pixel loop                           |
| 1.1.6 | **Pre-Process UI section** | Collapsible panel section in right panel with all 5 sliders wired up                  |

### 1.2 Expanded Algorithm Library

| #      | Chunk                      | What ships                                                                                |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- |
| 1.2.1  | **Floyd-Steinberg**        | `applyFloydSteinbergDither()` in EffectEngine + option in algorithm selector              |
| 1.2.2  | **Jarvis-Judice-Ninke**    | `applyJarvisDither()` + option in selector                                                |
| 1.2.3  | **Stucki**                 | `applyStuckiDither()` + option in selector                                                |
| 1.2.4  | **Burkes**                 | `applyBurkesDither()` + option in selector                                                |
| 1.2.5  | **Sierra Full**            | `applySierraDither()` + option                                                            |
| 1.2.6  | **Sierra Two-Row**         | `applySierraTwoRowDither()` + option                                                      |
| 1.2.7  | **Sierra Lite**            | `applySierraLiteDither()` + option                                                        |
| 1.2.8  | **Bayer 2×2**              | `applyBayer2Dither()` + option                                                            |
| 1.2.9  | **Bayer 8×8**              | `applyBayer8Dither()` + option                                                            |
| 1.2.10 | **Bayer 16×16**            | `applyBayer16Dither()` + option                                                           |
| 1.2.11 | **Checkerboard**           | `applyCheckerboardDither()` + option                                                      |
| 1.2.12 | **Algorithm selector UI**  | Replace segmented control with a dropdown; organise by family (Error Diffusion / Ordered) |
| 1.2.13 | **Serpentine scan toggle** | Bool flag; reverses diffusion direction on alternate rows in all error-diffusion algos    |
| 1.2.14 | **Bit Depth control**      | Slider 1–8; quantise output to N levels instead of hard 1-bit                             |
| 1.2.15 | **Color Space selector**   | Dropdown: Luma / RGB / CIELAB; changes luminance model used for thresholding              |

### 1.3 Palette Presets & Color Tools

| #     | Chunk                     | What ships                                                                                    |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------- |
| 1.3.1 | **Palette preset data**   | Define hex arrays for Game Boy, PICO-8, Commodore 64, CGA, EGA, Vaporwave, Ink/Paper          |
| 1.3.2 | **Preset picker UI**      | Dropdown or swatch strip in Colors section; selecting a preset fills Shadow/Midtone/Highlight |
| 1.3.3 | **Hex import field**      | Text input accepting comma-separated hex codes; fills first 3 into color slots                |
| 1.3.4 | **Auto color extraction** | `extractDominantColors(imageUrl, n)` using k-means on image pixels; fills slots on import     |
| 1.3.5 | **"Surprise me" button**  | Picks a random curated palette and applies it to the selected layer                           |

### 1.4 Post-Processing & Blending

| #     | Chunk                       | What ships                                                                           |
| ----- | --------------------------- | ------------------------------------------------------------------------------------ |
| 1.4.1 | **Noise/Grain slider**      | `post.noise` field; adds random per-pixel offset after dither pass                   |
| 1.4.2 | **Diffusion Bias slider**   | `post.bias` field (-1 → +1); shifts quantisation threshold toward lighter or darker  |
| 1.4.3 | **Intensity blend slider**  | `post.intensity` field; composites dithered result over original using `globalAlpha` |
| 1.4.4 | **Post-Process UI section** | Collapsible section in right panel with the 3 sliders wired up                       |

### 1.5 Text Layers

| #     | Chunk                     | What ships                                                                               |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------- |
| 1.5.1 | **Text layer type**       | New `type: 'text'` in layer factory; stores `text`, `fontFamily`, `fontSize` fields      |
| 1.5.2 | **Text render on canvas** | Draw text to an off-screen canvas → pass as `src` into EffectEngine same as image layers |
| 1.5.3 | **Google Fonts picker**   | Typeahead dropdown in right panel connected to Google Fonts API                          |
| 1.5.4 | **Above/Below toggle**    | Flag per layer; "above" layers render on top of the physics world without dither applied |
| 1.5.5 | **Text editing UI**       | Inline text editor (click to edit on canvas) or side-panel textarea                      |

### 1.6 Masks & Lenses

| #     | Chunk                          | What ships                                                                             |
| ----- | ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------- |
| 1.6.1 | **Mask shape data model**      | New `mask` field on layer: `{ shape: 'circle'                                          | 'rect', x, y, w, h, inverted: bool }` |
| 1.6.2 | **Circle mask rendering**      | Clip dither output to circle path; show raw image outside                              |
| 1.6.3 | **Rectangle mask rendering**   | Clip to rect path; show raw image outside                                              |
| 1.6.4 | **Invert toggle**              | Swap inside/outside — effect applies outside shape, raw shows inside                   |
| 1.6.5 | **Drag-resize mask on canvas** | Handle corners to resize; drag body to move                                            |
| 1.6.6 | **Mask fill options**          | Solid color, gradient, or image fill inside the shape (separate from the dither layer) |

### 1.7 Additional Effects

| #     | Chunk                 | What ships                                                                             |
| ----- | --------------------- | -------------------------------------------------------------------------------------- |
| 1.7.1 | **Radial dither**     | Effect intensity (threshold) falls off from a center point outward                     |
| 1.7.2 | **Wave distortion**   | Sinusoidal warp applied to tempCanvas before dither (x offset = `A·sin(y·f)`)          |
| 1.7.3 | **"Ditter on Glass"** | Research pass first; likely a frosted-glass displacement map before the threshold pass |

---

## Phase 2 — Animation & Motion

### 2.1 Effect Animation Behaviors

| #     | Chunk                       | What ships                                                           |
| ----- | --------------------------- | -------------------------------------------------------------------- |
| 2.1.1 | **Animation loop system**   | `requestAnimationFrame` loop that ticks a `phase` offset per layer   |
| 2.1.2 | **Vertical scroll**         | Shifts dither pattern vertically each frame using phase offset       |
| 2.1.3 | **Horizontal scroll**       | Shifts pattern horizontally                                          |
| 2.1.4 | **Diagonal scroll**         | Combined X+Y offset per frame                                        |
| 2.1.5 | **Speed control**           | Per-layer slider (px/frame or frames/cycle)                          |
| 2.1.6 | **Animation on/off toggle** | Button in right panel to arm/disarm the animation loop for the layer |

### 2.2 Frame Input

| #     | Chunk                      | What ships                                                                          |
| ----- | -------------------------- | ----------------------------------------------------------------------------------- |
| 2.2.1 | **GIF decoder**            | Import animated GIF → extract frames as individual image URLs (`omggif` or similar) |
| 2.2.2 | **Video frame extractor**  | Import short MP4/WebM → extract frames using hidden `<video>` + canvas seek         |
| 2.2.3 | **Frames timeline UI**     | Horizontal strip in bottom panel showing frame thumbnails                           |
| 2.2.4 | **Per-frame delay editor** | Click a frame thumbnail → set delay (ms)                                            |
| 2.2.5 | **Batch apply settings**   | "Apply to all frames" button propagates current effect settings across all frames   |

### 2.3 Motion Export

| #     | Chunk                  | What ships                                                                |
| ----- | ---------------------- | ------------------------------------------------------------------------- |
| 2.3.1 | **GIF export**         | Capture N frames from the animation loop → encode via `gif.js` → download |
| 2.3.2 | **WebM export**        | Use `MediaRecorder` on the canvas stream → download `.webm`               |
| 2.3.3 | **MP4 export**         | `CCapture.js` to capture frames → mux to MP4                              |
| 2.3.4 | **Export progress UI** | Progress bar / frame counter during encoding                              |

---

## Phase 3 — Workflow, Integrations & Reach

### 3.1 Vector Export

| #     | Chunk                        | What ships                                                                          |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------- |
| 3.1.1 | **SVG pixel grid generator** | Convert processed canvas pixel data → `<rect>` elements per dark pixel → SVG string |
| 3.1.2 | **SVG download**             | Write SVG string to Blob → trigger download as `.svg`                               |
| 3.1.3 | **SVG copy to clipboard**    | Write SVG string to clipboard as `image/svg+xml`                                    |

### 3.2 Shareable Links

| #     | Chunk                     | What ships                                                       |
| ----- | ------------------------- | ---------------------------------------------------------------- |
| 3.2.1 | **Settings serialiser**   | Encode layer effect params into a compact URL query string       |
| 3.2.2 | **Settings deserialiser** | On load, read URL params → hydrate layer state                   |
| 3.2.3 | **Share button UI**       | Button in top bar → writes URL to clipboard with a success toast |

### 3.3 Figma / Framer / Affinity Integration

| #     | Chunk                                 | What ships                                                              |
| ----- | ------------------------------------- | ----------------------------------------------------------------------- |
| 3.3.1 | **Raster clipboard copy (Phase 3a)**  | Copy processed PNG to clipboard as `image/png` (already partially done) |
| 3.3.2 | **HTML clipboard payload (Phase 3b)** | Construct `<img>` HTML clipboard item for Figma paste                   |
| 3.3.3 | **Vector clipboard payload research** | Investigate SVG clipboard format accepted by Figma/Affinity             |

### 3.4 Contextual Menus (Right-Click)

| #     | Chunk                      | What ships                                                                  |
| ----- | -------------------------- | --------------------------------------------------------------------------- |
| 3.4.1 | **Context menu component** | Floating menu rendered at pointer position; Escape/click-outside to dismiss |
| 3.4.2 | **Layer actions**          | Duplicate layer, delete layer, rename                                       |
| 3.4.3 | **Effect quick-apply**     | One-click apply presets from context menu                                   |
| 3.4.4 | **Quick export**           | Export selected layer PNG from context menu                                 |

### 3.5 Grouping ("Frames")

| #     | Chunk                      | What ships                                                               |
| ----- | -------------------------- | ------------------------------------------------------------------------ |
| 3.5.1 | **Group data model**       | `group` field on layers; layers sharing a group id move/rotate together  |
| 3.5.2 | **Group physics body**     | Combine Matter.js bodies into a compound body                            |
| 3.5.3 | **Group/ungroup UI**       | Select multiple layers → "Group" button; Ungroup to release              |
| 3.5.4 | **Shared effect boundary** | Render group layers to a shared off-screen canvas; apply one dither pass |

---

## Phase 4 — UX Polish & Persistence

| #     | Chunk                          | What ships                                                                    |
| ----- | ------------------------------ | ----------------------------------------------------------------------------- |
| 4.1.1 | **IndexedDB layer serialiser** | Serialise `layers[]` state (excluding blob URLs) to IndexedDB on every change |
| 4.1.2 | **Blob persistence**           | Store blob image data in IndexedDB alongside layer metadata                   |
| 4.1.3 | **Restore on load**            | On app mount, hydrate layers from IndexedDB before first render               |
| 4.1.4 | **Clear session button**       | "New canvas" action that wipes IndexedDB and resets state                     |
| 4.2.1 | **Sound system setup**         | Install `howler.js`; define sound map for each trigger event                  |
| 4.2.2 | **Import sound**               | Plays on first image import                                                   |
| 4.2.3 | **Drop sound**                 | Plays when a physics element lands on canvas                                  |
| 4.2.4 | **Effect toggle sound**        | Plays when an effect is armed or removed                                      |
| 4.2.5 | **Export sound**               | Plays on successful download                                                  |
| 4.3.1 | **FTUE detection**             | Check `localStorage` flag; show onboarding only on first visit                |
| 4.3.2 | **Onboarding animation**       | Animated canvas showing physics drop + dither effect applying                 |
| 4.3.3 | **Dismiss + don't show again** | "Got it" button sets the visited flag                                         |

---

## Phase 5 — Cloud & Community

| #     | Chunk                        | What ships                                                                         |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------- |
| 5.1.1 | **Auth setup**               | Supabase project + Google/GitHub OAuth                                             |
| 5.1.2 | **User account UI**          | Avatar, login/logout button in top bar                                             |
| 5.1.3 | **Cloud workspace save**     | On save, serialise canvas state → POST to Supabase `workspaces` table              |
| 5.1.4 | **Cloud workspace load**     | Fetch user's workspaces; list in a "Open" modal                                    |
| 5.1.5 | **Server-side video render** | Edge function receives frame data → encodes MP4 server-side → returns download URL |
| 5.1.6 | **Freemium gate**            | Feature flags per user tier; show upgrade nudge for premium features               |

---
