// React Bits source supplied by user; see LICENSE.md.
"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

import { createPortal } from "react-dom";
import "./GlideSelect.css";

const SIZES = {
  sm: { chip: 28, row: 26, font: 12 },
  md: { chip: 32, row: 30, font: 13 },
  lg: { chip: 44, row: 40, font: 14 },
};
const GAP = 1;
const MENU_GAP = 6;
const DEFAULT_OPTIONS = ["One", "Two", "Three"];

const norm = (o) => {
  const item = typeof o === "object" && o !== null ? o : { value: o, label: String(o) };
  return { ...item, value: String(item.value) };
};
const textOf = (it) => (typeof it.label === "string" ? it.label : it.value);
const typeaheadIndex = (items, from, ch) => {
  const c = ch.toLowerCase();
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!items[i].disabled && String(textOf(items[i])).toLowerCase().startsWith(c)) return i;
  }
  return from;
};

export default function GlideSelect({
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  placeholder = "Select…",
  showTags = true,
  accentColor = "#f5f5f5",
  surfaceColor = "#27272a",
  highlightColor = "#3f3f46",
  textColor = "#f5f5f5",
  size = "md",
  radius = 10,
  menuWidth = 176,
  placement = "bottom",
  align = "left",
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  ariaLabel = "Select",
  className = "",
  triggerStyle = {},
  triggerId,
}) {
  const items = options.map(norm);
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const current = value != null ? String(value) : inner;
  const selected = items.findIndex((it) => it.value === current);
  const [phase, setPhase] = useState("closed");
  const [active, setActive] = useState(null);
  const [side, setSide] = useState(placement);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const pillRef = useRef(null);
  const instant = useRef(false);
  const closeTimer = useRef(undefined);
  const scrub = useRef(null);
  const keyboardNavigation = useRef(false);
  const id = useId();
  const S = SIZES[size] ?? SIZES.md;
  const step = S.row + GAP;
  const popOut = Math.round((popDuration * 2) / 3);

  useLayoutEffect(() => {
    if (phase !== "open") return;
    const el = menuRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    const need = el.offsetHeight + MENU_GAP;
    setSide(
      placement === "bottom" && r.bottom + need > window.innerHeight
        ? "top"
        : placement === "top" && r.top - need < 0
          ? "bottom"
          : placement,
    );
    const actualSide =
      placement === "bottom" && r.bottom + need > window.innerHeight
        ? "top"
        : placement === "top" && r.top - need < 0
          ? "bottom"
          : placement;
    el.style.position = "fixed";
    el.style.minWidth = `${r.width}px`;
    el.style.left = `${Math.max(8, Math.min(align === "right" ? r.right - el.offsetWidth : r.left, window.innerWidth - el.offsetWidth - 8))}px`;
    el.style.right = "auto";
    el.style.top =
      actualSide === "bottom" ? `${r.bottom + MENU_GAP}px` : "auto";
    el.style.bottom =
      actualSide === "top"
        ? `${window.innerHeight - r.top + MENU_GAP}px`
        : "auto";
    el.style.transitionDuration = instant.current ? "0ms" : "";
    el.dataset.state = "closed";
    void el.offsetHeight;
    el.dataset.state = "open";
    const p = pillRef.current;
    if (p) {
      p.style.transition = "none";
      p.style.transform = `translateY(${Math.max(0, selected) * step}px)`;
      p.style.opacity = "0";
      void p.offsetHeight;
      p.style.transition = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useLayoutEffect(() => {
    const p = pillRef.current;
    if (!p || phase !== "open") return;
    if (active === null) {
      p.style.opacity = "0";
      return;
    }
    const jump = instant.current || p.style.opacity !== "1";
    p.style.transitionDuration = jump ? "0ms, 150ms" : "";
    p.style.transform = `translateY(${active * step}px)`;
    p.style.opacity = "1";
    instant.current = false;
    const row = menuRef.current?.querySelector(`[data-index="${active}"]`);
    const menu = menuRef.current;
    if (row && menu) {
      if (row.offsetTop < menu.scrollTop) menu.scrollTop = row.offsetTop;
      else if (row.offsetTop + row.offsetHeight > menu.scrollTop + menu.clientHeight)
        menu.scrollTop = row.offsetTop + row.offsetHeight - menu.clientHeight;
    }
  }, [active, phase, step]);

  const open = (viaKey) => {
    if (disabled) return;
    keyboardNavigation.current = viaKey;
    clearTimeout(closeTimer.current);
    instant.current = true;
    const firstEnabled = items.findIndex(it => !it.disabled);
    setActive(selected >= 0 && !items[selected].disabled ? selected : viaKey && firstEnabled >= 0 ? firstEnabled : null);
    setPhase("open");
  };
  const close = (mode) => {
    setActive(null);
    scrub.current = null;
    clearTimeout(closeTimer.current);
    const el = menuRef.current;
    if (mode === "instant" || !el) {
      setPhase("closed");
      return;
    }
    el.style.transitionDuration = "";
    el.dataset.state = "closed";
    setPhase("closing");
    closeTimer.current = setTimeout(() => setPhase("closed"), popOut + 20);
  };
  const pick = (i, viaKey) => {
    const it = items[i];
    if (!it || it.disabled || disabled) {
      close("instant");
      return;
    }
    if (it.value !== current) {
      if (value === undefined) setInner(it.value);
      onChange?.(it.value, it);
      if (!viaKey && rootRef.current) rootRef.current.dataset.swap = "";
    }
    close("instant");
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onTriggerKey = (e) => {
    const k = e.key;
    const n = items.length;
    const cur = active ?? Math.max(0, selected);
    if (disabled) return;
    keyboardNavigation.current = true;
    if (phase !== "open") {
      if (k === "Enter" || k === " " || k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault();
        open(true);
      }
      return;
    }
    const go = (i) => {
      e.preventDefault();
      instant.current = true;
      const direction = i < cur ? -1 : 1;
      let next = Math.min(n - 1, Math.max(0, i));
      while (next >= 0 && next < n && items[next].disabled) next += direction;
      if (next >= 0 && next < n) setActive(next);
    };
    if (k === "ArrowDown" || k === "ArrowUp")
      go(active === null ? cur : cur + (k === "ArrowDown" ? 1 : -1));
    else if (k === "Home" || k === "End") {
      e.preventDefault();
      const indexes = items.map((it, i) => !it.disabled ? i : -1).filter(i => i >= 0);
      setActive((k === "Home" ? indexes[0] : indexes.at(-1)) ?? null);
    }
    else if (k === "Enter" || k === " ") {
      e.preventDefault();
      pick(cur, true);
    } else if (k === "Escape" || k === "Tab") {
      if (k === "Escape") e.preventDefault();
      close("instant");
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey)
      go(typeaheadIndex(items, cur, k));
  };

  useEffect(() => {
    if (phase === "closed") return undefined;
    const onDown = (e) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      )
        close("pop");
    };
    const reposition = (e) => {
      const menu = menuRef.current;
      const root = rootRef.current;
      if (!menu || !root || menu.contains(e.target)) return;
      const rect = root.getBoundingClientRect();
      const need = menu.offsetHeight + MENU_GAP;
      const actualSide = placement === "top"
        ? (rect.top - need < 0 ? "bottom" : "top")
        : (rect.bottom + need > window.innerHeight ? "top" : "bottom");
      setSide(actualSide);
      menu.style.minWidth = `${rect.width}px`;
      menu.style.left = `${Math.max(8, Math.min(align === "right" ? rect.right - menu.offsetWidth : rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
      menu.style.top =
        actualSide === "bottom" ? `${rect.bottom + MENU_GAP}px` : "auto";
      menu.style.bottom =
        actualSide === "top"
          ? `${window.innerHeight - rect.top + MENU_GAP}px`
          : "auto";
    };
    reposition({ target: document });
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, align, placement, options.length]);
  useEffect(() => {
    if (disabled && phase !== "closed") close("instant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Use live row bounds: the list already excludes popup padding and moves on scroll.
  const rowAt = (x, y) => {
    const menu = menuRef.current;
    if (!menu) return null;
    const bounds = menu.getBoundingClientRect();
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
    const rows = menu.querySelectorAll("[data-index]");
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      const i = Number(row.dataset.index);
      if (x >= rect.left && x <= rect.right && y >= rect.top && y < rect.bottom)
        return items[i]?.disabled ? null : i;
    }
    return null;
  };
  const onListDown = (e) => {
    if (scrub.current || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* Capture is optional; normal pointer events still select. */ }
    scrub.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      touch: e.pointerType === "touch",
      moved: false,
    };
    instant.current = true;
    setActive(rowAt(e.clientX, e.clientY));
  };
  const onListMove = (e) => {
    if (!scrub.current) {
      if (e.pointerType !== "touch" && (e.movementX || e.movementY)) {
        keyboardNavigation.current = false;
        setActive(rowAt(e.clientX, e.clientY));
      }
      return;
    }
    if (scrub.current.id !== e.pointerId) return;
    if (scrub.current.touch && Math.hypot(e.clientX - scrub.current.x, e.clientY - scrub.current.y) > 8) scrub.current.moved = true;
    const i = rowAt(e.clientX, e.clientY);
    if (i !== active) setActive(i);
  };
  const onListUp = (e) => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = e.type === "pointerup" && !scrub.current.moved ? rowAt(e.clientX, e.clientY) : null;
    scrub.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (i !== null) pick(i, false);
    else if (!rememberPosition) setActive(null);
  };
  const onListOver = (e) => {
    if (e.pointerType === "touch" || scrub.current || keyboardNavigation.current) return;
    const row = e.target.closest("[data-index]");
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== active) setActive(items[i]?.disabled ? null : i);
  };

  const origin = `${side === "bottom" ? "top" : "bottom"} ${align}`;
  const themeStyle = {
    "--gs-accent": accentColor,
    "--gs-surface": surfaceColor,
    "--gs-highlight": highlightColor,
    "--gs-text": textColor,
    "--gs-radius": `${radius}px`,
    "--gs-inner-radius": `${Math.max(3, radius - 4)}px`,
    "--gs-chip": `${S.chip}px`,
    "--gs-row": `${S.row}px`,
    "--gs-font": `${S.font}px`,
    "--gs-menu-w": `${menuWidth}px`,
    "--gs-pop": `${popDuration}ms`,
    "--gs-pop-out": `${popOut}ms`,
    "--gs-glide": `${glideDuration}ms`,
    "--gs-origin": origin,
    "--gs-ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
  };
  return (
    <div
      ref={rootRef}
      className={`glide-select${className ? ` ${className}` : ""}`}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      style={themeStyle}
      onAnimationEnd={(e) => {
        if (e.animationName === "gs-swap" && rootRef.current)
          delete rootRef.current.dataset.swap;
      }}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        style={triggerStyle}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase === "open"}
        aria-controls={`${id}-list`}
        aria-activedescendant={active !== null ? `${id}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className="glide-select__trigger"
        onClick={(e) => {
          if (disabled) return;

          e.preventDefault();
          e.stopPropagation();

          e.currentTarget.focus({
            preventScroll: true,
          });

          if (phase === "open") {
            close("pop");
          } else {
            open(false);
          }
        }}
        onKeyDown={onTriggerKey}
      >
        <span
          className="glide-select__label"
          key={current}
          data-empty={selected < 0 ? "" : undefined}
        >
          {selected >= 0 ? items[selected].label : placeholder}
        </span>
        <span className="glide-select__chevron" aria-hidden="true">
          <ChevronDown size={12} strokeWidth={2.5} />
        </span>
      </button>
      {phase !== "closed"
        ? createPortal(
            <div
              ref={menuRef}
              className="glide-select__menu sclub-glide-popup"
              style={themeStyle}
              data-state="open"
              data-side={side}
              data-align={align}
            >
              <div
                id={`${id}-list`}
                role="listbox"
                aria-label={ariaLabel}
                className="glide-select__list"
                data-live={active !== null ? "" : undefined}
                onPointerOver={onListOver}
                onPointerLeave={() => {
                  if (!scrub.current && !rememberPosition) setActive(null);
                }}
                onPointerDown={onListDown}
                onPointerMove={onListMove}
                onPointerUp={onListUp}
                onPointerCancel={onListUp}
                onLostPointerCapture={onListUp}
              >
                <span
                  ref={pillRef}
                  className="glide-select__pill"
                  aria-hidden="true"
                />
                {items.map((it, i) => (
                  <div
                    key={it.value}
                    id={`${id}-${i}`}
                    role="option"
                    aria-selected={i === selected}
                    aria-disabled={it.disabled || undefined}
                    data-index={i}
                    className="glide-select__option"
                  >
                    <span className="glide-select__name">{it.label}</span>
                    {showTags && it.tag ? (
                      <span className="glide-select__tag">{it.tag}</span>
                    ) : null}
                    <span
                      className="glide-select__check"
                      data-on={i === selected ? "" : undefined}
                      aria-hidden="true"
                    >
                      <Check size={13} strokeWidth={2.5} />
                    </span>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
