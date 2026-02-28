import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export function usePhysics(cameraRef) {
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

    // Initial massive boundaries for "infinite" canvas
    const updateBoundaries = () => {
      const wallOptions = { 
        isStatic: true,
        render: { visible: false }
      };

      // Create a 10000 x 10000 world
      const size = 10000;
      const thick = 500;

      const ground = Matter.Bodies.rectangle(0, size/2, size, thick, wallOptions);
      const ceiling = Matter.Bodies.rectangle(0, -size/2, size, thick, wallOptions);
      const leftWall = Matter.Bodies.rectangle(-size/2, 0, thick, size, wallOptions);
      const rightWall = Matter.Bodies.rectangle(size/2, 0, thick, size, wallOptions);

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

  const removeElement = (body) => {
      if (!engineRef.current || !body) return;
      Matter.Composite.remove(engineRef.current.world, body);
  };

  return { engine: engineRef.current, addElement, removeElement };
}
