import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Copy, Sun, Type, Image as ImageIcon, Code } from 'lucide-react';
import { usePhysics } from './utils/usePhysics';
import PhysicsElement from './components/PhysicsElement';
import EffectEngine from './components/EffectEngine';
import { vectorizeToSVG, downloadSVG } from './utils/vectorizer';
import { constructFigmaPayload, copyHTMLToClipboard, constructFramerComponent } from './utils/integrations';
import './index.css';

function App() {
  const [effectType, setEffectType] = useState('atkinson'); // 'atkinson', 'halftone', 'ascii'
  const [pixelScale, setPixelScale] = useState(4);
  const [contrast, setContrast] = useState(1.2);
  const [accentColor, setAccentColor] = useState('#0000ff');
  const [bgColor, setBgColor] = useState('#e5e5e5');
  const [items, setItems] = useState([]); // Uploaded images or processed text
  const [originalImageUrl, setOriginalImageUrl] = useState(null); // Reference for source box
  const [activeProcessedUrl, setActiveProcessedUrl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef(null);
  const { engine } = usePhysics();

  // Dynamically update background color
  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    }
  };

  const handleProcessedImage = useCallback((dataUrl) => {
      setActiveProcessedUrl(dataUrl);

      // Add to physics world only once per upload
      setItems((prev) => {
          // Check if we already have an item for the current original image
          const exists = prev.find(p => p.sourceUrl === originalImageUrl);
          if (exists) {
              // Update existing item's texture (live preview)
              return prev.map(p => p.sourceUrl === originalImageUrl ? { ...p, processedUrl: dataUrl } : p);
          } else {
              // Add new item
              return [
                  ...prev,
                  {
                      id: Date.now(),
                      sourceUrl: originalImageUrl,
                      processedUrl: dataUrl,
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2
                  }
              ];
          }
      });
  }, [originalImageUrl]);

  const handleExportFigma = async () => {
      if (!activeProcessedUrl) return alert("Select an image first!");
      setIsExporting(true);
      try {
          const { pathData, width, height } = await vectorizeToSVG(activeProcessedUrl, accentColor);
          const figmaHtml = constructFigmaPayload(pathData, width, height, accentColor);
          await copyHTMLToClipboard(figmaHtml);
      } catch(err) {
          console.error(err);
      }
      setIsExporting(false);
  };

  const handleExportSVG = async () => {
      if (!activeProcessedUrl) return alert("Select an image first!");
      setIsExporting(true);
      try {
          const { svgString } = await vectorizeToSVG(activeProcessedUrl, accentColor);
          downloadSVG(svgString, `dither-gravity-${Date.now()}.svg`);
      } catch(err) {
          console.error(err);
      }
      setIsExporting(false);
  };

  const handleExportFramer = async () => {
        if (!activeProcessedUrl) return alert("Select an image first!");
        setIsExporting(true);
        try {
            const { pathData } = await vectorizeToSVG(activeProcessedUrl, accentColor);
            const framerCode = constructFramerComponent(pathData, accentColor);
            
            // For Framer, we copy the raw React component code so the user can paste it into a Code Component
            await navigator.clipboard.writeText(framerCode);
            alert("Framer React Component copied to clipboard!");
        } catch(err) {
            console.error(err);
        }
        setIsExporting(false);
  };

  return (
    <div className="app-container">
      {/* Invisible Effect Engine for processing */}
      {originalImageUrl && (
          <EffectEngine 
              src={originalImageUrl}
              effectType={effectType}
              pixelScale={pixelScale}
              contrast={contrast}
              accentColor={accentColor}
              bgColor={bgColor}
              onProcessed={handleProcessedImage}
          />
      )}

      {/* Sidebar Controls */}
      <aside className="sidebar">
        <header>
          <h1 className="brdy-typography" style={{ fontSize: '3rem' }}>Dither</h1>
          <h1 className="brdy-typography" style={{ fontSize: '3rem' }}>Gravity</h1>
        </header>

        <div className="control-group">
          <label>Effect Type</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`brutalist-button ${effectType === 'atkinson' ? 'primary' : ''}`}
              onClick={() => setEffectType('atkinson')}
            >
              <ImageIcon size={16} /> 1-Bit
            </button>
            <button 
              className={`brutalist-button ${effectType === 'halftone' ? 'primary' : ''}`}
              onClick={() => setEffectType('halftone')}
            >
              <Sun size={16} /> Halftone
            </button>
            <button 
              className={`brutalist-button ${effectType === 'ascii' ? 'primary' : ''}`}
              onClick={() => setEffectType('ascii')}
            >
              <Type size={16} /> ASCII
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Pixel Scale</label>
          <div className="flex-row">
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={pixelScale} 
              onChange={(e) => setPixelScale(parseInt(e.target.value))}
            />
            <input 
              type="number" 
              className="number-input"
              value={pixelScale}
              onChange={(e) => setPixelScale(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="control-group">
          <label>Contrast</label>
          <div className="flex-row">
             <input 
              type="range" 
              min="0.1" 
              max="3.0" 
              step="0.1"
              value={contrast} 
              onChange={(e) => setContrast(parseFloat(e.target.value))}
            />
             <input 
              type="number" 
              className="number-input"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="control-group">
          <label>Brand Colors</label>
          <div className="flex-row">
             <span>Primary</span>
             <input 
               type="color" 
               style={{ width: '40px', height: '40px', padding: '0', border: '2px solid #000' }}
               value={accentColor}
               onChange={(e) => setAccentColor(e.target.value)}
             />
          </div>
          <div className="flex-row">
             <span>Background</span>
             <input 
               type="color" 
               style={{ width: '40px', height: '40px', padding: '0', border: '2px solid #000' }}
               value={bgColor}
               onChange={(e) => setBgColor(e.target.value)}
             />
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
                accept="image/*"
             />
             <button className="brutalist-button" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
                 <Upload size={18} /> Upload Image
             </button>
             <button className="brutalist-button primary" onClick={handleExportFigma} disabled={isExporting}>
                 <Copy size={18} /> Copy to Figma
             </button>
             <button className="brutalist-button" onClick={handleExportFramer} disabled={isExporting}>
                 <Code size={18} /> Copy Framer Code
             </button>
             <button className="brutalist-button" onClick={handleExportSVG} disabled={isExporting}>
                 <Download size={18} /> Export SVG
             </button>
        </div>
      </aside>

      {/* Physics Canvas Area */}
      <main className="canvas-container">
          {items.map((item) => (
             <PhysicsElement key={item.id} engine={engine} x={item.x} y={item.y}>
                 <img 
                    src={item.processedUrl} 
                    alt="Generated Asset" 
                    style={{ 
                        maxWidth: '300px', 
                        pointerEvents: 'none',
                        imageRendering: 'pixelated' 
                    }} 
                 />
             </PhysicsElement>
          ))}

          {/* Source Box Component */}
          {originalImageUrl && (
             <div className="source-box">
                 <div style={{ width: '64px', height: '64px', background: `url(${originalImageUrl}) center/cover`, border: '1px solid #000' }} />
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <div className="color-swatch" style={{ background: accentColor }}></div>
                     <div className="color-swatch" style={{ background: bgColor }}></div>
                 </div>
             </div>
          )}
      </main>
    </div>
  );
}

export default App;
