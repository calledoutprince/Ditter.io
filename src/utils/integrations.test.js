/**
 * Tests for src/utils/integrations.js
 *
 * We test three pure functions here:
 *  - hexToFigmaColor (indirectly, via constructFigmaPayload)
 *  - constructFigmaPayload
 *  - constructFramerComponent
 *
 * Note: hexToFigmaColor is not exported (it's a module-private helper),
 * so we test it indirectly through the public API that calls it.
 */
import { describe, it, expect } from 'vitest';
import { constructFigmaPayload, constructFramerComponent } from './integrations.js';

// ─── constructFigmaPayload ────────────────────────────────────────────────────

describe('constructFigmaPayload', () => {
  const samplePath = 'M0 0 L100 100 Z';
  const width = 200;
  const height = 150;
  const color = '#ff4500';

  it('returns a string', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(typeof result).toBe('string');
  });

  it('contains a figmeta comment block (Figma clipboard trigger)', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(result).toContain('(figmeta)');
  });

  it('embeds a valid SVG element', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('includes the provided hex color in the SVG fill', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(result).toContain(color);
  });

  it('includes the path data inside the SVG', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(result).toContain(samplePath);
  });

  it('sets the correct viewBox dimensions', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    expect(result).toContain(`viewBox="0 0 ${width} ${height}"`);
  });

  it('contains a base64-encoded figmeta JSON blob', () => {
    const result = constructFigmaPayload(samplePath, width, height, color);
    // The figmeta block format is: <!--(figmeta)BASE64_JSON-->
    const match = result.match(/\(figmeta\)([A-Za-z0-9+/=]+)-->/);
    expect(match).not.toBeNull();

    // Decoded JSON should contain pasteID and fileKey
    const decoded = JSON.parse(atob(match[1]));
    expect(decoded).toHaveProperty('pasteID');
    expect(decoded).toHaveProperty('fileKey');
    expect(decoded).toHaveProperty('isScene', true);
  });
});

// ─── constructFramerComponent ─────────────────────────────────────────────────

describe('constructFramerComponent', () => {
  const samplePath = 'M10 20 L30 40 Z';
  const color = '#00bfff';

  it('returns a string', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(typeof result).toBe('string');
  });

  it('includes a valid React default export', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(result).toContain('export default function DitherAsset');
  });

  it('registers Framer property controls', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(result).toContain('addPropertyControls');
    expect(result).toContain('ControlType.Color');
  });

  it('embeds the SVG path data', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(result).toContain(samplePath);
  });

  it('uses the provided accent hex color as the defaultValue', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(result).toContain(color);
  });

  it('uses currentColor for fill (honours Framer prop)', () => {
    const result = constructFramerComponent(samplePath, color);
    expect(result).toContain('fill="currentColor"');
  });
});
