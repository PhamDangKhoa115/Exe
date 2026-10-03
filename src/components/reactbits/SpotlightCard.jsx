// Adapted from React Bits SpotlightCard. See LICENSE.md and README.md.
import { useRef } from "react";
import "./SpotlightCard.css";

export default function SpotlightCard({
  as: Component = "div",
  children,
  className = "",
  spotlightColor = "rgba(139, 92, 246, 0.22)",
  onMouseMove,
  ...props
}) {
  const elementRef = useRef(null);
  function handleMouseMove(event) {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const rect = elementRef.current.getBoundingClientRect();
      elementRef.current.style.setProperty("--mouse-x", event.clientX - rect.left + "px");
      elementRef.current.style.setProperty("--mouse-y", event.clientY - rect.top + "px");
      elementRef.current.style.setProperty("--spotlight-color", spotlightColor);
    }
    onMouseMove?.(event);
  }
  return (
    <Component {...props} ref={elementRef} onMouseMove={handleMouseMove} className={"rb-spotlight " + className}>
      {children}
    </Component>
  );
}

