import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Check, PanelLeft, Plus, Eye, EyeOff, ChevronDown } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { usePhysics } from './utils/usePhysics';
import PhysicsElement from './components/PhysicsElement';
import EffectEngine from './components/EffectEngine';
// SVG export coming soon — imports left for future re-enable
// import { vectorizeToSVG, downloadSVG } from './utils/vectorizer';
// import { constructFigmaPayload, copyHTMLToClipboard, constructFramerComponent } from './utils/integrations';
import Dropdown from './components/Dropdown';
import LayerItem from './components/LayerItem';
import './index.css';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;
const ZOOM_FACTOR = 1.08;

// ── Per-layer factory ──────────────────────────────────────────────────────
let _layerCounter = 1;
const createLayer = (originalUrl, name) => ({
  id: Date.now() + Math.random(),
  name: name || `Layer ${_layerCounter++}`,
  visible: true,
  opacity: 100,           // 0–100 %
  originalUrl,
  processedUrl: null,
  effectEnabled: false,   // ← user must explicitly pick an effect; raw image shows until then
  effectType: 'atkinson',
  pixelScale: 40,         // 0–100 % → maps to 1–20 raw
  contrast: 40,           // 0–100 % → maps to 0.1–3.0 raw
  accentColor: '#0099ff',
  bgColor: null,          // second duotone color (null = disabled)
});

// Normalise percentage to algorithm range
const rawPixelScale = (pct) => (pct / 100) * 19 + 1;        // 1–20
const rawContrast   = (pct) => (pct / 100) * 2.9 + 0.1;     // 0.1–3.0

function App() {
  // ── Layer state ──────────────────────────────────────────────────────────
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [renamingLayerId, setRenamingLayerId] = useState(null);
  const [layersCollapsed, setLayersCollapsed] = useState(false);

  // ── Undo history (single-level) ──────────────────────────────────────────
  const prevLayersRef = useRef([]);

  const updateLayer = useCallback((id, changes) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
  }, []);

  // Derived: active layer (selected or last)
  const selectedLayer = layers.find(l => l.id === selectedLayerId) ?? layers[layers.length - 1] ?? null;
  const updateSelected = useCallback((changes) => {
    if (selectedLayer) updateLayer(selectedLayer.id, changes);
  }, [selectedLayer, updateLayer]);

  // ── Export state ─────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('image');
  const [exportScale, setExportScale] = useState('1x');
  const [exportSuccess, setExportSuccess] = useState(false);

  // ── Asset tab state ─────────────────────────────────────────────────────
  const [assetTab, setAssetTab] = useState('image');

  // ── Keybindings overlay ──────────────────────────────────────────────────
  const [showKeybindings, setShowKeybindings] = useState(false);

  // ── Micro-interaction states ─────────────────────────────────────────────
  const [panelsHidden, setPanelsHidden] = useState(false);
  const [zoomSpring, setZoomSpring]     = useState(false);
  const [canvasFlash, setCanvasFlash]   = useState(false);

  // ── Camera ───────────────────────────────────────────────────────────────
  const [camera, setCamera] = useState({ x: window.innerWidth / 2 - 4000, y: window.innerHeight / 2 - 4000, z: 1 });
  const cameraRef  = useRef(camera);
  const prevZoomRef = useRef(camera.z);

  useEffect(() => { cameraRef.current = camera; }, [camera]);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const fileInputRef    = useRef(null);
  const replaceIdRef    = useRef(null); // which layer's source to replace
  const { engine }      = usePhysics();
  const canvasRef       = useRef(null);
  const isSpaceDown     = useRef(false);
  const isDragging      = useRef(false);
  const lastMousePos    = useRef({ x: 0, y: 0 });
  const selectedIdRef   = useRef(selectedLayerId);
  const layersRef       = useRef(layers);

  // Keep refs in sync for use in event handlers (avoids stale closures)
  useEffect(() => { selectedIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { layersRef.current = layers; }, [layers]);

  // ── Zoom badge animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (camera.z === prevZoomRef.current) return;
    prevZoomRef.current = camera.z;
    const t1 = setTimeout(() => setZoomSpring(true),  0);
    const t2 = setTimeout(() => setZoomSpring(false), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [camera.z]);

  // ── Wheel + key events ───────────────────────────────────────────────────
  useEffect(() => {
    const handleWheel = (e) => {
      if (!canvasRef.current?.contains(e.target)) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const curr = cameraRef.current.z;
        const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, curr * factor));
        const ratio = next / curr;
        setCamera({
          x: e.clientX - (e.clientX - cameraRef.current.x) * ratio,
          y: e.clientY - (e.clientY - cameraRef.current.y) * ratio,
          z: next,
        });
      } else {
        setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      if (e.code === 'Space') {
        isSpaceDown.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }
      if (e.code === 'Tab') { e.preventDefault(); setPanelsHidden(v => !v); }
      if (e.key === '?') { e.preventDefault(); setShowKeybindings(v => !v); }
      if (e.shiftKey && e.key === '0') setCamera(prev => ({ ...prev, z: 1 }));

      if (!isInput) {
        // Delete selected layer (uses refs to avoid stale closures)
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
          prevLayersRef.current = layersRef.current;
          setLayers(prev => prev.filter(l => l.id !== selectedIdRef.current));
          setSelectedLayerId(null);
        }
        // Deselect
        if (e.key === 'Escape') { setSelectedLayerId(null); setShowKeybindings(false); }
        // Rename selected
        if (e.key === 'F2' && selectedIdRef.current) setRenamingLayerId(selectedIdRef.current);
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (prevLayersRef.current.length) {
          setLayers(prevLayersRef.current);
          prevLayersRef.current = [];
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpaceDown.current = false;
        if (canvasRef.current && !isDragging.current) canvasRef.current.style.cursor = 'default';
      }
    };

    const opts = { passive: false };
    window.addEventListener('wheel', handleWheel, opts);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('wheel', handleWheel, opts);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Ctrl+V paste from clipboard ──────────────────────────────────────────
  useEffect(() => {
    const handlePaste = async (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (isInput) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          const url  = URL.createObjectURL(blob);
          const name = `Pasted ${new Date().toLocaleTimeString()}`;
          const newLayer = createLayer(url, name);
          const wx = (window.innerWidth  / 2 - cameraRef.current.x) / cameraRef.current.z;
          const wy = (window.innerHeight / 2 - cameraRef.current.y) / cameraRef.current.z;
          newLayer.x = wx; newLayer.y = wy;
          prevLayersRef.current = layersRef.current;
          setLayers(prev => [...prev, newLayer]);
          setSelectedLayerId(newLayer.id);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // ── Canvas pan handlers ──────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (['INPUT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
    if (isSpaceDown.current || e.button === 1 || e.button === 0) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'grabbing';
    }
  };
  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
  };

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url  = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    const repId = replaceIdRef.current;
    replaceIdRef.current = null;
    e.target.value = '';

    if (repId) {
      // Revoke old URL to prevent memory leak
      const oldLayer = layersRef.current.find(l => l.id === repId);
      if (oldLayer?.originalUrl?.startsWith('blob:')) URL.revokeObjectURL(oldLayer.originalUrl);
      updateLayer(repId, { originalUrl: url, processedUrl: null, name });
    } else {
      // New layer
      const wx = (window.innerWidth  / 2 - cameraRef.current.x) / cameraRef.current.z;
      const wy = (window.innerHeight / 2 - cameraRef.current.y) / cameraRef.current.z;
      const newLayer = { ...createLayer(url, name), x: wx, y: wy };
      prevLayersRef.current = layersRef.current;
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    }
  };

  const openFilePicker = (replaceId = null) => {
    replaceIdRef.current = replaceId;
    fileInputRef.current?.click();
  };

  // ── Canvas flash helper ──────────────────────────────────────────────────
  const triggerCanvasFlash = () => {
    setCanvasFlash(true);
    setTimeout(() => setCanvasFlash(false), 550);
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const activeUrl   = selectedLayer?.processedUrl ?? null;
  // accentColor will be used when SVG/Figma/Framer export is re-enabled
  // const accentColor = selectedLayer?.accentColor ?? '#0099ff';

  const handleExport = async () => {
    if (!activeUrl || isExporting) return;
    setIsExporting(true);
    try {
      if (exportFormat === 'image') {
        // Render at requested scale using offscreen canvas
        const scaleNum = parseInt(exportScale) || 1;
        const img = new Image();
        img.src = activeUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const outW = img.width * scaleNum;
        const outH = img.height * scaleNum;
        const offscreen = document.createElement('canvas');
        offscreen.width = outW;
        offscreen.height = outH;
        const octx = offscreen.getContext('2d');
        octx.imageSmoothingEnabled = false; // nearest-neighbour upscale
        octx.drawImage(img, 0, 0, outW, outH);
        offscreen.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedLayer?.name ?? 'ditter'}-${exportScale}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
        triggerCanvasFlash();
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 1500);
      } else if (exportFormat === 'svg' || exportFormat === 'figma' || exportFormat === 'framer') {
        // Potrace is a Node.js library — not available in browser
        console.warn(`${exportFormat} export requires a server-side tracer (coming soon).`);
        triggerCanvasFlash();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  // ── Persistent dot grid ──────────────────────────────────────────────────
  const gridSize = 24 * camera.z;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Hidden file input */}
      <input
        type="file" ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*,.svg"
      />

      {/* EffectEngine per layer — only runs when effect is armed */}
      {layers.map(layer => layer.effectEnabled ? (
        <EffectEngine
          key={layer.id}
          src={layer.originalUrl}
          effectType={layer.effectType}
          pixelScale={rawPixelScale(layer.pixelScale)}
          contrast={rawContrast(layer.contrast)}
          accentColor={layer.accentColor}
          onProcessed={(url) => updateLayer(layer.id, { processedUrl: url })}
        />
      ) : null)}

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <main
        className={`canvas-container${canvasFlash ? ' flash' : ''}`}
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => { if (e.target === e.currentTarget || e.target.closest('.canvas-container') === e.target) setSelectedLayerId(null); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (!file || (!file.type.startsWith('image/') && !file.name.endsWith('.svg'))) return;
          const url = URL.createObjectURL(file);
          const name = file.name.replace(/\.[^.]+$/, '');
          const wx = (e.clientX - cameraRef.current.x) / cameraRef.current.z;
          const wy = (e.clientY - cameraRef.current.y) / cameraRef.current.z;
          const newLayer = { ...createLayer(url, name), x: wx, y: wy };
          prevLayersRef.current = layersRef.current;
          setLayers(prev => [...prev, newLayer]);
          setSelectedLayerId(newLayer.id);
        }}
        style={{ cursor: 'default', touchAction: 'none' }}
      >
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${camera.x % gridSize}px ${camera.y % gridSize}px`,
        }} />

        {/* World transform */}
        <div style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
          transformOrigin: '0 0', willChange: 'transform',
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        }}>
          {layers.map(layer => layer.visible ? (
            <PhysicsElement
              key={layer.id}
              engine={engine}
              x={layer.x}
              y={layer.y}
              camera={camera}
              isSelected={layer.id === selectedLayerId}
              onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
            >
              <img
                src={layer.processedUrl || layer.originalUrl}
                alt={layer.name}
                draggable={false}
                className={layer.processedUrl ? 'pixelated' : ''}
                style={{
                  maxWidth: '300px', display: 'block',
                  opacity: layer.opacity / 100,
                  cursor: 'pointer',
                }}
              />
            </PhysicsElement>
          ) : null)}
        </div>
      </main>

      {/* ── UI Panels ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!panelsHidden && (
          <>
            {/* ─── LEFT PANEL ────────────────────────────────────────────── */}
            <motion.aside
              className="floating-panel left-panel"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {/* Logo */}
              <div className="panel-header">
                <h1 className="logo-text">
                  <span className="logo-main">Ditter</span>
                  <span className="logo-dot-io">.io</span>
                </h1>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="panel-icon-btn"
                    onClick={() => setShowKeybindings(v => !v)}
                    title="Keyboard shortcuts (?)"
                    style={{ fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}
                  >
                    ?
                  </button>
                  <button
                    className="panel-icon-btn"
                    onClick={() => setPanelsHidden(true)}
                    title="Hide panels (Tab)"
                  >
                    <PanelLeft size={15} />
                  </button>
                </div>
              </div>

              <div className="panel-divider" />

              {/* Layers collapsible section */}
              <div className="layers-section">
                <button
                  className="section-collapse-btn"
                  onClick={() => setLayersCollapsed(v => !v)}
                >
                  <motion.span
                    animate={{ rotate: layersCollapsed ? -90 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{ display: 'inline-flex' }}
                  >
                    <ChevronDown size={13} />
                  </motion.span>
                  <span>Layers</span>
                </button>

                <AnimatePresence initial={false}>
                  {!layersCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="layers-list">
                        {layers.length === 0 ? (
                          <div className="layers-empty">
                            No layers yet.
                          </div>
                        ) : (
                          [...layers].reverse().map(layer => (
                            <LayerItem
                              key={layer.id}
                              layer={layer}
                              isSelected={layer.id === selectedLayerId}
                              isRenaming={layer.id === renamingLayerId}
                              onSelect={() => setSelectedLayerId(layer.id)}
                              onVisibilityToggle={() => updateLayer(layer.id, { visible: !layer.visible })}
                              onRenameCommit={(name) => {
                                updateLayer(layer.id, { name });
                                setRenamingLayerId(null);
                              }}
                              onRenameStart={() => setRenamingLayerId(layer.id)}
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Import button at bottom of left panel */}
              <div className="panel-footer">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="framer-button outline"
                  style={{ width: '100%' }}
                  onClick={() => openFilePicker()}
                >
                  <Upload size={13} /> Import Image
                </motion.button>
              </div>
            </motion.aside>

            {/* ─── RIGHT PANEL ───────────────────────────────────────────── */}
            <motion.aside
              className="floating-panel right-panel"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {/* Effect Render */}
              <div className="panel-section">
                <div className="section-header">
                  <label className="control-label">Effect Render</label>
                  {selectedLayer?.effectEnabled && (
                    <button
                      className="section-plus-btn"
                      onClick={() => updateSelected({ effectEnabled: false, processedUrl: null })}
                      title="Remove effect (show raw image)"
                      style={{ fontSize: 10, padding: '2px 6px', letterSpacing: '0.01em', color: 'var(--text-dim)' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="segmented-control">
                  {[['atkinson', '1-Bit'], ['halftone', 'Halftone'], ['ascii', 'ASCII']].map(([type, label]) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.92 }}
                      className={`segmented-btn${
                        selectedLayer?.effectEnabled && selectedLayer?.effectType === type ? ' active' : ''
                      }`}
                      onClick={() => {
                        if (selectedLayer?.effectEnabled && selectedLayer?.effectType === type) {
                          // Clicking the active effect again disables it
                          updateSelected({ effectEnabled: false, processedUrl: null });
                        } else {
                          // Arm the effect — EffectEngine will now fire
                          updateSelected({ effectType: type, effectEnabled: true });
                        }
                      }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
                {selectedLayer && !selectedLayer.effectEnabled && (
                  <p style={{
                    fontSize: 10.5, color: 'var(--text-dim)',
                    marginTop: 8, lineHeight: 1.5,
                  }}>
                    Select an effect above to apply it.
                  </p>
                )}
              </div>

              <div className="panel-divider" />

              {/* Pixel Scale + Contrast */}
              <div className="panel-section">
                <div className="control-group">
                  <label className="control-label">Pixel Scale</label>
                  <div className="slider-row">
                    <input
                      type="range" min="0" max="100"
                      value={selectedLayer?.pixelScale ?? 40}
                      style={{ '--val': `${selectedLayer?.pixelScale ?? 40}%` }}
                      onChange={e => updateSelected({ pixelScale: parseInt(e.target.value) })}
                    />
                    <span className="slider-pct">{selectedLayer?.pixelScale ?? 40}%</span>
                  </div>
                </div>
                <div className="control-group">
                  <label className="control-label">Contrast</label>
                  <div className="slider-row">
                    <input
                      type="range" min="0" max="100"
                      value={selectedLayer?.contrast ?? 40}
                      style={{ '--val': `${selectedLayer?.contrast ?? 40}%` }}
                      onChange={e => updateSelected({ contrast: parseInt(e.target.value) })}
                    />
                    <span className="slider-pct">{selectedLayer?.contrast ?? 40}%</span>
                  </div>
                </div>
              </div>

              <div className="panel-divider" />

              {/* Assets */}
              <div className="panel-section">
                <div className="section-header">
                  <span className="control-label">Assets</span>
                  {selectedLayer && (
                    <button
                      className="section-plus-btn"
                      onClick={() => openFilePicker(selectedLayer.id)}
                      title="Replace source image"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Image / SVG tabs */}
                <div className="segmented-control" style={{ marginBottom: 10 }}>
                  <button
                    className={`segmented-btn${assetTab === 'image' ? ' active' : ''}`}
                    onClick={() => setAssetTab('image')}
                  >Image</button>
                  <button
                    className={`segmented-btn${assetTab === 'svg' ? ' active' : ''}`}
                    onClick={() => setAssetTab('svg')}
                  >SVG</button>
                </div>

                {selectedLayer?.originalUrl ? (
                  <>
                    <div
                      className="asset-preview"
                      onClick={() => openFilePicker(selectedLayer.id)}
                      title="Click to replace source image"
                    >
                      <img
                        src={assetTab === 'svg' && selectedLayer.processedUrl ? selectedLayer.processedUrl : selectedLayer.originalUrl}
                        alt="Source"
                        draggable={false}
                        className={assetTab === 'svg' ? 'pixelated' : ''}
                      />
                    </div>
                    {/* Opacity slider */}
                    <div className="slider-row" style={{ marginTop: 10 }}>
                      <input
                        type="range" min="0" max="100"
                        value={selectedLayer.opacity}
                        style={{ '--val': `${selectedLayer.opacity}%` }}
                        onChange={e => updateSelected({ opacity: parseInt(e.target.value) })}
                      />
                      <span className="slider-pct">{selectedLayer.opacity}%</span>
                      <button
                        className={`layer-eye-btn${selectedLayer.visible ? '' : ' hidden'}`}
                        onClick={() => updateSelected({ visible: !selectedLayer.visible })}
                        title={selectedLayer.visible ? 'Hide layer' : 'Show layer'}
                      >
                        {selectedLayer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="asset-empty" onClick={() => openFilePicker()}>
                    <Upload size={20} />
                    <span>Import an Image</span>
                  </div>
                )}
              </div>

              <div className="panel-divider" />

              {/* Colors */}
              <div className="panel-section">
                <div className="section-header">
                  <span className="control-label">Colors</span>
                  <button
                    className="section-plus-btn"
                    onClick={() => {
                      // Toggle duotone second color
                      if (selectedLayer?.bgColor) {
                        updateSelected({ bgColor: null });
                      } else {
                        updateSelected({ bgColor: '#e5e5e5' });
                      }
                    }}
                    title="Add duotone color"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {/* Primary accent color */}
                <div className="color-row">
                  <input
                    type="text"
                    className="hex-input"
                    value={(selectedLayer?.accentColor ?? '#0099ff').toUpperCase()}
                    onChange={e => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateSelected({ accentColor: v });
                    }}
                  />
                  <label className="color-swatch-btn" style={{ background: selectedLayer?.accentColor ?? '#0099ff' }}>
                    <input
                      type="color"
                      value={selectedLayer?.accentColor ?? '#0099ff'}
                      onChange={e => updateSelected({ accentColor: e.target.value })}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                  </label>
                </div>
                {/* Duotone second color */}
                {selectedLayer?.bgColor && (
                  <div className="color-row" style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      className="hex-input"
                      value={selectedLayer.bgColor.toUpperCase()}
                      onChange={e => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateSelected({ bgColor: v });
                      }}
                    />
                    <label className="color-swatch-btn" style={{ background: selectedLayer.bgColor }}>
                      <input
                        type="color"
                        value={selectedLayer.bgColor}
                        onChange={e => updateSelected({ bgColor: e.target.value })}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="panel-divider" />

              {/* Export */}
              <div className="panel-section">
                <div className="section-header">
                  <span className="control-label">Export</span>
                  <button
                    className={`section-plus-btn${exportSuccess ? ' success' : ''}`}
                    onClick={handleExport}
                    disabled={isExporting || !activeUrl}
                    title="Export"
                  >
                    {exportSuccess ? <Check size={14} /> : <Download size={14} />}
                  </button>
                </div>
                <div className="export-row">
                  <div className="export-col">
                    <span className="export-col-label">Quality</span>
                    <Dropdown
                      options={[
                        { label: '1x', value: '1x' },
                        { label: '2x', value: '2x' },
                        { label: '4x', value: '4x' },
                      ]}
                      value={exportScale}
                      onChange={setExportScale}
                    />
                  </div>
                  <div className="export-col">
                    <span className="export-col-label">Format</span>
                    <Dropdown
                      options={[
                        { label: 'Image', value: 'image' },
                        { label: 'SVG',   value: 'svg' },
                        { label: 'Figma', value: 'figma' },
                        { label: 'Framer',value: 'framer' },
                        { label: 'PDF',   value: 'pdf', disabled: true, tag: 'Soon' },
                      ]}
                      value={exportFormat}
                      onChange={setExportFormat}
                    />
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Zoom badge */}
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

      {/* "Press Tab" hint when panels hidden */}
      <AnimatePresence>
        {panelsHidden && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--panel-bg)', border: '1px solid var(--border-color)',
              padding: '6px 12px', borderRadius: '6px', fontSize: '11px',
              color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 100,
            }}
          >
            Press <strong>Tab</strong> to show panels
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keybindings overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showKeybindings && (
          <motion.div
            className="keybindings-overlay"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            onClick={() => setShowKeybindings(false)}
          >
            <motion.div
              className="keybindings-card"
              onClick={e => e.stopPropagation()}
            >
              <div className="keybindings-header">
                <span>Keyboard Shortcuts</span>
                <button className="panel-icon-btn" onClick={() => setShowKeybindings(false)} title="Close (Esc)">
                  ✕
                </button>
              </div>
              <table className="keybindings-table">
                <tbody>
                  {[
                    { keys: ['Tab'],                         desc: 'Toggle panels' },
                    { keys: ['?'],                           desc: 'Show this help' },
                    { keys: ['Space', 'drag'],               desc: 'Pan canvas' },
                    { keys: ['Ctrl', 'scroll'],              desc: 'Zoom in / out' },
                    { keys: ['Shift', '0'],                  desc: 'Reset zoom to 100%' },
                    { keys: ['Del'],                         desc: 'Delete selected layer' },
                    { keys: ['Esc'],                         desc: 'Deselect / close overlay' },
                    { keys: ['F2'],                          desc: 'Rename selected layer' },
                    { keys: ['Ctrl', 'Z'],                   desc: 'Undo' },
                    { keys: ['Ctrl', 'V'],                   desc: 'Paste image from clipboard' },
                  ].map(({ keys, desc }) => (
                    <tr key={desc}>
                      <td className="keybinding-keys">
                        {keys.map((k, i) => (
                          <span key={k}>
                            {i > 0 && <span className="keybinding-sep">+</span>}
                            <kbd className="kbd">{k}</kbd>
                          </span>
                        ))}
                      </td>
                      <td className="keybinding-desc">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
