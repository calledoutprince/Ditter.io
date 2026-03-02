import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker, RgbaColorPicker, HslaColorPicker } from 'react-colorful';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { GripVertical } from 'lucide-react';
import './ColorPickerPopover.css';

extend([namesPlugin]);

const ColorPickerPopover = ({ color = '#ffffff', onChange, onClose, initialPosition = { top: 0, left: 0 }, onPositionChange }) => {
  const popoverRef = useRef(null);
  const [mode, setMode] = useState('hex'); // 'hex', 'rgb', 'hsl'
  const [localColor, setLocalColor] = useState(color === 'transparent' ? '#ffffff00' : color);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Close on click outside (but not if dragging)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isDragging && popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isDragging]);

  const handleMouseDown = (e) => {
    // Only drag from the padding or empty areas (not the picker or inputs)
    if (e.target === popoverRef.current || e.target.className === 'popover-mode-switch') {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - initialPosition.left,
        y: e.clientY - initialPosition.top
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      onPositionChange({
        top: e.clientY - dragOffset.y,
        left: e.clientX - dragOffset.x
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  useEffect(() => {
    const activeVal = color === 'transparent' ? '#ffffff00' : color;
    if (activeVal !== localColor) setLocalColor(activeVal);
  }, [color]);

  const handleColorChange = (newColor) => {
    setLocalColor(newColor);
    let outHex;
    if (typeof newColor === 'string') {
      outHex = newColor;
    } else {
      outHex = colord(newColor).toHex();
    }

    if (colord(outHex).alpha() === 0) {
      onChange('transparent');
    } else {
      onChange(outHex);
    }
  };

  const handleInputChange = (field, val) => {
    if (mode === 'hex') {
      const parsed = colord(val);
      if (parsed.isValid()) {
        handleColorChange(parsed.toHex());
      } else {
        setLocalColor(val);
      }
    } else if (mode === 'rgb') {
      const rgb = colord(localColor).toRgb();
      rgb[field] = Number(val);
      handleColorChange(rgb);
    } else if (mode === 'hsl') {
      const hsl = colord(localColor).toHsl();
      hsl[field] = Number(val);
      handleColorChange(hsl);
    }
  };

  const c = colord(localColor);
  const rgb = c.toRgb();
  const hsl = c.toHsl();
  const alphaPct = Math.round(c.alpha() * 100);

  return (
    <div
      className={`color-picker-popover ${isDragging ? 'dragging' : ''}`}
      ref={popoverRef}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div className="popover-drag-handle">
        <GripVertical size={14} />
      </div>
      {mode === 'hex' && <HexColorPicker color={c.toHex()} onChange={handleColorChange} />}
      {mode === 'rgb' && <RgbaColorPicker color={rgb} onChange={handleColorChange} />}
      {mode === 'hsl' && <HslaColorPicker color={hsl} onChange={handleColorChange} />}

      <div className="popover-mode-switch">
        <select className="mode-dropdown" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="hex">Hex</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
        </select>

        <div className="color-inputs-row">
          {mode === 'hex' && (
            <input
              type="text"
              className="color-input-box"
              value={c.toHex().toUpperCase()}
              onChange={(e) => handleInputChange('hex', e.target.value)}
            />
          )}
          {mode === 'rgb' && (
            <>
              <input type="number" min="0" max="255" className="color-input-box" value={rgb.r} onChange={(e) => handleInputChange('r', e.target.value)} />
              <input type="number" min="0" max="255" className="color-input-box" value={rgb.g} onChange={(e) => handleInputChange('g', e.target.value)} />
              <input type="number" min="0" max="255" className="color-input-box" value={rgb.b} onChange={(e) => handleInputChange('b', e.target.value)} />
            </>
          )}
          {mode === 'hsl' && (
            <>
              <input type="number" min="0" max="360" className="color-input-box" value={hsl.h} onChange={(e) => handleInputChange('h', e.target.value)} />
              <input type="number" min="0" max="100" className="color-input-box" value={hsl.s} onChange={(e) => handleInputChange('s', e.target.value)} />
              <input type="number" min="0" max="100" className="color-input-box" value={hsl.l} onChange={(e) => handleInputChange('l', e.target.value)} />
            </>
          )}
          <div className="alpha-group">
            <input type="number" min="0" max="100" className="color-input-box alpha-input" value={alphaPct} onChange={(e) => {
              const a = Math.max(0, Math.min(100, Number(e.target.value))) / 100;
              const newC = colord(localColor).alpha(a);
              handleColorChange(newC.toHex());
            }} />
            <span className="alpha-symbol">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerPopover;
