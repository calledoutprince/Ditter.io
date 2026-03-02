import React, { useEffect, useRef } from 'react';
import {
    applyAtkinsonDither,
    applyHalftoneDither,
    applyAsciiDither,
    applyColorMap
} from '../utils/dither';

// Move the ASCII logic here for now as it needs the canvas context directly
export const applyAsciiEffect = (imageData, ctx, sw, sh, ow, oh, contrast, colors) => {
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
                applyAsciiEffect(imageData, ctx, scaledWidth, scaledHeight, outWidth, outHeight, contrast, activeColors);
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
