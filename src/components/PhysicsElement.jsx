import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

// Renders a React child attached to a Matter.js physical body
const PhysicsElement = ({ engine, x, y, children }) => {
    const elementRef = useRef(null);
    const bodyRef = useRef(null);
    const [position, setPosition] = useState({ x, y, angle: 0 });

    useEffect(() => {
        if (!engine || !elementRef.current) return;

        // Small delay to ensure child DOM nodes are measured correctly
        const timer = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            
            // Create body based on measured dimensions
            const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
                restitution: 0.9,
                friction: 0.1,
                frictionAir: 0.05,
                render: { visible: false } // We render via React DOM
            });
            
            bodyRef.current = body;
            Matter.Composite.add(engine.world, body);

            // Initial nudge
            Matter.Body.applyForce(body, body.position, {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05
            });

        }, 50);

        return () => {
            clearTimeout(timer);
            if (engine && bodyRef.current) {
                Matter.Composite.remove(engine.world, bodyRef.current);
            }
        };
    }, [engine, x, y]);

    // Update DOM position on Matter.js render tick
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

    return (
        <div 
            ref={elementRef}
            style={{ 
                position: 'absolute',
                left: Math.round(position.x),
                top: Math.round(position.y),
                transform: `translate(-50%, -50%) rotate(${position.angle}rad)`,
                pointerEvents: 'auto', // Allow clicks and focus on elements
                userSelect: 'none',   // Prevent text selection while dragging
                willChange: 'transform' // GPU optimization
            }}
        >
            {children}
        </div>
    );
};

export default PhysicsElement;
