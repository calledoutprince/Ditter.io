/**
 * @fileoverview Physics-backed canvas element wrapper for Ditter.io.
 *
 * `PhysicsElement` bridges React's render tree with a Matter.js rigid body.
 * Each instance creates one rectangular body in the shared physics world,
 * synchronises its DOM position to the body's simulated position on every
 * engine tick, and handles pointer-driven drag interactions (temporarily
 * making the body static while held, re-enabling physics on release).
 *
 * @module PhysicsElement
 */

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

/**
 * @typedef {Object} CameraState
 * @property {number} x - Canvas translation X in screen pixels.
 * @property {number} y - Canvas translation Y in screen pixels.
 * @property {number} z - Current zoom level (1 = 100%).
 */

/**
 * Renders a React subtree as a physics-simulated element on the infinite
 * canvas.
 *
 * **Lifecycle:**
 * 1. On mount, waits 50 ms for the child to be laid out, then reads its
 *    bounding rect to create a correctly sized Matter.js body at world
 *    coordinates `(x, y)`.
 * 2. An `afterUpdate` event listener on the engine updates the component's
 *    position state each simulation tick, driving the DOM position of the
 *    wrapper `div`.
 * 3. Pointer events implement drag: on `pointerdown` the body is made static
 *    so physics forces don't interfere; on `pointermove` the body is
 *    teleported to follow the cursor (accounting for the camera zoom);
 *    on `pointerup` the body is made dynamic again and given a small downward
 *    impulse to simulate a drop.
 * 4. On unmount the body is removed from the world and the event listener is
 *    unregistered.
 *
 * @param {Object}           props
 * @param {Matter.Engine}    props.engine   - The shared Matter.js engine
 *   provided by {@link module:usePhysics}.
 * @param {number}           props.x        - Initial world X coordinate for
 *   the body's centre.
 * @param {number}           props.y        - Initial world Y coordinate for
 *   the body's centre.
 * @param {CameraState}      props.camera   - Current camera state, used to
 *   convert screen-space drag deltas into world-space deltas.
 * @param {React.ReactNode}  props.children - Content to render inside the
 *   physics wrapper (typically a dithered `<img>`).
 * @returns {React.ReactElement} A `framer-motion` `div` positioned absolutely
 *   in the canvas world space, containing `children`.
 */
const PhysicsElement = ({ engine, x, y, children, camera }) => {
    const elementRef = useRef(null);
    const bodyRef = useRef(null);
    const [position, setPosition] = useState({ x, y, angle: 0 });
    
    /** Tracks pointer drag state across multiple pointer events. */
    const dragInfo = useRef({ active: false, startX: 0, startY: 0, bodyX: 0, bodyY: 0 });

    // ── Create & remove the physics body ─────────────────────────────────────

    useEffect(() => {
        if (!engine || !elementRef.current) return;

        const timer = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            
            // Create body based on measured dimensions
            const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
                restitution: 0.9,
                friction: 0.1,
                frictionAir: 0.05,
                render: { visible: false } 
            });
            
            bodyRef.current = body;
            Matter.Composite.add(engine.world, body);

            // Give it a gentle random nudge so it drifts naturally
            Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05
            });

        }, 50); // Wait for layout measurement

        return () => {
            clearTimeout(timer);
            if (engine && bodyRef.current) {
                Matter.Composite.remove(engine.world, bodyRef.current);
            }
        };
    }, [engine, x, y]);

    // ── Sync DOM position to physics body each tick ───────────────────────────

    useEffect(() => {
        if (!engine) return;

        const updatePosition = () => {
            if (bodyRef.current) {
                setPosition({
                    x: bodyRef.current.position.x,
                    y: bodyRef.current.position.y,
                    angle: bodyRef.current.angle
                });
            }
        };

        Matter.Events.on(engine, 'afterUpdate', updatePosition);

        return () => {
            Matter.Events.off(engine, 'afterUpdate', updatePosition);
        };
    }, [engine]);

    // ── Drag handlers ─────────────────────────────────────────────────────────

    /**
     * Captures the pointer, freezes the body's physics, and records the drag
     * start position.
     *
     * @param {React.PointerEvent} e
     */
    const handlePointerDown = (e) => {
        document.body.style.cursor = 'grabbing';
        e.stopPropagation(); // prevent canvas pan
        e.currentTarget.setPointerCapture(e.pointerId);
        
        dragInfo.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            bodyX: bodyRef.current.position.x,
            bodyY: bodyRef.current.position.y
        };
        
        // Freeze in place while dragging
        Matter.Body.setStatic(bodyRef.current, true);
        Matter.Body.setAngularVelocity(bodyRef.current, 0);
        Matter.Body.setVelocity(bodyRef.current, { x: 0, y: 0 });
    };

    /**
     * Teleports the physics body to follow the pointer, converting the
     * screen-space delta to world space using `camera.z`.
     *
     * @param {React.PointerEvent} e
     */
    const handlePointerMove = (e) => {
        if (!dragInfo.current.active || !camera) return;
        
        const dx = (e.clientX - dragInfo.current.startX) / camera.z;
        const dy = (e.clientY - dragInfo.current.startY) / camera.z;
        
        Matter.Body.setPosition(bodyRef.current, {
            x: dragInfo.current.bodyX + dx,
            y: dragInfo.current.bodyY + dy
        });
    };

    /**
     * Releases the pointer capture, re-enables physics simulation on the body,
     * and applies a small downward impulse to simulate a drop.
     *
     * @param {React.PointerEvent} e
     */
    const handlePointerUp = (e) => {
        document.body.style.cursor = '';
        e.currentTarget.releasePointerCapture(e.pointerId);
        dragInfo.current.active = false;
        
        Matter.Body.setStatic(bodyRef.current, false);
        // Add a slight bounce when dropped to simulate hitting the ground slightly
        Matter.Body.applyForce(bodyRef.current, bodyRef.current.position, {
            x: 0,
            y: 0.02
        });
    };

    return (
        <motion.div 
            ref={elementRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            animate={{ 
                rotate: (position.angle * 180) / Math.PI
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ 
                position: 'absolute',
                left: Math.round(position.x),
                top: Math.round(position.y),
                x: '-50%',
                y: '-50%',
                pointerEvents: 'auto', 
                userSelect: 'none',   
                willChange: 'transform' 
            }}
        >
            {children}
        </motion.div>
    );
};

export default PhysicsElement;
