// Adapted from React Bits FallingText supplied by user; see LICENSE.md.
// React children support icons; one physics loop avoids duplicate engine updates.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import Matter from "matter-js";
import "./FallingText.css";

export default function FallingText({ children, trigger = "scroll", gravity = 0.56 }) {
  const rootRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (reducedMotion) return;
    if (trigger === "auto") { setStarted(true); return; }
    if (trigger !== "scroll") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [trigger, reducedMotion]);

  useEffect(() => {
    if (!started || reducedMotion) return;
    const root = rootRef.current;
    const { Engine, Bodies, Body, Composite } = Matter;
    let engine;
    let pairs = [];
    let frame;
    let previous;
    let lastSize = "";
    const stop = () => { cancelAnimationFrame(frame); frame = null; previous = null; };
    const draw = time => {
      frame = null;
      if (document.hidden) return;
      Engine.update(engine, previous ? Math.min(time - previous, 1000 / 60) : 1000 / 60);
      previous = time;
      pairs.forEach(({ node, body }) => {
        node.style.left = `${body.position.x}px`;
        node.style.top = `${body.position.y}px`;
        node.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      if (pairs.some(({ body }) => !body.isSleeping)) frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      if (!document.hidden && frame == null && pairs.some(({ body }) => !body.isSleeping)) frame = requestAnimationFrame(draw);
    };
    const reset = () => {
      const size = `${root.clientWidth}:${root.clientHeight}`;
      if (size === lastSize) return;
      lastSize = size;
      stop();
      if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
      const nodes = [...root.querySelectorAll("[data-falling-item]")];
      nodes.forEach(node => node.removeAttribute("style"));
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      engine = Engine.create({ enableSleeping: true });
      engine.gravity.y = gravity;
      pairs = nodes.map(node => {
        const item = node.getBoundingClientRect();
        const body = Bodies.rectangle(item.left - rect.left + item.width / 2, item.top - rect.top + item.height / 2, item.width, item.height, { restitution: 0.45, friction: 0.4, frictionAir: 0.025 });
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 0 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.035);
        node.style.width = `${item.width}px`;
        node.style.height = `${item.height}px`;
        node.style.position = "absolute";
        return { node, body };
      });
      const { width, height } = rect;
      Composite.add(engine.world, [
        Bodies.rectangle(width / 2, height + 25, width + 100, 50, { isStatic: true }),
        Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true }),
        Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true }),
        Bodies.rectangle(width / 2, -25, width + 100, 50, { isStatic: true }),
        ...pairs.map(({ body }) => body),
      ]);
      resume();
    };
    const visibility = () => { if (document.hidden) stop(); else resume(); };
    reset();
    const resize = new ResizeObserver(reset);
    resize.observe(root);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop(); resize.disconnect(); document.removeEventListener("visibilitychange", visibility);
      pairs.forEach(({ node }) => node.removeAttribute("style"));
      if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    };
  }, [started, reducedMotion, gravity]);

  return (
    <div ref={rootRef} className="rb-falling-icons" onMouseEnter={trigger === "hover" ? () => setStarted(true) : undefined} onClick={trigger === "click" ? () => setStarted(true) : undefined}>
      {Array.from(children).map((child, index) => <span data-falling-item key={child.key ?? index}>{child}</span>)}
    </div>
  );
}
