import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const PhysicsElement = ({ engine, x, y, children, camera, isSelected = false, onClick }) => {
    const elementRef = useRef(null);
    const bodyRef = useRef(null);
    const [position, setPosition] = useState({ x, y, angle: 0 });
    const dragInfo = useRef({ active: false, startX: 0, startY: 0, bodyX: 0, bodyY: 0 });

    useEffect(() => {
        if (!engine || !elementRef.current) return;

        const timer = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            
            const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
                restitution: 0.9,
                friction: 0.1,
                frictionAir: 0.05,
                render: { visible: false } 
            });
            
            bodyRef.current = body;
            Matter.Composite.add(engine.world, body);

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

    const handlePointerDown = (e) => {
        document.body.style.cursor = 'grabbing';
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        
        dragInfo.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            bodyX: bodyRef.current.position.x,
            bodyY: bodyRef.current.position.y
        };
        
        Matter.Body.setStatic(bodyRef.current, true);
        Matter.Body.setAngularVelocity(bodyRef.current, 0);
        Matter.Body.setVelocity(bodyRef.current, { x: 0, y: 0 });
    };

    const handlePointerMove = (e) => {
        if (!dragInfo.current.active || !camera) return;
        
        const dx = (e.clientX - dragInfo.current.startX) / camera.z;
        const dy = (e.clientY - dragInfo.current.startY) / camera.z;
        
        Matter.Body.setPosition(bodyRef.current, {
            x: dragInfo.current.bodyX + dx,
            y: dragInfo.current.bodyY + dy
        });
    };

    const handlePointerUp = (e) => {
        document.body.style.cursor = '';
        e.currentTarget.releasePointerCapture(e.pointerId);
        dragInfo.current.active = false;
        
        Matter.Body.setStatic(bodyRef.current, false);
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
            onClick={onClick}
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
                willChange: 'transform',
                outline: isSelected ? '2px solid var(--accent-blue)' : 'none',
                outlineOffset: '4px',
                borderRadius: '2px',
            }}
        >
            {children}
        </motion.div>
    );
};

export default PhysicsElement;
