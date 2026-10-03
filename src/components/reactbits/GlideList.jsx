// React Bits GlideSelect highlight adapted to an existing vertical navigation list.
import { useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import "./SelectionEffects.css";
export default function GlideList({ children, className = "", as: Component = "nav" }) {
  const rootRef = useRef(null);
  const pillRef = useRef(null);
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    let animation;
    const move = target => {
      if (!target || !root.contains(target)) { pill.style.opacity = '0'; return; }
      const rect = root.getBoundingClientRect();
      const row = target.getBoundingClientRect();
      animation?.stop();
      pill.style.opacity = '1';
      animation = animate(pill, { top: row.top - rect.top + root.scrollTop, left: row.left - rect.left, width: row.width, height: row.height }, { duration: reduce ? 0 : .22, ease: [.23, 1, .32, 1] });
      pill.style.borderRadius = getComputedStyle(target).borderRadius;
    };
    const active = () => move(root.querySelector('a.active, button.active'));
    const hover = event => move(event.target.closest('a,button'));
    root.addEventListener('pointerover', hover);
    root.addEventListener('focusin', hover);
    root.addEventListener('pointerleave', active);
    const mutation = new MutationObserver(active);
    mutation.observe(root, {subtree:true, attributes:true, attributeFilter:['class']});
    const resize = new ResizeObserver(active); resize.observe(root);
    active();
    return () => {animation?.stop();mutation.disconnect();resize.disconnect();root.removeEventListener('pointerover',hover);root.removeEventListener('focusin',hover);root.removeEventListener('pointerleave',active);};
  }, [reduce]);
  return <Component ref={rootRef} className={`${className} sclub-glide-list`}>{children}<span ref={pillRef} className="sclub-glide-list-pill" aria-hidden="true" /></Component>;
}
