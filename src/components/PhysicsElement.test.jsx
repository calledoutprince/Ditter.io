/**
 * Smoke tests for the PhysicsElement component
 *
 * Strategy: Since PhysicsElement tightly couples to Matter.js (which accesses
 * browser-specific APIs), we mock the entire 'matter-js' module.
 * We test using pure React + ReactDOM to avoid @testing-library ESM conflicts.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PhysicsElement from './PhysicsElement.jsx';

// ─── Mock matter-js ───────────────────────────────────────────────────────────
vi.mock('matter-js', () => {
  const mockBody = { position: { x: 100, y: 200 }, angle: 0 };
  return {
    default: {
      Bodies: { rectangle: vi.fn(() => mockBody) },
      Composite: { add: vi.fn(), remove: vi.fn() },
      Body: { applyForce: vi.fn() },
      Events: { on: vi.fn(), off: vi.fn() },
    },
  };
});

const mockEngine = { world: {} };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PhysicsElement', () => {
  let container;
  let root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    container.remove();
    container = null;
  });

  // Helper to render and wait for React 19 to flush
  const renderRender = async (element) => {
    return new Promise(resolve => {
      root.render(<div ref={() => resolve()}>{element}</div>);
    });
  };

  it('renders without crashing and outputs children', async () => {
    await renderRender(
      <PhysicsElement engine={mockEngine} x={100} y={200}>
        <span id="child">Canvas Node</span>
      </PhysicsElement>
    );
    const child = container.querySelector('#child');
    expect(child).not.toBeNull();
    expect(child.textContent).toBe('Canvas Node');
  });

  it('renders multiple children', async () => {
    await renderRender(
      <PhysicsElement engine={mockEngine} x={50} y={50}>
        <span id="a">A</span>
        <span id="b">B</span>
      </PhysicsElement>
    );
    expect(container.querySelector('#a')).not.toBeNull();
    expect(container.querySelector('#b')).not.toBeNull();
  });

  it('applies position: absolute to the wrapper div', async () => {
    await renderRender(
      <PhysicsElement engine={mockEngine} x={100} y={200}>
        <div id="target">Node</div>
      </PhysicsElement>
    );
    const wrapper = container.querySelector('#target').parentElement;
    expect(wrapper.style.position).toBe('absolute');
  });

  it('applies willChange: transform for GPU optimisation', async () => {
    await renderRender(
      <PhysicsElement engine={mockEngine} x={0} y={0}>
        <div id="target">Node</div>
      </PhysicsElement>
    );
    const wrapper = container.querySelector('#target').parentElement;
    expect(wrapper.style.willChange).toBe('transform');
  });

  it('renders gracefully when no engine is provided', async () => {
    await renderRender(
      <PhysicsElement engine={null} x={0} y={0}>
        <span id="safe">Safe</span>
      </PhysicsElement>
    );
    expect(container.querySelector('#safe')).not.toBeNull();
  });
});
