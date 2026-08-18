"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

const reduce = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Contador numérico animado (anime.js sobre un objeto JS).
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1300,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce()) {
      el.textContent = value.toFixed(decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    const anim = anime({
      targets: obj,
      v: value,
      duration,
      easing: "easeOutExpo",
      update: () => {
        el.textContent = obj.v.toFixed(decimals) + suffix;
      },
    });
    return () => anim.pause();
  }, [value, decimals, suffix, duration]);

  return <span ref={ref} className={className}>0{suffix}</span>;
}

// Va mostrando los elementos hijos uno tras otro al aparecer.
export function Stagger({
  children,
  className,
  delay = 0,
  y = 18,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.children) as HTMLElement[];
    if (reduce()) {
      items.forEach((el) => (el.style.opacity = "1"));
      return;
    }
    items.forEach((el) => {
      el.style.opacity = "0";
    });
    const anim = anime({
      targets: items,
      translateY: [y, 0],
      opacity: [0, 1],
      delay: anime.stagger(70, { start: delay }),
      duration: 620,
      easing: "easeOutExpo",
    });
    return () => anim.pause();
  }, [delay, y]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}

// Barra horizontal cuyo ancho crece con anime.js.
export function AnimeBar({ value, color }: { value: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = `${Math.min(Math.max(value, 0), 100)}%`;
    if (reduce()) {
      el.style.width = target;
      return;
    }
    const anim = anime({ targets: el, width: ["0%", target], duration: 1100, easing: "easeOutExpo" });
    return () => anim.pause();
  }, [value]);
  return (
    <div className="rias-bar-track h-2.5 w-full">
      <div ref={ref} className="h-full rounded-full" style={{ width: 0, background: color }} />
    </div>
  );
}

// Anillo SVG cuyo trazo se dibuja con anime.js.
export function AnimeRing({ value, size = 132, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * Math.min(value, 100)) / 100;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce()) {
      el.style.strokeDashoffset = String(offset);
      return;
    }
    const obj = { o: c };
    const anim = anime({
      targets: obj,
      o: offset,
      duration: 1400,
      easing: "easeOutExpo",
      update: () => {
        el.style.strokeDashoffset = String(obj.o);
      },
    });
    return () => anim.pause();
  }, [offset, c]);

  return (
    <circle
      ref={ref}
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={c}
      strokeDashoffset={c}
    />
  );
}
