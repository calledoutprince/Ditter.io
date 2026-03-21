# Ditter.io — Build Breakdown

_Every feature broken into the smallest shippable chunks. Each chunk = one research → build → test → push cycle._

---

## Phase 1 (v0.4.x) — Richer Dithering & Visual Depth

### Pre-Processing Pipeline

| #     | Chunk                      | What ships                                                                            |
| ----- | -------------------------- | ------------------------------------------------------------------------------------- |
| v0.4.0-1   | **Pre-Blur slider**        | Single `pre.blur` field in layer state + `filter: blur()` on tempCanvas before dither |
| v0.4.0-2   | **Pre-Brightness slider**  | `pre.brightness` field + `filter: brightness()` composited at draw-time               |
| v0.4.0-3   | **Pre-Contrast slider**    | `pre.contrast` field + `filter: contrast()` composited at draw-time                   |
| v0.4.0-4   | **Pre-Sharpness slider**   | `pre.sharpness` field + 3×3 unsharp-mask convolution pixel loop                       |
| v0.4.0-5   | **Gamma slider**           | `pre.gamma` field + `out = 255 × (in/255)^(1/γ)` pixel loop                           |
| v0.4.0-6   | **Pre-Process UI section** | Collapsible panel section in right panel with all 5 sliders wired up                  |

### Expanded Algorithm Library

| #      | Chunk                      | What ships                                                                                |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- |
| v0.4.11    | **Floyd-Steinberg**        | `applyFloydSteinbergDither()` in EffectEngine + option in algorithm selector              |
| v0.4.12    | **Jarvis-Judice-Ninke**    | `applyJarvisDither()` + option in selector                                                |
| v0.4.13    | **Stucki**                 | `applyStuckiDither()` + option in selector                                                |
| v0.4.14    | **Burkes**                 | `applyBurkesDither()` + option in selector                                                |
| v0.4.15    | **Sierra Full**            | `applySierraDither()` + option                                                            |
| v0.4.16    | **Sierra Two-Row**         | `applySierraTwoRowDither()` + option                                                      |
| v0.4.17    | **Sierra Lite**            | `applySierraLiteDither()` + option                                                        |
| v0.4.18    | **Bayer 2×2**              | `applyBayer2Dither()` + option                                                            |
| v0.4.19    | **Bayer 8×8**              | `applyBayer8Dither()` + option                                                            |
| v0.4.1-10  | **Bayer 16×16**            | `applyBayer16Dither()` + option                                                           |
| v0.4.1-11  | **Checkerboard**           | `applyCheckerboardDither()` + option                                                      |
| v0.4.1-12  | **Algorithm selector UI**  | Replace segmented control with a dropdown; organise by family (Error Diffusion / Ordered) |
| v0.4.1-13  | **Serpentine scan toggle** | Bool flag; reverses diffusion direction on alternate rows in all error-diffusion algos    |
| v0.4.1-14  | **Bit Depth control**      | Slider 1–8; quantise output to N levels instead of hard 1-bit                             |
| v0.4.1-15  | **Color Space selector**   | Dropdown: Luma / RGB / CIELAB; changes luminance model used for thresholding              |

### Palette Presets & Color Tools

| #     | Chunk                     | What ships                                                                                    |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------- |
| v0.4.2-1   | **Palette preset data**   | Define hex arrays for Game Boy, PICO-8, Commodore 64, CGA, EGA, Vaporwave, Ink/Paper          |
| v0.4.2-2   | **Preset picker UI**      | Dropdown or swatch strip in Colors section; selecting a preset fills Shadow/Midtone/Highlight |
| v0.4.2-3   | **Hex import field**      | Text input accepting comma-separated hex codes; fills first 3 into color slots                |
| v0.4.2-4   | **Auto color extraction** | `extractDominantColors(imageUrl, n)` using k-means on image pixels; fills slots on import     |
| v0.4.2-5   | **"Surprise me" button**  | Picks a random curated palette and applies it to the selected layer                           |

### Post-Processing & Blending

| #     | Chunk                       | What ships                                                                           |
| ----- | --------------------------- | ------------------------------------------------------------------------------------ |
| v0.4.3-1   | **Noise/Grain slider**      | `post.noise` field; adds random per-pixel offset after dither pass                   |
| v0.4.3-2   | **Diffusion Bias slider**   | `post.bias` field (-1 → +1); shifts quantisation threshold toward lighter or darker  |
| v0.4.3-3   | **Intensity blend slider**  | `post.intensity` field; composites dithered result over original using `globalAlpha` |
| v0.4.3-4   | **Post-Process UI section** | Collapsible section in right panel with the 3 sliders wired up                       |

### Text Layers

| #     | Chunk                     | What ships                                                                               |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------- |
| v0.4.4-1   | **Text layer type**       | New `type: 'text'` in layer factory; stores `text`, `fontFamily`, `fontSize` fields      |
| v0.4.4-2   | **Text render on canvas** | Draw text to an off-screen canvas → pass as `src` into EffectEngine same as image layers |
| v0.4.4-3   | **Google Fonts picker**   | Typeahead dropdown in right panel connected to Google Fonts API                          |
| v0.4.4-4   | **Above/Below toggle**    | Flag per layer; "above" layers render on top of the physics world without dither applied |
| v0.4.4-5   | **Text editing UI**       | Inline text editor (click to edit on canvas) or side-panel textarea                      |

### v0.4.5 Masks & Lenses

| #     | Chunk                          | What ships                                                                             |
| ----- | ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------- |
| v0.4.5-1   | **Mask shape data model**      | New `mask` field on layer: `{ shape: 'circle'                                          | 'rect', x, y, w, h, inverted: bool }` |
| v0.4.5-2   | **Circle mask rendering**      | Clip dither output to circle path; show raw image outside                              |
| v0.4.5-3   | **Rectangle mask rendering**   | Clip to rect path; show raw image outside                                              |
| v0.4.5-4   | **Invert toggle**              | Swap inside/outside — effect applies outside shape, raw shows inside                   |
| v0.4.5-5   | **Drag-resize mask on canvas** | Handle corners to resize; drag body to move                                            |
| v0.4.5-6   | **Mask fill options**          | Solid color, gradient, or image fill inside the shape (separate from the dither layer) |

### v0.4.6 Additional Effects

| #     | Chunk                 | What ships                                                                             |
| ----- | --------------------- | -------------------------------------------------------------------------------------- |
| v0.4.6-1   | **Radial dither**     | Effect intensity (threshold) falls off from a center point outward                     |
| v0.4.6-2   | **Wave distortion**   | Sinusoidal warp applied to tempCanvas before dither (x offset = `A·sin(y·f)`)          |
| v0.4.6-3   | **"Ditter on Glass"** | Research pass first; likely a frosted-glass displacement map before the threshold pass |

---

## Phase 2 (v0.5.x) — Animation & Motion

### v0.5.0 Effect Animation Behaviors

| #     | Chunk                       | What ships                                                           |
| ----- | --------------------------- | -------------------------------------------------------------------- |
| v0.5.0-1   | **Animation loop system**   | `requestAnimationFrame` loop that ticks a `phase` offset per layer   |
| v0.5.0-2   | **Vertical scroll**         | Shifts dither pattern vertically each frame using phase offset       |
| v0.5.0-3   | **Horizontal scroll**       | Shifts pattern horizontally                                          |
| v0.5.0-4   | **Diagonal scroll**         | Combined X+Y offset per frame                                        |
| v0.5.0-5   | **Speed control**           | Per-layer slider (px/frame or frames/cycle)                          |
| v0.5.0-6   | **Animation on/off toggle** | Button in right panel to arm/disarm the animation loop for the layer |

### v0.5.1 Frame Input

| #     | Chunk                      | What ships                                                                          |
| ----- | -------------------------- | ----------------------------------------------------------------------------------- |
| v0.5.1-1   | **GIF decoder**            | Import animated GIF → extract frames as individual image URLs (`omggif` or similar) |
| v0.5.1-2   | **Video frame extractor**  | Import short MP4/WebM → extract frames using hidden `<video>` + canvas seek         |
| v0.5.1-3   | **Frames timeline UI**     | Horizontal strip in bottom panel showing frame thumbnails                           |
| v0.5.1-4   | **Per-frame delay editor** | Click a frame thumbnail → set delay (ms)                                            |
| v0.5.1-5   | **Batch apply settings**   | "Apply to all frames" button propagates current effect settings across all frames   |

### v0.5.2 Motion Export

| #     | Chunk                  | What ships                                                                |
| ----- | ---------------------- | ------------------------------------------------------------------------- |
| v0.5.2-1   | **GIF export**         | Capture N frames from the animation loop → encode via `gif.js` → download |
| v0.5.2-2   | **WebM export**        | Use `MediaRecorder` on the canvas stream → download `.webm`               |
| v0.5.2-3   | **MP4 export**         | `CCapture.js` to capture frames → mux to MP4                              |
| v0.5.2-4   | **Export progress UI** | Progress bar / frame counter during encoding                              |

---

## Phase 3 (v0.6.x) — Workflow, Integrations & Reach

### v0.6.0 Vector Export

| #     | Chunk                        | What ships                                                                          |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------- |
| v0.6.0-1   | **SVG pixel grid generator** | Convert processed canvas pixel data → `<rect>` elements per dark pixel → SVG string |
| v0.6.0-2   | **SVG download**             | Write SVG string to Blob → trigger download as `.svg`                               |
| v0.6.0-3   | **SVG copy to clipboard**    | Write SVG string to clipboard as `image/svg+xml`                                    |

### v0.6.1 Shareable Links

| #     | Chunk                     | What ships                                                       |
| ----- | ------------------------- | ---------------------------------------------------------------- |
| v0.6.1-1   | **Settings serialiser**   | Encode layer effect params into a compact URL query string       |
| v0.6.1-2   | **Settings deserialiser** | On load, read URL params → hydrate layer state                   |
| v0.6.1-3   | **Share button UI**       | Button in top bar → writes URL to clipboard with a success toast |

### v0.6.2 Figma / Framer / Affinity Integration

| #     | Chunk                                 | What ships                                                              |
| ----- | ------------------------------------- | ----------------------------------------------------------------------- |
| v0.6.2-1   | **Raster clipboard copy (Phase 3a)**  | Copy processed PNG to clipboard as `image/png` (already partially done) |
| v0.6.2-2   | **HTML clipboard payload (Phase 3b)** | Construct `<img>` HTML clipboard item for Figma paste                   |
| v0.6.2-3   | **Vector clipboard payload research** | Investigate SVG clipboard format accepted by Figma/Affinity             |

### v0.6.3 Contextual Menus (Right-Click)

| #     | Chunk                      | What ships                                                                  |
| ----- | -------------------------- | --------------------------------------------------------------------------- |
| v0.6.3-1   | **Context menu component** | Floating menu rendered at pointer position; Escape/click-outside to dismiss |
| v0.6.3-2   | **Layer actions**          | Duplicate layer, delete layer, rename                                       |
| v0.6.3-3   | **Effect quick-apply**     | One-click apply presets from context menu                                   |
| v0.6.3-4   | **Quick export**           | Export selected layer PNG from context menu                                 |

### v0.6.4 Grouping ("Frames")

| #     | Chunk                      | What ships                                                               |
| ----- | -------------------------- | ------------------------------------------------------------------------ |
| v0.6.4-1   | **Group data model**       | `group` field on layers; layers sharing a group id move/rotate together  |
| v0.6.4-2   | **Group physics body**     | Combine Matter.js bodies into a compound body                            |
| v0.6.4-3   | **Group/ungroup UI**       | Select multiple layers → "Group" button; Ungroup to release              |
| v0.6.4-4   | **Shared effect boundary** | Render group layers to a shared off-screen canvas; apply one dither pass |

---

## Phase 4 (v0.7.x) — UX Polish & Persistence

| #     | Chunk                          | What ships                                                                    |
| ----- | ------------------------------ | ----------------------------------------------------------------------------- |
| v0.7.0-1   | **IndexedDB layer serialiser** | Serialise `layers[]` state (excluding blob URLs) to IndexedDB on every change |
| v0.7.0-2   | **Blob persistence**           | Store blob image data in IndexedDB alongside layer metadata                   |
| v0.7.0-3   | **Restore on load**            | On app mount, hydrate layers from IndexedDB before first render               |
| v0.7.0-4   | **Clear session button**       | "New canvas" action that wipes IndexedDB and resets state                     |
| v0.7.1-1   | **Sound system setup**         | Install `howler.js`; define sound map for each trigger event                  |
| v0.7.1-2   | **Import sound**               | Plays on first image import                                                   |
| v0.7.1-3   | **Drop sound**                 | Plays when a physics element lands on canvas                                  |
| v0.7.1-4   | **Effect toggle sound**        | Plays when an effect is armed or removed                                      |
| v0.7.1-5   | **Export sound**               | Plays on successful download                                                  |
| v0.7.2-1   | **FTUE detection**             | Check `localStorage` flag; show onboarding only on first visit                |
| v0.7.2-2   | **Onboarding animation**       | Animated canvas showing physics drop + dither effect applying                 |
| v0.7.2-3   | **Dismiss + don't show again** | "Got it" button sets the visited flag                                         |

---

## Phase 5 (v1.0.x) — Cloud & Community

| #     | Chunk                        | What ships                                                                         |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------- |
| v1.0.0-1   | **Auth setup**               | Supabase project + Google/GitHub OAuth                                             |
| v1.0.0-2   | **User account UI**          | Avatar, login/logout button in top bar                                             |
| v1.0.0-3   | **Cloud workspace save**     | On save, serialise canvas state → POST to Supabase `workspaces` table              |
| v1.0.0-4   | **Cloud workspace load**     | Fetch user's workspaces; list in a "Open" modal                                    |
| v1.0.0-5   | **Server-side video render** | Edge function receives frame data → encodes MP4 server-side → returns download URL |
| v1.0.0-6   | **Freemium gate**            | Feature flags per user tier; show upgrade nudge for premium features               |

---
