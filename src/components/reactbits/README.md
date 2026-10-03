# React Bits components

Source: https://github.com/DavidHDev/react-bits (retrieved 2026-10-03).
Components use the upstream JavaScript + CSS variant and are licensed under
MIT + Commons Clause; the complete upstream notice is in LICENSE.md.

- StarBorder: scoped CSS classes and span markup to preserve valid button/link
  content; decoration is aria-hidden and disabled by reduced-motion.
- SpotlightCard: supports semantic element types and forwards existing props
  and event handlers; no overflow clipping, so menus and fixed modals remain usable.
- ClickSpark: uses viewport coordinates and a fixed, pointer-transparent canvas;
  animates only during clicks on enabled controls, cleans up frames/listeners,
  pauses in hidden tabs and respects reduced-motion.

StrokeText and GradientText were supplied by the user (JavaScript + CSS).
They use gsap and motion respectively; landing integration preserves the existing
heading dimensions and palette, uses semantic inline markup, and respects reduced motion.


- ShinyText: supplied React Bits source, uses existing motion and respects reduced motion.
- FallingText: supplied physics effect adapted for React icon children, with one Matter engine loop, resize handling, visibility pause and unmount cleanup. Uses matter-js; no canvas or duplicate Runner updates.

- GlideSelect: supplied JavaScript/CSS source with existing lucide-react icons;
  popup portal avoids clipping, keeps keyboard/typeahead and reduced-motion support.
- GlideSelectField: native select remains the form field; dispatches its real change
  event, preserves name/disabled/options, and retains native required/multiple controls.
- GlideList: gliding highlight around original navigation and dropdown actions.
- RubberSegment: adapted dilate/handoff/spring effect decorates original tab and view
  buttons, preserving their callbacks, conditional visibility and disabled states.
  Observers, subscriptions, timers and animations are cleaned up on unmount.
