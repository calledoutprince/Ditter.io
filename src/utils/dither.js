export const hexToRgb = (hex) => {
    if (hex === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255
    } : { r: 0, g: 0, b: 0, a: 255 };
};

export const applyAtkinsonDither = (imageData, threshold, isTriColor = true) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // First pass: grayscale luma
    for (let i = 0; i < data.length; i += 4) {
        const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = luma;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const oldPixel = data[idx];

            let newPixel;
            if (isTriColor) {
                if (oldPixel < 85) newPixel = 0;
                else if (oldPixel < 170) newPixel = 128;
                else newPixel = 255;
            } else {
                newPixel = oldPixel < threshold ? 0 : 255;
            }

            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

            const quantError = oldPixel - newPixel;
            const errorFraction = quantError / 8;

            if (x + 1 < width) data[idx + 4] += errorFraction;
            if (x + 2 < width) data[idx + 8] += errorFraction;
            if (x - 1 >= 0 && y + 1 < height) data[idx - 4 + width * 4] += errorFraction;
            if (y + 1 < height) data[idx + width * 4] += errorFraction;
            if (x + 1 < width && y + 1 < height) data[idx + 4 + width * 4] += errorFraction;
            if (y + 2 < height) data[idx + width * 8] += errorFraction;

            for (let j = 0; j < 3; j++) data[idx + j] = Math.max(0, Math.min(255, data[idx + j]));
        }
    }
    return imageData;
};

export const applyHalftoneDither = (imageData, contrast, isTriColor = true) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const bayer = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

            const bayerVal = (bayer[y % 4][x % 4] / 16) * 255;
            const adjustedLuma = (luma - 128) * contrast + 128;

            let newPixel;
            if (isTriColor) {
                const clampedLuma = Math.max(0, Math.min(255, adjustedLuma));
                const v = clampedLuma / 255;
                const vInt = Math.floor(v * 2);
                const vFrac = v * 2 - vInt;

                if (vInt >= 2) {
                    newPixel = 255;
                } else {
                    newPixel = (vFrac * 255 > bayerVal) ? (vInt + 1) * 128 : vInt * 128;
                }
            } else {
                newPixel = adjustedLuma > bayerVal ? 255 : 0;
            }

            newPixel = Math.max(0, Math.min(255, newPixel));
            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
        }
    }
    return imageData;
};

export const applyColorMap = (imageData, colors) => {
    const data = imageData.data;
    const { shadow = '#000000', midtone, highlight = '#ffffff' } = colors || {};
    const isTriColor = midtone !== undefined && midtone !== null && midtone !== '';

    const sRgb = hexToRgb(shadow);
    const mRgb = isTriColor ? hexToRgb(midtone) : null;
    const hRgb = hexToRgb(highlight);

    for (let i = 0; i < data.length; i += 4) {
        if (isTriColor) {
            if (data[i] < 64) {
                data[i] = sRgb.r; data[i + 1] = sRgb.g; data[i + 2] = sRgb.b; data[i + 3] = sRgb.a;
            } else if (data[i] < 192) {
                data[i] = mRgb.r; data[i + 1] = mRgb.g; data[i + 2] = mRgb.b; data[i + 3] = mRgb.a;
            } else {
                if (highlight === 'transparent') {
                    data[i + 3] = 0;
                } else {
                    data[i] = hRgb.r; data[i + 1] = hRgb.g; data[i + 2] = hRgb.b; data[i + 3] = hRgb.a;
                }
            }
        } else {
            if (data[i] < 128) {
                data[i] = sRgb.r; data[i + 1] = sRgb.g; data[i + 2] = sRgb.b; data[i + 3] = sRgb.a;
            } else {
                if (highlight === 'transparent') {
                    data[i + 3] = 0;
                } else {
                    data[i] = hRgb.r; data[i + 1] = hRgb.g; data[i + 2] = hRgb.b; data[i + 3] = hRgb.a;
                }
            }
        }
    }
    return imageData;
};

export const generateSVG = (imageData, pixelScale, colors) => {
    const { width, height, data } = imageData;
    const { shadow, midtone, highlight } = colors;

    let svgContent = `<svg width="${width * pixelScale}" height="${height * pixelScale}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Optional background
    if (highlight && highlight !== 'transparent') {
        svgContent += `<rect width="${width}" height="${height}" fill="${highlight}" />`;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a === 0) continue;

            const color = `rgb(${r},${g},${b})`;
            // Only draw if not the background color
            if (color !== highlight) {
                svgContent += `<rect x="${x}" y="${y}" width="1.1" height="1.1" fill="${color}" />`;
            }
        }
    }

    svgContent += `</svg>`;
    return svgContent;
};
