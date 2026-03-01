/**
 * @fileoverview LayerItem — a single row in the Layers list.
 *
 * Shows a thumbnail of the processed image, the layer's name (editable inline
 * on double-click or F2), and an eye/visibility toggle icon. The row
 * highlights with a blue accent when it is the selected layer.
 *
 * @module LayerItem
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * @param {Object}   props
 * @param {Object}   props.layer          - The layer data object.
 * @param {boolean}  props.isSelected     - Whether this layer is currently selected.
 * @param {boolean}  props.isRenaming     - Whether this layer is in inline-rename mode.
 * @param {function} props.onSelect       - Called when the row is clicked.
 * @param {function} props.onVisibilityToggle - Called to toggle `layer.visible`.
 * @param {function} props.onRenameCommit - Called with new name string to commit rename.
 * @param {function} props.onRenameStart  - Called to enter rename mode via double-click.
 */
const LayerItem = ({
  layer,
  isSelected,
  isRenaming,
  onSelect,
  onVisibilityToggle,
  onRenameCommit,
  onRenameStart,
}) => {
  const [draftName, setDraftName] = useState(layer.name);
  const inputRef = useRef(null);

  // Sync draft name when the layer name is updated externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftName(layer.name);
  }, [layer.name]);

  // Auto-focus + select-all when rename starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    const trimmed = draftName.trim();
    onRenameCommit(trimmed || layer.name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setDraftName(layer.name);
      onRenameCommit(layer.name); // cancel — keep original
    }
    e.stopPropagation(); // Prevent Delete key from deleting layer while typing
  };

  return (
    <div
      className={`layer-item${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
    >
      {/* Thumbnail */}
      <div className="layer-thumb">
        {layer.processedUrl ? (
          <img src={layer.processedUrl} alt={layer.name} draggable={false} />
        ) : (
          <div className="layer-thumb-placeholder" />
        )}
      </div>

      {/* Name — editable or static */}
      {isRenaming ? (
        <input
          ref={inputRef}
          className="layer-name-input"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="layer-name">{layer.name}</span>
      )}

      {/* Visibility toggle */}
      <button
        className={`layer-eye${layer.visible ? '' : ' hidden'}`}
        onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
    </div>
  );
};

export default LayerItem;
