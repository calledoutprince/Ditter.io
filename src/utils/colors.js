export const extractDominantColors = async (imageUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Scale down for faster processing
            const maxDim = 100;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            canvas.width = width || 1;
            canvas.height = height || 1;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let shadowSum = { r: 0, g: 0, b: 0, count: 0 };
            let midtoneSum = { r: 0, g: 0, b: 0, count: 0 };
            let highlightSum = { r: 0, g: 0, b: 0, count: 0 };
            
            for (let i = 0; i < data.length; i += 4) {
                // Ignore transparent pixels
                if (data[i+3] < 128) continue;
                
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const luma = r * 0.299 + g * 0.587 + b * 0.114;
                
                if (luma < 85) {
                    shadowSum.r += r; shadowSum.g += g; shadowSum.b += b; shadowSum.count++;
                } else if (luma < 170) {
                    midtoneSum.r += r; midtoneSum.g += g; midtoneSum.b += b; midtoneSum.count++;
                } else {
                    highlightSum.r += r; highlightSum.g += g; highlightSum.b += b; highlightSum.count++;
                }
            }
            
            const toHex = (c) => {
                let hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            };
            
            const getAverageHex = (sumData, fallbackHex) => {
                if (sumData.count === 0) return fallbackHex;
                const r = Math.round(sumData.r / sumData.count);
                const g = Math.round(sumData.g / sumData.count);
                const b = Math.round(sumData.b / sumData.count);
                return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            };
            
            resolve({
                shadow: getAverageHex(shadowSum, '#111111'),
                midtone: getAverageHex(midtoneSum, '#888888'),
                highlight: getAverageHex(highlightSum, '#eeeeee')
            });
        };
        img.onerror = () => {
            resolve({ shadow: '#000000', midtone: '#888888', highlight: '#ffffff' });
        };
        img.src = imageUrl;
    });
};
