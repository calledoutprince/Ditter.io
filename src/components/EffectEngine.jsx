/**
 * @fileoverview Off-screen dithering pipeline for Ditter.io.
 *
 * `EffectEngine` is a **headless** React component — it renders a hidden
 * `<canvas>` element, processes an image through the selected dithering
 * algorithm, and notifies the parent via a callback with the resulting
 * data URL.  It never displays anything to the user directly.
 *
 * Exported pixel-manipulation functions are also tested individually in
 * `EffectEngine.test.js`.
 *
 * @module EffectEngine
 */

import React, { useEffect, useRef } from 'react';

// ─── Pixel Algorithms (exported for unit testing) ────────────────────────────

/**
 * Applies Atkinson dithering in-place to a raw `ImageData` object.
 *
 * Atkinson is a 1-bit error-diffusion algorithm originally developed by Bill
 * Atkinson for the original Macintosh.  It diffuses only 6/8 of the
 * quantisation error (rather than the full amount used by Floyd–Steinberg),
 * which tends to preserve highlight and shadow detail better on printed or
 * pixelated output.
 *
 * **Kernel** (error distributed equally to each marked cell):
 * ```
 *       X   X+1  X+2
 * Y        [cur] [ ⅛] [ ⅛]
 * Y+1  [⅛] [ ⅛]  [⅛]
 * Y+2        [⅛]
 * ```
 *
 * The function first converts the image to greyscale using the standard ITU-R
 * BT.601 luminance coefficients, then performs the error-diffusion pass.
 *
 * @param {ImageData} imageData - A mutable `ImageData` instance obtained from
 *   `CanvasRenderingContext2D.getImageData()`.  Modified in-place.
 * @param {number} threshold    - The greyscale luminance threshold (0–255)
 *   below which a pixel is quantised to black.  Derived from the user's
 *   contrast setting: `threshold = 128 / contrast`.
 * @returns {ImageData} The same `imageData` reference, mutated in-place.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const applyAtkinsonDither = (imageData, threshold) => {
    const data = imageData.data;
    const width = imageData.width;
    
    // Convert to grayscale first
    for (let i = 0; i < data.length; i += 4) {
        // Luminance
        const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = luma;
    }

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const oldPixel = data[idx];
            
            // Apply contrast threshold
            const newPixel = oldPixel < threshold ? 0 : 255;
            
            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
            
            const quantError = oldPixel - newPixel;
            
            // Distribute error (Atkinson kernel)
            // 1/8 to neighbors
            const errorFraction = quantError / 8;
            
            // X+1, Y
            if (x + 1 < width) data[idx + 4] += errorFraction;
            // X+2, Y
            if (x + 2 < width) data[idx + 8] += errorFraction;
            // X-1, Y+1
            if (x - 1 >= 0 && y + 1 < imageData.height) data[idx - 4 + width * 4] += errorFraction;
            // X, Y+1
            if (y + 1 < imageData.height) data[idx + width * 4] += errorFraction;
            // X+1, Y+1
            if (x + 1 < width && y + 1 < imageData.height) data[idx + 4 + width * 4] += errorFraction;
            // X, Y+2
            if (y + 2 < imageData.height) data[idx + width * 8] += errorFraction;
            
            // Ensure bounds
            for(let j=0; j<3; j++) data[idx+j] = Math.max(0, Math.min(255, data[idx+j]));
        }
    }
    return imageData;
};

/**
 * Re-colours the dithered pixel data in-place using the user's accent colour.
 *
 * After dithering, every pixel is either pure black (`< 128` luminance) or
 * pure white.  This function maps:
 * - **Black pixels** → the user's accent colour (fully opaque).
 * - **White pixels** → fully transparent, so the page / canvas background
 *   shows through without a white box around the asset.
 *
 * @param {ImageData} imageData   - A mutable `ImageData` instance that has
 *   already been processed by a dithering function.  Modified in-place.
 * @param {string}   accentColor  - The fill colour as a CSS hex string
 *   (e.g. `"#0000ff"`).
 * @returns {ImageData} The same `imageData` reference, mutated in-place.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const applyColorMap = (imageData, accentColor) => {
    const data = imageData.data;
    
    // Parse hex
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r:0,g:0,b:0};
    };

    const fg = hexToRgb(accentColor);

    for (let i = 0; i < data.length; i += 4) {
        // If pixel is black (dithered), make it accent
        if (data[i] < 128) {
            data[i]   = fg.r;
            data[i+1] = fg.g;
            data[i+2] = fg.b;
            data[i+3] = 255; // Opaque
        } else {
             // Make white pixels transparent (so page bg shows through)
             data[i+3] = 0;
        }
    }
    return imageData;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Headless image-processing component that runs the dithering pipeline on
 * every input change and reports the result upward.
 *
 * **Rendering:** The component returns a hidden `<canvas>` element.  It is
 * never visible; it only exists so we have a 2D drawing context to work with.
 *
 * **Pipeline (per effect change):**
 * 1. Load `src` into an `<img>` element.
 * 2. Scale the image down by `pixelScale` (creates the chunky pixel look).
 * 3. Derive a luminance threshold from `contrast`.
 * 4. Run the selected dithering pass (`applyAtkinsonDither` for all three
 *    modes currently; halftone and ASCII are placeholder stubs).
 * 5. Remap black pixels to `accentColor` and white pixels to transparent
 *    via `applyColorMap`.
 * 6. Export the canvas as a PNG data URL and call `onProcessed`.
 *
 * @param {Object}   props
 * @param {string}   props.src          - Object URL or data URL of the source
 *   image to process.
 * @param {'atkinson'|'halftone'|'ascii'} props.effectType
 *   - Which dithering algorithm to apply.
 * @param {number}   props.pixelScale   - Downscale factor (1–20).  Higher
 *   values produce larger, more obvious pixels.
 * @param {number}   props.contrast     - Contrast multiplier (0.1–3.0).
 *   Applied as: `threshold = 128 / contrast`.
 * @param {string}   props.accentColor  - Foreground fill colour as a CSS hex
 *   string (e.g. `"#0000ff"`).
 * @param {function(string): void} props.onProcessed
 *   - Called with the final `data:image/png;base64,…` string after each
 *     processing pass completes.
 * @returns {React.ReactElement} A hidden `<canvas>` element used internally
 *   for pixel manipulation.
 */
const EffectEngine = ({ src, effectType, pixelScale, contrast, accentColor, onProcessed }) => {
    const canvasRef = useRef(null);
    const onProcessedRef = useRef(onProcessed);

    // Keep the ref up-to-date without triggering the effect
    useEffect(() => {
        onProcessedRef.current = onProcessed;
    }, [onProcessed]);

    useEffect(() => {
        if (!src) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d', { willReadFrequently: true });
             
             // Scale down for pixelation
             const scaledWidth = Math.floor(img.width / pixelScale);
             const scaledHeight = Math.floor(img.height / pixelScale);
             
             if (scaledWidth < 1 || scaledHeight < 1) return;

             canvas.width = scaledWidth;
             canvas.height = scaledHeight;

             // Draw image
             ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
             
             let imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

             // Apply Contrast (very roughly via thresholding shift)
             const threshold = 128 * (1 / contrast);

             if (effectType === 'atkinson') {
                 applyAtkinsonDither(imageData, threshold);
             } else if (effectType === 'halftone') {
                 // Simplistic halftone placeholder logic
                 applyAtkinsonDither(imageData, threshold); 
             } else if (effectType === 'ascii') {
                 // ASCII placeholder: heavy dither
                 applyAtkinsonDither(imageData, threshold);
             }

             applyColorMap(imageData, accentColor);
             ctx.putImageData(imageData, 0, 0);

             // Export the final processed URL to the parent
             const dataUrl = canvas.toDataURL('image/png');
             if (onProcessedRef.current) onProcessedRef.current(dataUrl);

        };
        img.src = src;
    }, [src, effectType, pixelScale, contrast, accentColor]);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100%', 
                height: 'auto',
                imageRendering: 'pixelated', // Keep it sharp
                display: 'none' // We only use this for processing
            }} 
        />
    );
};

export default EffectEngine;
