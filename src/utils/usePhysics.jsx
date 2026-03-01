/**
 * @fileoverview Matter.js physics engine integration for Ditter.io.
 *
 * Provides a React hook that boots a shared Matter.js engine and runner,
 * sets up a large (10 000 × 10 000 px) bounded world suitable for the
 * infinite canvas, and exposes helpers for adding/removing dynamic bodies.
 *
 * @module usePhysics
 */

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

/**
 * @typedef {Object} PhysicsAPI
 * @property {Matter.Engine|null} engine      - The live Matter.js engine
 *   instance.  `null` during the initial render cycle before the engine has
 *   been created.
 * @property {function(number, number, number, number): Matter.Body|undefined} addElement
 *   - Adds a rectangular dynamic body to the physics world and gives it a
 *     small random impulse so it drifts gently across the canvas.
 * @property {function(Matter.Body): void} removeElement
 *   - Removes a body from the physics world.
 */

/**
 * Initialises and manages a shared Matter.js physics engine for the Ditter.io
 * infinite canvas.
 *
 * The engine runs with **zero gravity** (`{ x: 0, y: 0, scale: 0 }`) so
 * elements float freely and only interact through collisions and manually
 * applied forces.  Four static bounding walls enclose a 10 000 × 10 000 px
 * world — large enough that users never visibly hit the edges during normal
 * canvas use.
 *
 * The runner and engine are cleaned up automatically when the component that
 * calls this hook unmounts.
 *
 * @returns {PhysicsAPI} An object containing the engine instance and element
 *   management helpers.
 *
 * @example
 * const { engine, addElement, removeElement } = usePhysics();
 *
 * // Later, once we know the element's rendered size:
 * const body = addElement(200, 150, worldX, worldY);
 *
 * // On cleanup:
 * removeElement(body);
 */
export function usePhysics() {
  const [engineState, setEngineState] = useState(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);

  useEffect(() => {
    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 } // Zero gravity
    });
    
    engineRef.current = engine;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEngineState(engine);

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Initial massive boundaries for "infinite" canvas
    const updateBoundaries = () => {
      const wallOptions = { 
        isStatic: true,
        render: { visible: false }
      };

      // Create a 10000 x 10000 world
      const size = 10000;
      const thick = 500;

      const ground    = Matter.Bodies.rectangle(0,       size/2,  size,  thick, wallOptions);
      const ceiling   = Matter.Bodies.rectangle(0,      -size/2,  size,  thick, wallOptions);
      const leftWall  = Matter.Bodies.rectangle(-size/2, 0,       thick, size,  wallOptions);
      const rightWall = Matter.Bodies.rectangle(size/2,  0,       thick, size,  wallOptions);

      // Clear old boundaries, add new
      const currentBodies = Matter.Composite.allBodies(engine.world);
      const staticBodies = currentBodies.filter(b => b.isStatic);
      Matter.Composite.remove(engine.world, staticBodies);
      Matter.Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);
    };

    updateBoundaries();


    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []);

  /**
   * Adds a rectangular Matter.js body to the world at the specified world
   * coordinates, then kicks it with a tiny random impulse so it drifts.
   *
   * @param {number} width  - Body width in world pixels.
   * @param {number} height - Body height in world pixels.
   * @param {number} x      - Initial centre X in world space.
   * @param {number} y      - Initial centre Y in world space.
   * @returns {Matter.Body|undefined} The created body, or `undefined` if the
   *   engine has not yet initialised.
   */
  const addElement = (width, height, x, y) => {
       if (!engineRef.current) return;
       const body = Matter.Bodies.rectangle(x, y, width, height, {
           restitution: 0.9, // Bounciness
           friction: 0.1,
           frictionAir: 0.05, // Slight drag
       });
       Matter.Composite.add(engineRef.current.world, body);
       
       Matter.Body.applyForce(body, body.position, {
           x: (Math.random() - 0.5) * 0.05,
           y: (Math.random() - 0.5) * 0.05
       });

       return body;
  };

  /**
   * Removes a body from the physics world so it no longer participates in
   * collision detection or simulation.
   *
   * @param {Matter.Body} body - The Matter.js body to remove.  No-op if
   *   `body` is falsy or the engine has not yet initialised.
   * @returns {void}
   */
  const removeElement = (body) => {
      if (!engineRef.current || !body) return;
      Matter.Composite.remove(engineRef.current.world, body);
  };

  return { engine: engineState, addElement, removeElement };
}
