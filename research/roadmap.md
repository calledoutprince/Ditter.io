# Ditter.io Roadmap

**A living document for the future of Ditter.io: a physics-driven dithering studio.**

---

## Phase 1: Core Dithering & Visual Enhancements (Next Up)

This phase focuses on expanding the core visual expression tools before moving into heavy workflow features.

- **3-Color Dithering**
  - Extract dominant colors from imported images to set defaults.
  - Expose a 3-color mapping system (Shadows, Midtones, Highlights) allowing users to override the extracted colors.
  - Ensure the effect renders live on the canvas.
- **Enhanced Render Targets**
  - **Text Layers**: Add support for rendering text with dithering applied. Integrate Google Fonts (or similar) to provide a robust default set of typography. Text should be toggleable to either sit _under_ the effects pipeline or float _above_ it cleanly.
- **Masks & Lenses**
  - Introduce "Area of focus" shapes (circles/rectangles).
  - These act as movable magnifying glasses/lenses over the canvas: the dithering effect is only applied _inside_ the shape, revealing the original image outside (or vice-versa).
  - Support setting shape fills to solid colors, gradients, images, or videos.
- **Additional Effects**
  - Research and implement new visual algorithms: Radial effects, Wave distortions, and an experimental "Ditter on Glass" optical effect.

---

## Phase 2: Animation & Motion

Bringing the static outputs to life through algorithmic motion.

- **Effect Animation Behaviors**
  - Animate the dithering patterns themselves.
  - Directions: Vertical (up/down), Horizontal (left/right), and Diagonal (all 4 ways).
- **Exporting Motion**
  - Built-in rendering engine to export animated canvas states.
  - Support exporting to MP4, WebM (for web transparency), and legacy GIFs.

---

## Phase 3: Workflow, Integrations & Context

Improving how Ditter.io fits into professional design workflows.

- **Figma / Framer / Affinity Integration**
  - Support direct clipboard pasting from external tools.
  - _Phase 3a_: Initial support as flattened raster images (predictable dithering).
  - _Phase 3b_: Investigate supporting editable vector layers from clipboard payloads.
- **Contextual Menus (Right-Click)**
  - Implement a custom canvas context menu.
  - Provide quick actions: Apply suggested effects, layer management, quick export, and component grouping.
- **Grouping ("Frames")**
  - Group layers (shapes, images, text) into "Frames" so they move as one rigid body in the physics engine and share effect boundaries.

---

## Phase 4: UX Polish & Persistence

Making the app reliable, immersive, and retentive.

- **Local Persistence (IndexedDB)**
  - Move beyond transient state. Auto-save the canvas layout, images, and effect parameters to the browser's IndexedDB.
  - Users can safely refresh or recover from a crash without losing their session.
- **Immersive Sound Design**
  - Implement a tactile, delightful UI sound system (using Web Audio API or a library like `howler.js`).
  - Triggers on key actions: First image import, dropping an element, toggling heavy effects, and copying to clipboard.
- **First-Time User Experience (FTUE)**
  - Design a beautiful, lightweight loading animation or onboarding state that introduces the physics/dithering concept immediately.

---

## Phase 5: Cloud & Community (Long Term)

Transitioning from a local studio to a platform.

- **Accounts & Freemium Model**
  - All core prototyping, local saving, and basic exports remain free and accessible without login.
  - Introduce User Accounts (via Supabase/Firebase) for premium features:
    - Cloud syncing of workspaces across devices.
    - Heavy video processing/rendering offloaded to the server.
    - Early access flags for experimental effects.

---
