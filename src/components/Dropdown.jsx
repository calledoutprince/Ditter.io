import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({ options, value, onChange, placeholder = "Select...", width = "100%" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown" ref={dropdownRef} style={{ width }}>
      <button 
        className="dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="dropdown-label">{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{type: 'spring', stiffness: 300, damping: 20}}>
          <ChevronDown size={14} color="var(--text-muted)" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                className={`dropdown-item ${value === option.value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
                disabled={option.disabled}
              >
                <span>{option.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {option.tag && (
                    <span className="dropdown-tag">{option.tag}</span>
                  )}
                  {value === option.value && !option.disabled && <Check size={14} color="var(--accent-blue)" />}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
