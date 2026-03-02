import React, { useEffect, useRef } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const applyAtkinsonDither = (imageData, threshold, isTriColor = true) => {
    const data = imageData.data;
    const width = imageData.width;

    for (let i = 0; i < data.length; i += 4) {
        const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = luma;
    }

    for (let y = 0; y < imageData.height; y++) {
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
            if (x - 1 >= 0 && y + 1 < imageData.height) data[idx - 4 + width * 4] += errorFraction;
            if (y + 1 < imageData.height) data[idx + width * 4] += errorFraction;
            if (x + 1 < width && y + 1 < imageData.height) data[idx + 4 + width * 4] += errorFraction;
            if (y + 2 < imageData.height) data[idx + width * 8] += errorFraction;

            for (let j = 0; j < 3; j++) data[idx + j] = Math.max(0, Math.min(255, data[idx + j]));
        }
    }
    return imageData;
};

// eslint-disable-next-line react-refresh/only-export-components
export const applyColorMap = (imageData, colors) => {
    const data = imageData.data;
    const { shadow = '#000000', midtone, highlight = '#ffffff' } = colors || {};
    const isTriColor = midtone !== undefined && midtone !== null && midtone !== '';

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };

    const sRgb = hexToRgb(shadow);
    const mRgb = isTriColor ? hexToRgb(midtone) : null;
    const hRgb = hexToRgb(highlight);

    for (let i = 0; i < data.length; i += 4) {
        if (isTriColor) {
            if (data[i] < 64) {
                // Shadow
                data[i] = sRgb.r; data[i + 1] = sRgb.g; data[i + 2] = sRgb.b; data[i + 3] = 255;
            } else if (data[i] < 192) {
                // Midtone
                data[i] = mRgb.r; data[i + 1] = mRgb.g; data[i + 2] = mRgb.b; data[i + 3] = 255;
            } else {
                // Highlight
                if (highlight === 'transparent') {
                    data[i + 3] = 0;
                } else {
                    data[i] = hRgb.r; data[i + 1] = hRgb.g; data[i + 2] = hRgb.b; data[i + 3] = 255;
                }
            }
        } else {
            // 2-Color mode
            if (data[i] < 128) {
                data[i] = sRgb.r; data[i + 1] = sRgb.g; data[i + 2] = sRgb.b; data[i + 3] = 255;
            } else {
                if (highlight === 'transparent') {
                    data[i + 3] = 0;
                } else {
                    data[i] = hRgb.r; data[i + 1] = hRgb.g; data[i + 2] = hRgb.b; data[i + 3] = 255;
                }
            }
        }
    }
    return imageData;
};

// eslint-disable-next-line react-refresh/only-export-components
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

            // clamp
            newPixel = Math.max(0, Math.min(255, newPixel));
            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
        }
    }
    return imageData;
};

// eslint-disable-next-line react-refresh/only-export-components
export const applyAsciiDither = (imageData, ctx, sw, sh, ow, oh, contrast, colors) => {
    const data = imageData.data;
    const chars = ['@', '%', '#', '*', '+', '=', '-', ':', '.', ' '].reverse();
    const { shadow = '#000000', midtone, highlight = '#ffffff' } = colors || {};
    const isTriColor = midtone !== undefined && midtone !== null && midtone !== '';

    ctx.clearRect(0, 0, ow, oh);

    if (highlight !== 'transparent') {
        ctx.fillStyle = highlight;
        ctx.fillRect(0, 0, ow, oh);
    }

    const charW = ow / sw;
    const charH = oh / sh;

    ctx.font = `bold ${Math.round(charH * 1.2)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
            const adjustedLuma = (luma - 128) * contrast + 128;

            let val = Math.max(0, Math.min(255, adjustedLuma));

            const charIdx = Math.floor((1 - (val / 255)) * (chars.length - 1));
            const char = chars[charIdx];

            if (char !== ' ') {
                const charColor = isTriColor
                    ? (val < 85 ? shadow : val < 170 ? midtone : highlight)
                    : (val < 128 ? shadow : highlight);

                if (charColor !== 'transparent') {
                    ctx.fillStyle = charColor;
                    ctx.fillText(char, x * charW + charW / 2, y * charH + charH / 2);
                }
            }
        }
    }
};

const EffectEngine = ({ src, effectType, pixelScale, contrast, accentColor, colors, onProcessed }) => {
    const canvasRef = useRef(null);
    const onProcessedRef = useRef(onProcessed);

    // Backwards compatibility during migration
    const activeColors = colors || { shadow: accentColor, midtone: '#888888', highlight: 'transparent' };
    const isTriColor = activeColors.midtone !== undefined && activeColors.midtone !== null && activeColors.midtone !== '';

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

            const scaledWidth = Math.floor(img.width / pixelScale);
            const scaledHeight = Math.floor(img.height / pixelScale);

            if (scaledWidth < 1 || scaledHeight < 1) return;

            const isAscii = effectType === 'ascii';
            const charScale = 8;
            const outWidth = isAscii ? scaledWidth * charScale : scaledWidth;
            const outHeight = isAscii ? scaledHeight * charScale : scaledHeight;

            canvas.width = outWidth;
            canvas.height = outHeight;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;
            const tctx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            let imageData = tctx.getImageData(0, 0, scaledWidth, scaledHeight);

            const threshold = 128 * (1 / contrast);

            if (effectType === 'atkinson') {
                applyAtkinsonDither(imageData, threshold, isTriColor);
                applyColorMap(imageData, activeColors);
                ctx.putImageData(imageData, 0, 0);
            } else if (effectType === 'halftone') {
                applyHalftoneDither(imageData, contrast, isTriColor);
                applyColorMap(imageData, activeColors);
                ctx.putImageData(imageData, 0, 0);
            } else if (effectType === 'ascii') {
                applyAsciiDither(imageData, ctx, scaledWidth, scaledHeight, outWidth, outHeight, contrast, activeColors);
            }

            const dataUrl = canvas.toDataURL('image/png');
            if (onProcessedRef.current) onProcessedRef.current(dataUrl);

        };
        img.src = src;
    }, [src, effectType, pixelScale, contrast, activeColors]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: '100%',
                height: 'auto',
                imageRendering: 'pixelated',
                display: 'none'
            }}
        />
    );
};

export default EffectEngine;
