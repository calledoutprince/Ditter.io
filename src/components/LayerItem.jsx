import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftName(layer.name);
  }, [layer.name]);

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
      onRenameCommit(layer.name);
    }
    e.stopPropagation();
  };

  return (
    <div
      className={`layer-item${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
    >
      <div className="layer-thumb">
        {layer.processedUrl ? (
          <img src={layer.processedUrl} alt={layer.name} draggable={false} />
        ) : (
          <div className="layer-thumb-placeholder" />
        )}
      </div>

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
