import React, { useEffect, useRef, useState } from 'react';

// Atkinson Dithering matrix processing
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

// Replace black and white with Brand HEX colors
export const applyColorMap = (imageData, accentColor, bgColor) => {
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
    const bg = hexToRgb(bgColor);

    for (let i = 0; i < data.length; i += 4) {
        // If pixel is black (dithered), make it accent
        if (data[i] < 128) {
            data[i] = fg.r;
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

const EffectEngine = ({ src, effectType, pixelScale, contrast, accentColor, bgColor, onProcessed }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    useEffect(() => {
        if (!src) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
             const canvas = canvasRef.current;
             const ctx = canvas.getContext('2d', { willReadFrequently: true });
             
             // Scale down for pixelation
             const scaledWidth = Math.floor(img.width / pixelScale);
             const scaledHeight = Math.floor(img.height / pixelScale);
             
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
                 // For true halftone, we'd draw overlapping circles. For simplicity, just high-contrast threshold
                 applyAtkinsonDither(imageData, threshold); 
             } else if (effectType === 'ascii') {
                 // ASCII logic will require rendering text back to canvas, complex!
                 // Simplified placeholder: heavy dither
                 applyAtkinsonDither(imageData, threshold);
             }

             applyColorMap(imageData, accentColor, bgColor);
             ctx.putImageData(imageData, 0, 0);

             // Export the final processed URL to the parent for the active physics element
             const dataUrl = canvas.toDataURL('image/png');
             if (onProcessed) onProcessed(dataUrl);

        };
        img.src = src;
    }, [src, effectType, pixelScale, contrast, accentColor, bgColor, onProcessed]);

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
