/**
 * @fileoverview SVG vectorisation utilities for Ditter.io.
 *
 * Wraps the Potrace bitmap-to-vector library to convert dithered PNG data
 * URLs (produced by {@link module:EffectEngine}) into clean, exportable SVG
 * compound paths.  Also exposes a DOM-level helper for triggering browser
 * file downloads.
 *
 * @module vectorizer
 */

import Potrace from 'potrace';

/**
 * Converts a base64 DataURL (from the Dither Engine) into an optimised SVG
 * compound path via Potrace.
 *
 * Potrace is configured for strict 1-bit tracing — curves are disabled and
 * small feature suppression (`turdSize`) is set to zero so that every dither
 * dot survives the trace.  All discrete path segments are merged into a
 * single compound `<path>` element to minimise DOM node count and prevent
 * rendering lag in Framer / Figma.
 *
 * @param {string} dataUrl   - A `data:image/png;base64,…` string produced by
 *   `HTMLCanvasElement.toDataURL()`.
 * @param {string} [hexColor='#000000'] - SVG fill colour as a CSS hex string.
 * @returns {Promise<{ svgString: string, pathData: string, width: number, height: number }>}
 *   Resolves with:
 *   - `svgString`  — A complete, self-contained `<svg>` element string.
 *   - `pathData`   — The raw `d` attribute value of the compound path
 *     (needed by the Figma / Framer integrations).
 *   - `width`      — Intrinsic image width in pixels (for `viewBox`).
 *   - `height`     — Intrinsic image height in pixels (for `viewBox`).
 * @throws {Error} Rejects if Potrace cannot load or trace the image.
 */
export const vectorizeToSVG = (dataUrl, hexColor = '#000000') => {
    return new Promise((resolve, reject) => {
        const trace = new Potrace.Potrace();
        
        // Settings to ensure strict 1-bit tracing without smoothing away our pixelated brutalism
        trace.setParameters({
            turnPolicy: Potrace.Potrace.TURNPOLICY_MINORITY,
            turdSize: 0, // don't suppress small dots (vital for dithering!)
            optCurve: false,
            alphamax: 1,
            resolution: 1 // Keep 1:1 pixel scale
        });

        // Potrace requires a Buffer or a URL. For browser, we need to convert DataURL to an Image object 
        //, but potrace-js in the browser often accepts an Image object or canvas directly depending on the build.
        // Assuming the standard browser port accepts an Image element:
        const img = new Image();
        img.onload = () => {
            trace.loadImage(img, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Merge all paths into one compound path to prevent DOM/Framer lag
                const paths = trace.getPaths();
                const combinedD = paths.map(p => p.d).join(' ');
                
                // Get original dimensions to set viewBox
                // Potrace scales up by a factor of 100 by default in its path generator, so we need to account for it
                // Or we can just use the path as-is if we scale it later.
                
                const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}">
                    <path d="${combinedD}" fill="${hexColor}" fill-rule="evenodd" />
                </svg>`;

                resolve({
                    svgString,
                    pathData: combinedD,
                    width: img.width,
                    height: img.height
                });
            });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
};

/**
 * Triggers a browser file download for an SVG string.
 *
 * Creates a temporary `<a>` element with an object URL, programmatically
 * clicks it, then immediately cleans up the element and revokes the URL to
 * avoid memory leaks.
 *
 * @param {string} svgString           - A complete SVG document or fragment
 *   as a string (e.g. from {@link vectorizeToSVG}).
 * @param {string} [filename='dither-export.svg'] - The suggested filename for
 *   the downloaded file.
 * @returns {void}
 */
export const downloadSVG = (svgString, filename = 'dither-export.svg') => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
