import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export function usePhysics() {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 } // Zero gravity
    });
    
    engineRef.current = engine;

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Initial boundaries
    const updateBoundaries = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const wallOptions = { 
        isStatic: true,
        render: { visible: false }
      };

      const ground = Matter.Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions);
      const ceiling = Matter.Bodies.rectangle(width / 2, -50, width, 100, wallOptions);
      const leftWall = Matter.Bodies.rectangle(-50, height / 2, 100, height, wallOptions);
      const rightWall = Matter.Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions);

      // Clear old boundaries, add new
      const currentBodies = Matter.Composite.allBodies(engine.world);
      const staticBodies = currentBodies.filter(b => b.isStatic);
      Matter.Composite.remove(engine.world, staticBodies);
      Matter.Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);
    };

    updateBoundaries();
    window.addEventListener('resize', updateBoundaries);

    // Cursor Repulsion logic
    const handleMouseMove = (e) => {
        const mousePosition = { x: e.clientX, y: e.clientY };
        const bodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);
        
        bodies.forEach(body => {
            const distanceX = body.position.x - mousePosition.x;
            const distanceY = body.position.y - mousePosition.y;
            const distanceSq = distanceX * distanceX + distanceY * distanceY;
            
            // Interaction radius squared
            if (distanceSq < 40000) { 
                const forceMagnitude = 0.05 * (1 - distanceSq / 40000); // Inverse relation
                const angle = Math.atan2(distanceY, distanceX);
                
                Matter.Body.applyForce(body, body.position, {
                    x: Math.cos(angle) * forceMagnitude,
                    y: Math.sin(angle) * forceMagnitude
                });
            }
        });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      window.removeEventListener('resize', updateBoundaries);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const addElement = (width, height, x, y) => {
       if (!engineRef.current) return;
       const body = Matter.Bodies.rectangle(x, y, width, height, {
           restitution: 0.9, // Bounciness
           friction: 0.1,
           frictionAir: 0.05, // Slight drag so they don't float forever infinitely fast
       });
       Matter.Composite.add(engineRef.current.world, body);
       
       // Give it an initial random nudge
       Matter.Body.applyForce(body, body.position, {
           x: (Math.random() - 0.5) * 0.05,
           y: (Math.random() - 0.5) * 0.05
       });

       return body;
  };

  const removeElement = (body) => {
      if (!engineRef.current || !body) return;
      Matter.Composite.remove(engineRef.current.world, body);
  };

  return { engine: engineRef.current, addElement, removeElement };
}
