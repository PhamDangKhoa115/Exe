import { useId, useLayoutEffect, useRef, useState } from "react";
import GlideSelect from "./GlideSelect";
import "./SelectionEffects.css";

// Keep the native select as the form field and dispatch its real change event.
export default function GlideSelectField({ children, ...props }) {
  const nativeRef = useRef(null);
  const generatedId = useId();
  const [presentation, setPresentation] = useState(null);
  useLayoutEffect(() => {
    const select = nativeRef.current;
    if (!select) return;
    const css = getComputedStyle(select);
    const options = [...select.options].map(option => ({ value: option.value, label: option.textContent }));
    const label = props['aria-label'] || (props.id && document.getElementById(props.id)?.labels?.[0]?.textContent?.trim()) || select.labels?.[0]?.textContent?.trim();
    setPresentation(previous => ({
      options, label: label || previous?.label || options[0]?.label || 'Select',
      style: previous?.style || {
        background: css.backgroundColor, color: css.color, border: css.border,
        borderRadius: css.borderRadius, font: css.font, padding: css.padding,
        minHeight: css.height, width: '100%',
      },
    }));
  }, [children, props['aria-label']]);
  // Multi-select and native validation retain the browser's complete interaction.
  if (props.multiple || props.size > 1 || props.required) return <select {...props}>{children}</select>;
  const selectId = props.id || generatedId;
  return (
    <span className="sclub-glide-field">
      <select {...props} id={presentation ? undefined : selectId} ref={nativeRef}
        className={`${props.className || ''} ${presentation ? 'sclub-glide-native' : ''}`}
        aria-hidden={presentation ? true : undefined} tabIndex={presentation ? -1 : props.tabIndex}>
        {children}
      </select>
      {presentation && <GlideSelect
        options={presentation.options}
        value={String(props.value ?? nativeRef.current?.value ?? '')}
        disabled={props.disabled}
        ariaLabel={presentation.label}
        triggerId={selectId}
        triggerStyle={presentation.style}
        className="sclub-glide-control"
        size="lg" surfaceColor="#ffffff" highlightColor="#ede9fe" textColor="#111827" accentColor="#6d28d9"
        onChange={value => {
          const select = nativeRef.current;
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, value);
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }}
      />}
    </span>
  );
}
