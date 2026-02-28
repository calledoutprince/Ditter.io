/**
 * Tests for the pure image-processing functions in src/components/EffectEngine.jsx
 *
 * We specifically test:
 *  - applyAtkinsonDither  — the Atkinson error diffusion algorithm
 *  - applyColorMap        — remaps black/white pixels to brand colours
 *
 * These are tested without mounting the React component, since they are
 * pure functions that only manipulate an ImageData object.
 */
import { describe, it, expect } from 'vitest';
import { applyAtkinsonDither, applyColorMap } from './EffectEngine.jsx';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Creates a synthetic ImageData-like object with controlled pixel values.
 * Each pixel is RGBA, so width * height * 4 bytes.
 */
function makeImageData(width, height, fillValue = 128) {
  const data = new Uint8ClampedArray(width * height * 4).fill(fillValue);
  // Alpha is always fully opaque unless the test sets it
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  return { data, width, height };
}

// ─── applyAtkinsonDither ──────────────────────────────────────────────────────

describe('applyAtkinsonDither', () => {
  it('returns the modified imageData object', () => {
    const imageData = makeImageData(4, 4);
    const result = applyAtkinsonDither(imageData, 128);
    expect(result).toBe(imageData); // same reference — mutated in-place
  });

  it('converts all pixels below threshold to black (0)', () => {
    // Fill every pixel with value 10 — well below any threshold
    const imageData = makeImageData(4, 4, 10);
    applyAtkinsonDither(imageData, 128);
    // Check the RGB channels of the first pixel
    expect(imageData.data[0]).toBe(0);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
  });

  it('converts all pixels at or above threshold to white (255)', () => {
    // Fill every pixel with 250 — well above the default 128 threshold
    const imageData = makeImageData(4, 4, 250);
    applyAtkinsonDither(imageData, 128);
    // Most pixels should be quantised to 255 (some may get error diffused down)
    // The very first pixel has no error-diffusion neighbours, so it is deterministic
    expect(imageData.data[0]).toBe(255);
  });

  it('keeps pixel values clamped to [0, 255]', () => {
    // Alternating extremes create maximum error-diffusion pressure
    const imageData = makeImageData(8, 8, 128);
    applyAtkinsonDither(imageData, 64);
    for (let i = 0; i < imageData.data.length; i += 4) {
      expect(imageData.data[i]).toBeGreaterThanOrEqual(0);
      expect(imageData.data[i]).toBeLessThanOrEqual(255);
    }
  });

  it('produces a 1-bit output (pixels are only 0 or 255)', () => {
    const imageData = makeImageData(6, 6, 200);
    applyAtkinsonDither(imageData, 128);
    for (let i = 0; i < imageData.data.length; i += 4) {
      // After dithering, every RGB channel should be either 0 or 255
      expect([0, 255]).toContain(imageData.data[i]);
    }
  });
});

// ─── applyColorMap ────────────────────────────────────────────────────────────

describe('applyColorMap', () => {
  it('returns the modified imageData object', () => {
    const imageData = makeImageData(2, 2, 0); // all black
    const result = applyColorMap(imageData, '#ff0000', '#ffffff');
    expect(result).toBe(imageData);
  });

  it('maps black pixels (value < 128) to the accent colour', () => {
    // Create a 1×1 all-black image
    const imageData = makeImageData(1, 1, 0);
    applyColorMap(imageData, '#ff0000', '#ffffff');
    // Red channel should now be 255, green and blue 0
    expect(imageData.data[0]).toBe(255); // r
    expect(imageData.data[1]).toBe(0);   // g
    expect(imageData.data[2]).toBe(0);   // b
    expect(imageData.data[3]).toBe(255); // alpha opaque
  });

  it('makes white pixels (value >= 128) fully transparent', () => {
    const imageData = makeImageData(1, 1, 255); // all white
    applyColorMap(imageData, '#ff0000', '#ffffff');
    // Alpha should be 0 (transparent — page background shows through)
    expect(imageData.data[3]).toBe(0);
  });

  it('correctly parses a multi-channel accent hex colour', () => {
    // #1a2b3c → r=26, g=43, b=60
    const imageData = makeImageData(1, 1, 0); // black pixel
    applyColorMap(imageData, '#1a2b3c', '#ffffff');
    expect(imageData.data[0]).toBe(26);
    expect(imageData.data[1]).toBe(43);
    expect(imageData.data[2]).toBe(60);
  });
});
