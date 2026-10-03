// Adapted from React Bits ClickSpark. See LICENSE.md and README.md.
import { useCallback, useEffect, useRef } from "react";

export default function ClickSpark({
  sparkColor = "#c4b5fd",
  sparkSize = 8,
  sparkRadius = 22,
  sparkCount = 8,
  duration = 450,
  children,
  className = "",
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const frameRef = useRef(null);
  const draw = useCallback(function paint(timestamp) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) return false;
      const progress = elapsed / duration;
      const eased = progress * (2 - progress);
      const distance = eased * sparkRadius;
      const length = sparkSize * (1 - eased);
      context.strokeStyle = sparkColor;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
      context.lineTo(spark.x + (distance + length) * Math.cos(spark.angle), spark.y + (distance + length) * Math.sin(spark.angle));
      context.stroke();
      return true;
    });
    // Render only while sparks exist, rather than running an idle animation loop.
    frameRef.current = sparksRef.current.length ? requestAnimationFrame(paint) : null;
  }, [duration, sparkRadius, sparkSize, sparkColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const clear = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      sparksRef.current = [];
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    };
    const visibility = () => { if (document.hidden) clear(); };
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clear();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  function handleClick(event) {
    if (!event.target.closest("button:not(:disabled), a[href]") || event.detail === 0 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = performance.now();
    sparksRef.current.push(...Array.from({ length: sparkCount }, (_, index) => ({
      x: event.clientX, y: event.clientY, angle: 2 * Math.PI * index / sparkCount, startTime: now,
    })));
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(draw);
  }
  return (
    <div className={className} onClick={handleClick}>
      <canvas ref={canvasRef} className="rb-click-spark" aria-hidden="true" />
      {children}
    </div>
  );
}

