// Adapted from React Bits RubberSegment travel/dilate/relax animation supplied by user.
// Original buttons/links remain intact: permissions, callbacks and keyboard input are unchanged.
import { useLayoutEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import "./SelectionEffects.css";

export default function RubberSegment({ as: Component = "div", children, className = "", ...props }) {
  const rootRef = useRef(null);
  const pillRef = useRef(null);
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const reduce = useReducedMotion();
  const previous = useRef(null);
  const timer = useRef(null);
  const animations = useRef([]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    const cancel = () => {
      clearTimeout(timer.current);
      animations.current.forEach(animation => animation.stop());
      animations.current = [];
    };
    const paint = () => {
      pill.style.left = `${left.get()}px`;
      pill.style.width = `${Math.max(0, right.get() - left.get())}px`;
    };
    const removeLeft = left.on('change', paint);
    const removeRight = right.on('change', paint);
    const measure = (instant = false) => {
      const active = root.querySelector('button.active, a.active, [aria-selected="true"], [aria-checked="true"]');
      if (!active) { pill.style.opacity = '0'; previous.current = null; return; }
      const rect = root.getBoundingClientRect();
      const selected = active.getBoundingClientRect();
      const x = selected.left - rect.left + root.scrollLeft;
      const end = x + selected.width;
      const y = selected.top - rect.top + root.scrollTop;
      pill.style.top = `${y}px`;
      pill.style.height = `${selected.height}px`;
      pill.style.borderRadius = getComputedStyle(active).borderRadius;
      pill.style.opacity = '1';
      cancel();
      if (reduce || instant || previous.current === null) {
        left.jump(x); right.jump(end);
      } else if (previous.current !== active || Math.abs(left.get() - x) > 1 || Math.abs(right.get() - end) > 1) {
        animations.current = [
          animate(left, Math.min(left.get(), x), {duration: .19, ease: [.23, 1, .32, 1]}),
          animate(right, Math.max(right.get(), end), {duration: .19, ease: [.23, 1, .32, 1]}),
        ];
        timer.current = setTimeout(() => {
          animations.current = [
            animate(left, x, {type: 'spring', duration: .3, bounce: .15}),
            animate(right, end, {type: 'spring', duration: .3, bounce: .15}),
          ];
        }, 150);
      }
      previous.current = active;
      paint();
    };
    measure();
    const mutation = new MutationObserver(() => measure());
    mutation.observe(root, {subtree: true, attributes: true, attributeFilter: ['class','aria-selected','aria-checked'], childList: true});
    const resize = new ResizeObserver(() => measure(true));
    resize.observe(root);
    return () => { cancel(); mutation.disconnect(); resize.disconnect(); removeLeft(); removeRight(); };
  }, [left, right, reduce]);
  return <Component {...props} ref={rootRef} className={`${className} sclub-rubber-group`}>
    <span ref={pillRef} className="sclub-rubber-pill" aria-hidden="true" />
    {children}
  </Component>;
}
