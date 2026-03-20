# Ditter.io — Algorithms & Tools Reference

_Compiled from competitive analysis of @textrnr, @imrobertmine, @kvncnls and the 2026 Grok deep-research report._

---

## Processing Pipeline Overview

Every image flows through three sequential stages. Each stage has its own set of controls.

```
[ Source Image ]
        ↓
┌──────────────────┐
│  1. Pre-Process   │  ← Blur, Sharpen, Brightness, Contrast, Gamma, Levels
└──────────────────┘
        ↓
┌──────────────────┐
│  2. Dither Core  │  ← Algorithm, Pixel Scale, Threshold, Bit Depth, Color Space, Serpentine
└──────────────────┘
        ↓
┌──────────────────┐
│  3. Post-Process │  ← Noise, Diffusion Bias, Intensity, Color Mapping, Grain Overlay
└──────────────────┘
        ↓
[ Output Canvas / Export ]
```

---

## Stage 1 — Pre-Processing

Applied to the raw image _before_ any dithering. Matches what @textrnr ships in v2.0.3.

| Slider          | Range       | Purpose                                                 |
| --------------- | ----------- | ------------------------------------------------------- |
| Pre-Brightness  | -100 → +100 | Lift or crush overall exposure                          |
| Pre-Contrast    | -100 → +100 | Spread or compress tonal range                          |
| Pre-Sharpness   | 0 → 100%    | Unsharp-mask pass; brings out edges before diffusion    |
| Pre-Blur        | 0 → 20px    | Gaussian blur; smooths gradients so dither bands soften |
| Gamma           | 0.2 → 4.0   | Non-linear tone correction before threshold             |
| Levels (In/Out) | 0–255       | Remap input/output white & black points                 |

**Implementation notes:**

- All applied using a second off-screen `<canvas>` before the main dither pass.
- Pre-Blur → `ctx.filter = 'blur(Xpx)'` applied before `drawImage`.
- Pre-Contrast / Brightness → pixel-level loop or CSS `filter: contrast() brightness()`.

---

## Stage 2 — Dithering Core

### Error Diffusion Algorithms

Error diffusion algorithms "spread" the quantisation error to neighboring pixels. Produces organic, photographic-looking results.

| Algorithm               | Kernel spread | Character                         | Status         |
| ----------------------- | ------------- | --------------------------------- | -------------- |
| **Atkinson**            | 6 neighbors   | High-contrast, "crunchy" Mac vibe | ✅ Implemented |
| **Floyd-Steinberg**     | 4 neighbors   | Classic, widely-used standard     | ❌ To add      |
| **Jarvis-Judice-Ninke** | 12 neighbors  | Smooth gradients, high fidelity   | ❌ To add      |
| **Stucki**              | 12 neighbors  | JJN variant, sharper edges        | ❌ To add      |
| **Burkes**              | 7 neighbors   | Lighter JJN, faster performance   | ❌ To add      |
| **Sierra (Full)**       | 10 neighbors  | Balanced, smooth                  | ❌ To add      |
| **Sierra Two-Row**      | 6 neighbors   | Lighter Sierra, clean             | ❌ To add      |
| **Sierra Lite**         | 2 neighbors   | Fastest Sierra, noisier           | ❌ To add      |

**Serpentine (Bi-Directional) Scan:**  
A toggle that reverses diffusion direction on every alternate row. Eliminates directional bias artifacts. One `direction` flag in the inner loop.

---

### Ordered / Threshold Dithering

Ordered dithering uses a fixed threshold matrix — no error spreading. Produces structured, repeating patterns.

| Algorithm          | Matrix          | Character                         | Status                    |
| ------------------ | --------------- | --------------------------------- | ------------------------- |
| **Bayer 2×2**      | 2×2             | Very coarse crosshatch            | ❌ To add                 |
| **Bayer 4×4**      | 4×4             | Classic ordered dither            | ✅ Implemented (Halftone) |
| **Bayer 8×8**      | 8×8             | Fine halftone, smoother gradients | ❌ To add                 |
| **Bayer 16×16**    | 16×16           | Near-continuous tones             | ❌ To add                 |
| **Checkerboard**   | 2×2 alternating | Sharp, grid-like pixels           | ❌ To add                 |
| **Clustered Dot**  | 4×4             | Newspaper print halftone          | ❌ To add                 |
| **Void & Cluster** | Stochastic      | No visible patterns, noise-like   | ❌ (advanced)             |

---

### Core Controls (apply to all algorithms)

| Control                    | Range                     | Purpose                                                                 |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| **Pixel Scale**            | 1–20                      | Downscale factor before dithering → chunk size                          |
| **Threshold**              | 0–255                     | Luminance cutoff for black/white decision                               |
| **Bit Depth**              | 1–8 bit                   | Number of output levels (1-bit = B&W, 2-bit = 4 shades, etc.)           |
| **Color Space**            | Luma / RGB / HSL / CIELAB | What "luminance" model is used for thresholding                         |
| **Error Diffusion Spread** | 0–100%                    | Scales error kernel amount — 0% = threshold-only, 100% = full diffusion |

---

### Specialty Modes

| Mode               | Description                                             | Status                 |
| ------------------ | ------------------------------------------------------- | ---------------------- |
| **ASCII**          | Map luminance zones to characters (`@ % # * + = - : .`) | ✅ Implemented (basic) |
| **ASCII (Custom)** | User-editable character ramp for custom look            | ❌ To add              |
| **Braille Dots**   | Use Unicode Braille block characters as "pixels"        | ❌ To add              |
| **Emoji Fill**     | Map tones to a custom emoji ramp                        | ❌ (experimental)      |

---

## Stage 3 — Post-Processing

Applied _after_ the dither pass, before export.

| Control            | Range       | Purpose                                             |
| ------------------ | ----------- | --------------------------------------------------- |
| **Noise Amount**   | 0–100%      | Adds post-dither film grain / random noise          |
| **Diffusion Bias** | -1.0 → +1.0 | Biases quantisation toward lighter or darker output |
| **Intensity**      | 0–100%      | Blends dithered result with original image          |
| **Grain Overlay**  | 0–100%      | Overlays a separate procedural grain texture        |

---

## Color Mapping

| Feature                               | Description                                    | Status             |
| ------------------------------------- | ---------------------------------------------- | ------------------ |
| **Accent Color**                      | Maps dark pixels to a single foreground color  | ✅ Implemented     |
| **2-Color Duotone**                   | Map darks/lights to two separate hues          | ✅ Groundwork laid |
| **3-Color** (Shadows/Mids/Highlights) | Map three luminance zones to three colors      | ❌ To add          |
| **Palette Import (hex/Lospec)**       | Paste hex codes or import from Lospec URL      | ❌ To add          |
| **Palette Extraction**                | Auto-extract dominant colors from source image | ❌ To add          |

### Preset Palettes

| Palette            | Colors | Status     |
| ------------------ | ------ | ---------- |
| Monochrome (B&W)   | 2      | ✅ Default |
| Original Mac 1-Bit | 2      | ❌         |
| Game Boy           | 4      | ❌         |
| PICO-8             | 16     | ❌         |
| Commodore 64       | 16     | ❌         |
| CGA                | 4/16   | ❌         |
| EGA                | 64     | ❌         |
| Vaporwave Neon     | 5      | ❌         |
| Ink & Paper        | 2      | ❌         |

---

## Export Targets

| Format              | Library/Method                          | Status          |
| ------------------- | --------------------------------------- | --------------- |
| PNG (1×/2×/4×)      | Canvas `toBlob`, anchor download        | ✅ Implemented  |
| Animated GIF        | `gif.js`                                | ❌ To add       |
| WebP Animated       | Native Canvas, `OffscreenCanvas`        | ❌ To add       |
| MP4 / WebM          | `CCapture.js` or `MediaRecorder`        | ❌ To add       |
| SVG (vector dither) | Generate `<rect>` or `<path>` per pixel | ❌ To add       |
| CSS code            | Emit `box-shadow` pixel art             | ❌ Experimental |
| React component     | Emit JSX pixel array                    | ❌ Experimental |
| Lottie JSON         | Frame animation export                  | ❌ Long-term    |

---

## Competitive Gap Summary

| Feature                 | @textrnr | @imrobertmine | @kvncnls | **Ditter.io**     |
| ----------------------- | -------- | ------------- | -------- | ----------------- |
| Pre-processing pipeline | ✅       | ❌            | ❌       | ❌ **→ Priority** |
| 8+ algorithms           | ✅       | ❌            | ❌       | ❌ **→ Priority** |
| Serpentine scan         | ✅       | ❌            | ❌       | ❌                |
| Bit Depth / Color Space | ✅       | ❌            | ❌       | ❌                |
| Physics engine          | ❌       | ❌            | ❌       | ✅ **Unique**     |
| Layer system            | ✅       | ❌            | ❌       | ✅                |
| Per-layer effects       | ❌       | ❌            | ❌       | ✅ **Unique**     |
| Animated frame input    | ❌       | ❌            | partial  | ❌ (roadmapped)   |
| SVG export              | ❌       | ❌            | ✅       | ❌ (roadmapped)   |
| Math/pattern presets    | ❌       | ❌            | ✅       | ❌                |

**Our moat:** Physics + per-layer effects is genuinely unique. No competitor has it.  
**The gap to close first:** Pre-processing pipeline + more algorithms = professional-grade results without leaving the physics/layers UX.
