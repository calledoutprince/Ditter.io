import Potrace from 'potrace';

export const vectorizeToSVG = (dataUrl, hexColor = '#000000') => {
    return new Promise((resolve, reject) => {
        const trace = new Potrace.Potrace();
        
        trace.setParameters({
            turnPolicy: Potrace.Potrace.TURNPOLICY_MINORITY,
            turdSize: 0,
            optCurve: false,
            alphamax: 1,
            resolution: 1
        });

        const img = new Image();
        img.onload = () => {
            trace.loadImage(img, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const paths = trace.getPaths();
                const combinedD = paths.map(p => p.d).join(' ');
                
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
