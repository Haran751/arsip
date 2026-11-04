"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Preferences = {
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

const STORAGE_KEY = "earsip-preferensi";

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Baca preferensi tersimpan atau pengaturan sistem saat pertama dimuat.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "1" || saved === "0") {
      setReduceMotion(saved === "1");
      return;
    }
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false";
    window.localStorage.setItem(STORAGE_KEY, reduceMotion ? "1" : "0");
  }, [reduceMotion]);

  return (
    <PreferencesContext.Provider value={{ reduceMotion, setReduceMotion }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences harus digunakan di dalam PreferencesProvider");
  return context;
}
