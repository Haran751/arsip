"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "./preferences";

export default function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const { reduceMotion } = usePreferences();
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    if (reduceMotion || duration <= 0) {
      const frame = requestAnimationFrame(() => {
        previous.current = value;
        setDisplay(value);
      });
      return () => cancelAnimationFrame(frame);
    }

    const from = previous.current;
    const delta = value - from;
    if (delta === 0) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reduceMotion, value]);

  return <>{display.toLocaleString("id-ID")}</>;
}
