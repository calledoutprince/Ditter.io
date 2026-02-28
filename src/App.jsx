import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Copy, Check, Sun, Type, Image as ImageIcon, Code } from 'lucide-react';
import { usePhysics } from './utils/usePhysics';
import PhysicsElement from './components/PhysicsElement';
import EffectEngine from './components/EffectEngine';
import { vectorizeToSVG, downloadSVG } from './utils/vectorizer';
import { constructFigmaPayload, copyHTMLToClipboard, constructFramerComponent } from './utils/integrations';
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

  // ── Micro-interaction states ──────────────────────────────
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [figmaCopied, setFigmaCopied] = useState(false);
  const [framerCopied, setFramerCopied] = useState(false);
  const [zoomSpring, setZoomSpring] = useState(false);
  const [swatch1Wiggle, setSwatch1Wiggle] = useState(false);
  const [swatch2Wiggle, setSwatch2Wiggle] = useState(false);
  const [canvasFlash, setCanvasFlash] = useState(false);
  const [svgNudge, setSvgNudge] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
  const { engine } = usePhysics(cameraRef);
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
    setZoomSpring(true);
    const t = setTimeout(() => setZoomSpring(false), 250);
    return () => clearTimeout(t);
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
      if (e.code === 'Space') isSpaceDown.current = true;

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
      if (e.code === 'Space') isSpaceDown.current = false;
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
      setIsProcessing(true);
    }
  };

  const handleProcessedImage = useCallback((dataUrl) => {
    setActiveProcessedUrl(dataUrl);
    setIsProcessing(false);

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

  /** Add + remove a CSS class for a short duration */
  const flashButtonClass = (btnRef, cls = 'flashing', ms = 400) => {
    if (!btnRef.current) return;
    btnRef.current.classList.add(cls);
    setTimeout(() => btnRef.current?.classList.remove(cls), ms);
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
    setSvgNudge(true);
    setTimeout(() => setSvgNudge(false), 450);
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

  // Grid layer only strictly visible at high zoom
  const gridOpacity = camera.z >= 8 ? 1 : 0;
  const gridBackground = `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
     linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`;

  return (
    <div className="app-container" style={{ overflow: 'hidden' }}>
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

      {/* Top Navigation Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo-text">Ditter.io</span>
        </div>
        <div className="topbar-right">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*"
          />
          <button
            className="framer-button outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExporting}
          >
            <Upload size={14} /> Upload Image
          </button>
          
          <button
            className={`framer-button outline${svgNudge ? ' nudging' : ''}`}
            onClick={_handleExportSVG}
            disabled={isExporting || !activeProcessedUrl}
            title={!activeProcessedUrl ? 'Upload an image first' : 'Export SVG'}
          >
            <Download size={14} /> Export SVG
          </button>

          <button
            className={`framer-button primary${figmaCopied ? ' success' : ''}`}
            onClick={_handleExportFigma}
            disabled={isExporting || !activeProcessedUrl}
            title={!activeProcessedUrl ? 'Upload an image first' : 'Copy to Figma'}
          >
            {figmaCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Figma</>}
          </button>

          <button
            className={`framer-button primary${framerCopied ? ' success' : ''}`}
            onClick={_handleExportFramer}
            disabled={isExporting || !activeProcessedUrl}
            title={!activeProcessedUrl ? 'Upload an image first' : 'Copy Framer Component'}
          >
            {framerCopied ? <><Check size={14} /> Copied</> : <><Code size={14} /> Framer</>}
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="workspace">
        {/* Properties Sidebar */}
        <aside className="sidebar">
        <div className="sidebar-section">
          <div className="control-group">
            <label className="control-label">Effect Render</label>
            <div className="segmented-control">
              <button
                className={`segmented-btn ${effectType === 'atkinson' ? 'active' : ''}`}
                onClick={() => setEffectType('atkinson')}
              >
                1-Bit
              </button>
              <button
                className={`segmented-btn ${effectType === 'halftone' ? 'active' : ''}`}
                onClick={() => setEffectType('halftone')}
              >
                Halftone
              </button>
              <button
                className={`segmented-btn ${effectType === 'ascii' ? 'active' : ''}`}
                onClick={() => setEffectType('ascii')}
              >
                ASCII
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="control-group">
            <label className="control-label">Pixel Scale</label>
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
            <label className="control-label">Contrast</label>
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
        </div>

        <div className="sidebar-section">
          <div className="control-group">
            <label className="control-label">Appearance</label>
            <div className="flex-row">
              <span style={{ fontSize: '12px', color: 'var(--text-color)' }}>Primary Color</span>
              <div className="color-picker-wrap">
                <input
                  type="color"
                  value={accentColor}
                  onChange={handleAccentChange}
                />
              </div>
            </div>
            <div className="flex-row">
              <span style={{ fontSize: '12px', color: 'var(--text-color)' }}>Canvas Background</span>
              <div className="color-picker-wrap">
                <input
                  type="color"
                  value={bgColor}
                  onChange={handleBgChange}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Tab hint */}
        <div style={{
          marginTop: 'auto',
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center'
        }}>
          Press Tab to hide
        </div>
      </aside>

      {/* Interactive Infinite Canvas Area */}
      <main
        className={`canvas-container${canvasFlash ? ' flash' : ''}`}
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          cursor: isSpaceDown.current ? 'grab' : 'default',
          touchAction: 'none',
          position: 'relative'
        }}
      >
        {/* Pixel Grid Layer — fades in at high zoom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: gridBackground,
            backgroundSize: `${camera.z}px ${camera.z}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
            zIndex: 0,
            opacity: gridOpacity,
            transition: 'opacity 0.25s ease'
          }}
        />

        {/* Render World */}
        <div data-canvas-bg="true" style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}>
          {items.map((item) => (
            <PhysicsElement key={item.id} engine={engine} x={item.x} y={item.y}>
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

        {/* Source Box Component */}
        {originalImageUrl && (
          <div className="source-box">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              background: `url(${originalImageUrl}) center/cover`,
              border: '1px solid var(--border-color)'
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="source-box-title">Source Image</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div className={`color-swatch${swatch1Wiggle ? ' wiggle' : ''}`} style={{ background: accentColor }} />
                <div className={`color-swatch${swatch2Wiggle ? ' wiggle' : ''}`} style={{ background: bgColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Zoom Level Badge */}
        <div className={`zoom-badge${zoomSpring ? ' updating' : ''}`}>
          {Math.round(camera.z * 100)}%
        </div>

        {/* Tab = show panels hint when hidden */}
        {panelsHidden && (
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'none'
          }}>
            Press Tab to show panels
          </div>
        )}
      </main>
      </div> {/* end workspace container */}
    </div>
  );
}

export default App;
