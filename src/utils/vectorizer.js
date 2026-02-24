import Potrace from 'potrace';

/**
 * Converts a base64 DataURL (from our Dither Engine) into an optimized SVG Compound Path
 * @param {string} dataUrl - The base64 PNG image from the canvas
 * @param {string} hexColor - The color to fill the SVG with
 * @returns {Promise<string>} - Resolves with the optimized SVG string
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
 * Generates an invisible download link and clicks it
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
