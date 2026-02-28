/**
 * Smoke tests for the PhysicsElement component
 *
 * Strategy: Since PhysicsElement tightly couples to Matter.js (which accesses
 * browser-specific APIs like WebGL), we mock the entire 'matter-js' module.
 * This lets us verify that the React component renders children correctly
 * and respects its positioning props — without needing a real physics engine.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhysicsElement from './PhysicsElement.jsx';

// ─── Mock matter-js ───────────────────────────────────────────────────────────
// We prevent all Matter.js calls from executing during tests.
// The component still mounts and unmounts cleanly.

vi.mock('matter-js', () => {
  const mockBody = {
    position: { x: 100, y: 200 },
    angle: 0,
  };

  return {
    default: {
      Bodies: {
        rectangle: vi.fn(() => mockBody),
      },
      Composite: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      Body: {
        applyForce: vi.fn(),
      },
      Events: {
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  };
});

// ─── Minimal fake Matter.js engine ────────────────────────────────────────────
const mockEngine = {
  world: {},
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PhysicsElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <PhysicsElement engine={mockEngine} x={100} y={200}>
        <span>Hello</span>
      </PhysicsElement>
    );
    // If we get here without throwing, the component mounted successfully
  });

  it('renders its children', () => {
    render(
      <PhysicsElement engine={mockEngine} x={100} y={200}>
        <span data-testid="child">Canvas Node</span>
      </PhysicsElement>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Canvas Node');
  });

  it('renders multiple children', () => {
    render(
      <PhysicsElement engine={mockEngine} x={50} y={50}>
        <span data-testid="a">A</span>
        <span data-testid="b">B</span>
      </PhysicsElement>
    );
    expect(screen.getByTestId('a')).toBeInTheDocument();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });

  it('applies position: absolute to the wrapper div', () => {
    const { container } = render(
      <PhysicsElement engine={mockEngine} x={100} y={200}>
        <div>Node</div>
      </PhysicsElement>
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ position: 'absolute' });
  });

  it('applies willChange: transform for GPU optimisation', () => {
    const { container } = render(
      <PhysicsElement engine={mockEngine} x={0} y={0}>
        <div>Node</div>
      </PhysicsElement>
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ willChange: 'transform' });
  });

  it('renders gracefully when no engine is provided', () => {
    // Should not throw — the component guards with `if (!engine) return`
    render(
      <PhysicsElement engine={null} x={0} y={0}>
        <span data-testid="safe">Safe</span>
      </PhysicsElement>
    );
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });
});
