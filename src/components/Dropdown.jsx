/**
 * @fileoverview Animated custom dropdown component for Ditter.io.
 *
 * A lightweight, accessible replacement for the native `<select>` element
 * styled to match the brutalist panel aesthetic.  Uses Framer Motion for the
 * open/close animation and closes automatically when the user clicks outside
 * the component.
 *
 * @module Dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * @typedef {Object} DropdownOption
 * @property {string} label - Human-readable display text shown in the trigger
 *   button and the menu item.
 * @property {*}      value - The value emitted by `onChange` when this option
 *   is selected.  May be any type (string, number, etc.).
 */

/**
 * Controlled dropdown selector with animated open/close transitions.
 *
 * **Behaviour:**
 * - Clicking the trigger button toggles the dropdown menu.
 * - Clicking an item calls `onChange` with the item's `value` and closes the
 *   menu.
 * - Clicking anywhere outside the component closes the menu (via a
 *   `mousedown` listener on `document`).
 * - The chevron icon rotates 180° when the menu is open.
 * - The currently selected item displays a checkmark icon.
 *
 * **Styling:** Applies the `.custom-dropdown`, `.dropdown-trigger`,
 * `.dropdown-menu`, and `.dropdown-item` CSS classes defined in `index.css`.
 *
 * @param {Object}            props
 * @param {DropdownOption[]}  props.options      - List of selectable options.
 * @param {*}                 props.value        - The currently selected value.
 *   Should match the `value` property of one of `options`.
 * @param {function(*): void} props.onChange     - Callback invoked with the
 *   selected option's `value` when the user makes a selection.
 * @param {string}            [props.placeholder='Select...']
 *   - Text shown in the trigger when no option matches `value`.
 * @param {string}            [props.width='100%']
 *   - CSS width of the dropdown container.  Pass a fixed value such as
 *   `"100px"` when placing alongside another dropdown in a flex row.
 * @returns {React.ReactElement} The dropdown container including trigger and
 *   animated menu.
 *
 * @example
 * <Dropdown
 *   options={[{ label: 'SVG', value: 'svg' }, { label: 'Figma', value: 'figma' }]}
 *   value={exportFormat}
 *   onChange={setExportFormat}
 * />
 */
const Dropdown = ({ options, value, onChange, placeholder = "Select...", width = "100%" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close menu when user clicks outside the component
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
        {/* Chevron rotates 180° when open */}
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
                className={`dropdown-item ${value === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} color="var(--accent-blue)" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
