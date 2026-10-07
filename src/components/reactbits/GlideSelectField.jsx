import { useId, useLayoutEffect, useRef, useState } from "react";
import GlideSelect from "./GlideSelect";
import "./SelectionEffects.css";

// Keep the native select as the form field and dispatch its real change event.
export default function GlideSelectField({ children, ...props }) {
  const nativeRef = useRef(null);
  const generatedId = useId();
  const [presentation, setPresentation] = useState(null);
  const [nativeValue, setNativeValue] = useState(String(props.defaultValue ?? ""));
  useLayoutEffect(() => {
    const select = nativeRef.current;
    if (!select) return;
    const css = getComputedStyle(select);
    const options = [...select.options].map(option => ({ value: option.value, label: option.label, disabled: option.disabled || (option.parentElement?.tagName === 'OPTGROUP' && option.parentElement.disabled) }));
    const label = props['aria-label'] || (props.id && document.querySelector(`label[for="${CSS.escape(props.id)}"]`)?.textContent?.trim()) || select.labels?.[0]?.textContent?.trim() || (select.parentElement?.previousElementSibling?.tagName === 'LABEL' ? select.parentElement.previousElementSibling.textContent.trim() : undefined);
    setNativeValue(select.value);
    setPresentation(previous => {
      const nextLabel = label || previous?.label || options[0]?.label || "Select";
      if (previous && previous.label === nextLabel && previous.options.length === options.length && previous.options.every((option, i) => option.value === options[i].value && option.label === options[i].label && option.disabled === options[i].disabled)) return previous;
      return {
        options, label: nextLabel,
        style: previous?.style || {
          background: css.backgroundColor, color: css.color, border: css.border,
          borderRadius: css.borderRadius, font: css.font, padding: css.padding,
          minHeight: css.height, width: '100%',
        },
      };
    });
  }, [children, props['aria-label'], props.id, props.value]);
  // Multi-select and native validation retain the browser's complete interaction.
  if (props.multiple || props.size > 1 || props.required) return <select {...props}>{children}</select>;
  const selectId = props.id || generatedId;
  return (
    <span className="sclub-glide-field">
      <select {...props} id={presentation ? undefined : selectId} ref={nativeRef}
        className={`${props.className || ''} ${presentation ? 'sclub-glide-native' : ''}`}
        aria-hidden={presentation ? true : undefined} tabIndex={presentation ? -1 : props.tabIndex}
        onChange={event => { setNativeValue(event.target.value); props.onChange?.(event); }}>
        {children}
      </select>
      {presentation && <GlideSelect
        options={presentation.options}
        value={String(props.value ?? nativeValue)}
        disabled={props.disabled}
        ariaLabel={presentation.label}
        triggerId={selectId}
        triggerStyle={presentation.style}
        className="sclub-glide-control"
        size="lg" surfaceColor="#ffffff" highlightColor="#ede9fe" textColor="#111827" accentColor="#6d28d9"
        onChange={value => {
          const select = nativeRef.current;
          if (!select || select.disabled || select.value === String(value)) return;
          const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
          if (setter) setter.call(select, String(value));
          else select.value = String(value);
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }}
      />}
    </span>
  );
}
