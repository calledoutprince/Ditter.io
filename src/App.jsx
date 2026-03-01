import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Copy, Check, Sun, Type, Image as ImageIcon, Code } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { usePhysics } from './utils/usePhysics';
import PhysicsElement from './components/PhysicsElement';
import EffectEngine from './components/EffectEngine';
import { vectorizeToSVG, downloadSVG } from './utils/vectorizer';
import { constructFigmaPayload, copyHTMLToClipboard, constructFramerComponent } from './utils/integrations';
import Dropdown from './components/Dropdown';
import './index.css';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const ZOOM_FACTOR = 1.08; // multiplied/divided per scroll tick

function App() {
  const [effectType, setEffectType] = useState('atkinson');
  const [pixelScale, setPixelScale] = useState(4);
  const [contrast, setContrast] = useState(1.2);
  const [accentColor, setAccentColor] = useState('#0000ff');
  const [bgColor, setBgColor] = useState('#e5e5e5');
  const [items, setItems] = useState([]);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [activeProcessedUrl, setActiveProcessedUrl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('svg');
  const [exportScale, setExportScale] = useState(1);

  // ── Micro-interaction states ──────────────────────────────
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [figmaCopied, setFigmaCopied] = useState(false);
  const [framerCopied, setFramerCopied] = useState(false);
  const [zoomSpring, setZoomSpring] = useState(false);
  const [swatch1Wiggle, setSwatch1Wiggle] = useState(false);
  const [swatch2Wiggle, setSwatch2Wiggle] = useState(false);
  const [canvasFlash, setCanvasFlash] = useState(false);
  const logoRef = useRef(null);
  // ─────────────────────────────────────────────────────────

  // Infinite Canvas Camera State
  const [camera, setCamera] = useState({ x: window.innerWidth / 2 - 4000, y: window.innerHeight / 2 - 4000, z: 1 });
  const cameraRef = useRef(camera);
  const prevZoomRef = useRef(camera.z);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const fileInputRef = useRef(null);
  const { engine } = usePhysics();
  const canvasRef = useRef(null);

  const isSpaceDown = useRef(false);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Logo glitch — fires once on mount
  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    el.classList.add('logo-glitch');
    const timer = setTimeout(() => el.classList.remove('logo-glitch'), 750);
    return () => clearTimeout(timer);
  }, []);

  // Zoom badge spring — fires when zoom level changes
  useEffect(() => {
    if (camera.z === prevZoomRef.current) return;
    prevZoomRef.current = camera.z;
    const t1 = setTimeout(() => setZoomSpring(true), 0);
    const t2 = setTimeout(() => setZoomSpring(false), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [camera.z]);

  // Dynamically update background color
  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  // Handle Wheel manually to prevent passive preventDefault errors
  useEffect(() => {
    const handleWheel = (e) => {
      if (!canvasRef.current?.contains(e.target)) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = cameraRef.current.z;
        const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor));

        const scaleRatio = nextZoom / currentZoom;
        const newX = e.clientX - (e.clientX - cameraRef.current.x) * scaleRatio;
        const newY = e.clientY - (e.clientY - cameraRef.current.y) * scaleRatio;
        setCamera({ x: newX, y: newY, z: nextZoom });
      } else {
        e.preventDefault();
        setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    const options = { passive: false };
    window.addEventListener('wheel', handleWheel, options);

    const handleKeyDown = (e) => {
      // Space pan
      if (e.code === 'Space') {
        isSpaceDown.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }

      // Tab = toggle UI panels
      if (e.code === 'Tab') {
        e.preventDefault();
        setPanelsHidden(v => !v);
      }

      // Zoom shortcuts
      if (e.shiftKey && e.key === '1') {
        setCamera({ x: window.innerWidth / 2 - 4000, y: window.innerHeight / 2 - 4000, z: 1 });
      }
      if (e.shiftKey && e.key === '2') {
        setCamera(prev => ({ ...prev, z: 2 }));
      }
      if (e.shiftKey && e.key === '0') {
        setCamera(prev => ({ ...prev, z: 1 }));
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpaceDown.current = false;
        if (canvasRef.current && !isDragging.current) canvasRef.current.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('wheel', handleWheel, options);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'BUTTON') return;
    if (isSpaceDown.current || e.button === 1 || e.button === 0) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    }
  };

  const handleProcessedImage = useCallback((dataUrl) => {
    setActiveProcessedUrl(dataUrl);

    setItems((prev) => {
      const exists = prev.find(p => p.sourceUrl === originalImageUrl);
      if (exists) {
        return prev.map(p => p.sourceUrl === originalImageUrl ? { ...p, processedUrl: dataUrl } : p);
      } else {
        const worldX = (window.innerWidth / 2 - cameraRef.current.x) / cameraRef.current.z;
        const worldY = (window.innerHeight / 2 - cameraRef.current.y) / cameraRef.current.z;
        return [
          ...prev,
          {
            id: Date.now(),
            sourceUrl: originalImageUrl,
            processedUrl: dataUrl,
            x: worldX,
            y: worldY
          }
        ];
      }
    });
  }, [originalImageUrl]);

  // ── Micro-interaction helpers ─────────────────────────────

  /** Flash accent border on canvas edge */
  const triggerCanvasFlash = () => {
    setCanvasFlash(true);
    setTimeout(() => setCanvasFlash(false), 550);
  };

  // ─────────────────────────────────────────────────────────

  const _handleExportFigma = async () => {
    if (!activeProcessedUrl) return;
    setIsExporting(true);
    try {
      const { pathData, width, height } = await vectorizeToSVG(activeProcessedUrl, accentColor);
      const figmaHtml = constructFigmaPayload(pathData, width, height, accentColor);
      await copyHTMLToClipboard(figmaHtml);
      // ✓ success micro-interaction
      setFigmaCopied(true);
      triggerCanvasFlash();
      setTimeout(() => setFigmaCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
    setIsExporting(false);
  };

  const _handleExportSVG = async () => {
    if (!activeProcessedUrl) return;
    setIsExporting(true);
    try {
      const { svgString } = await vectorizeToSVG(activeProcessedUrl, accentColor);
      downloadSVG(svgString, `dither-gravity-${Date.now()}.svg`);
      triggerCanvasFlash();
    } catch (err) {
      console.error(err);
    }
    setIsExporting(false);
  };

  const _handleExportFramer = async () => {
    if (!activeProcessedUrl) return;
    setIsExporting(true);
    try {
      const { pathData } = await vectorizeToSVG(activeProcessedUrl, accentColor);
      const framerCode = constructFramerComponent(pathData, accentColor);
      await navigator.clipboard.writeText(framerCode);
      setFramerCopied(true);
      triggerCanvasFlash();
      setTimeout(() => setFramerCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
    setIsExporting(false);
  };

  // Color change handlers with swatch wiggle
  const handleAccentChange = (e) => {
    setAccentColor(e.target.value);
    setSwatch1Wiggle(true);
    setTimeout(() => setSwatch1Wiggle(false), 400);
  };

  const handleBgChange = (e) => {
    setBgColor(e.target.value);
    setSwatch2Wiggle(true);
    setTimeout(() => setSwatch2Wiggle(false), 400);
  };

  // Persistent Dot Grid Layer
  const gridBackground = `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`;
  const gridSize = 24 * camera.z;

  return (
    <div className="app-container">
      {originalImageUrl && (
        <EffectEngine
          src={originalImageUrl}
          effectType={effectType}
          pixelScale={pixelScale}
          contrast={contrast}
          accentColor={accentColor}
          onProcessed={handleProcessedImage}
        />
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*"
      />

      {/* Interactive Infinite Canvas Area */}
      <main
        className={`canvas-container${canvasFlash ? ' flash' : ''}`}
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: 'default', touchAction: 'none' }}
      >
        {/* Persistent Pixel Dot Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: gridBackground,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
            zIndex: 0,
          }}
        />

        {/* Render World */}
        <div data-canvas-bg="true" style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%'
        }}>
          {items.map((item) => (
            <PhysicsElement key={item.id} engine={engine} x={item.x} y={item.y} camera={camera}>
              <img
                src={item.processedUrl}
                alt="Generated Asset"
                draggable={false}
                className="pixelated"
                style={{
                  maxWidth: '300px',
                  display: 'block',
                  cursor: 'pointer'
                }}
              />
            </PhysicsElement>
          ))}
        </div>
      </main>

      {/* UI Panels Overlay */}
      <AnimatePresence>
        {!panelsHidden && (
          <>
            {/* L E F T   P A N E L */}
            <motion.aside 
              className="floating-panel left-panel"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="panel-header">
                <span className="logo-text">Ditter.io</span>
                <span style={{color: 'var(--text-muted)'}}><Code size={14} /></span>
              </div>
              <div className="panel-section">
                <div className="segmented-control" style={{ marginBottom: 16 }}>
                  <button className="segmented-btn active">Layers</button>
                  <button className="segmented-btn">Assets</button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="framer-button outline"
                  style={{ width: '100%' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExporting}
                >
                  <Upload size={14} /> Import Image
                </motion.button>
              </div>
              
              {/* Layer Display Shell */}
              <div className="panel-section" style={{flex: 1, borderBottom: 'none'}}>
                  {items.length === 0 ? (
                      <div style={{color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', paddingTop: '20px'}}>
                          No layers imported yet.
                      </div>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {items.map((it, idx) => (
                              <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-color)' }}>
                                  Layer {idx + 1} (1-Bit)
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            </motion.aside>

            {/* R I G H T   P A N E L */}
            <motion.aside 
              className="floating-panel right-panel"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="panel-section">
                <div className="control-group">
                  <label className="control-label">Effect Render</label>
                  <div className="segmented-control">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`segmented-btn ${effectType === 'atkinson' ? 'active' : ''}`}
                      onClick={() => setEffectType('atkinson')}
                    >1-Bit</motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`segmented-btn ${effectType === 'halftone' ? 'active' : ''}`}
                      onClick={() => setEffectType('halftone')}
                    >Halftone</motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`segmented-btn ${effectType === 'ascii' ? 'active' : ''}`}
                      onClick={() => setEffectType('ascii')}
                    >ASCII</motion.button>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <div className="control-group">
                  <label className="control-label">Pixel Scale</label>
                  <div className="flex-row">
                    <input type="range" min="1" max="20" value={pixelScale} onChange={(e) => setPixelScale(parseInt(e.target.value))} />
                    <input type="number" className="number-input" value={pixelScale} onChange={(e) => setPixelScale(parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="control-group" style={{marginTop: '16px'}}>
                  <label className="control-label">Contrast</label>
                  <div className="flex-row">
                    <input type="range" min="0.1" max="3.0" step="0.1" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} />
                    <input type="number" className="number-input" step="0.1" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <div className="control-group">
                  <label className="control-label">Colors</label>
                  <div className="flex-row">
                    <div style={{ flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                         <span style={{color: 'var(--text-muted)', fontSize: '11px', textTransform:'uppercase'}}>{accentColor}</span>
                    </div>
                    <div className="color-picker-wrap">
                      <input type="color" value={accentColor} onChange={handleAccentChange} />
                    </div>
                  </div>
                  <div className="flex-row" style={{marginTop:'8px'}}>
                    <div style={{ flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                         <span style={{color: 'var(--text-muted)', fontSize: '11px', textTransform:'uppercase'}}>{bgColor}</span>
                    </div>
                    <div className="color-picker-wrap">
                      <input type="color" value={bgColor} onChange={handleBgChange} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <div className="control-group">
                  <label className="control-label">Export</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                     <Dropdown 
                       options={[
                         {label: 'SVG', value: 'svg'}, 
                         {label: 'Figma', value: 'figma'}, 
                         {label: 'Framer', value: 'framer'}
                       ]} 
                       value={exportFormat} 
                       onChange={setExportFormat} 
                     />
                     <Dropdown 
                       options={[
                         {label: '1x', value: 1}, 
                         {label: '2x', value: 2}, 
                         {label: '4x', value: 4}
                       ]} 
                       value={exportScale} 
                       onChange={setExportScale} 
                         width="100px" 
                     />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`framer-button primary${(figmaCopied || framerCopied) ? ' success' : ''}`}
                    style={{ width: '100%' }}
                    disabled={isExporting || !activeProcessedUrl}
                    onClick={() => {
                        if (exportFormat === 'svg') _handleExportSVG();
                        else if (exportFormat === 'figma') _handleExportFigma();
                        else if (exportFormat === 'framer') _handleExportFramer();
                    }}
                  >
                    {figmaCopied || framerCopied ? <><Check size={14}/> Copied</> : <><Download size={14}/> Export</>}
                  </motion.button>
                </div>
              </div>
            </motion.aside>

            {/* Source Box Component mapped bottom left */}
            {originalImageUrl && (
              <motion.div 
                className="source-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{ top: 'auto', bottom: 16, left: 16 }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '4px',
                  background: `url(${originalImageUrl}) center/cover`, border: '1px solid var(--border-color)'
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="source-box-title">Source Image</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div className={`color-swatch${swatch1Wiggle ? ' wiggle' : ''}`} style={{ background: accentColor }} />
                    <div className={`color-swatch${swatch2Wiggle ? ' wiggle' : ''}`} style={{ background: bgColor }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Zoom Level Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`zoom-badge${zoomSpring ? ' updating' : ''}`}
            >
              {Math.round(camera.z * 100)}%
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelsHidden && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--panel-bg)', border: '1px solid var(--border-color)',
              padding: '6px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 100
            }}>
            Press Tab to show panels
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
