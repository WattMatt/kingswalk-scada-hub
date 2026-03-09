import { useState, useEffect, useCallback } from "react";

export interface MarkerConfig {
  id: string;
  label: string;
  type: "generator" | "transformer" | "switchgear" | "custom";
  /** Percentage-based position on the floor plan */
  left: number;
  top: number;
  /** Which generator ID to link to (optional) */
  linkedGenerator?: string;
}

const STORAGE_KEY = "scada-floor-markers";

const defaultMarkers: MarkerConfig[] = [
  { id: "marker-1", label: "G1", type: "generator", left: 20, top: 40, linkedGenerator: "GEN-01" },
  { id: "marker-2", label: "G2", type: "generator", left: 35, top: 40, linkedGenerator: "GEN-02" },
  { id: "marker-3", label: "G3", type: "generator", left: 50, top: 40, linkedGenerator: "GEN-03" },
  { id: "marker-4", label: "G4", type: "generator", left: 65, top: 40, linkedGenerator: "GEN-04" },
];

function loadMarkers(): MarkerConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultMarkers;
}

function saveMarkers(markers: MarkerConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
}

/** Shared hook – every consumer sees the same state within a session */
let listeners: Array<() => void> = [];
let currentMarkers: MarkerConfig[] = loadMarkers();

function notify() {
  listeners.forEach((l) => l());
}

export function useMarkerStore() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const cb = () => rerender((n) => n + 1);
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  }, []);

  const setMarkers = useCallback((updater: MarkerConfig[] | ((prev: MarkerConfig[]) => MarkerConfig[])) => {
    currentMarkers = typeof updater === "function" ? updater(currentMarkers) : updater;
    saveMarkers(currentMarkers);
    notify();
  }, []);

  const updateMarkerPosition = useCallback((id: string, left: number, top: number) => {
    currentMarkers = currentMarkers.map((m) => (m.id === id ? { ...m, left, top } : m));
    saveMarkers(currentMarkers);
    notify();
  }, []);

  const addMarker = useCallback((marker: MarkerConfig) => {
    currentMarkers = [...currentMarkers, marker];
    saveMarkers(currentMarkers);
    notify();
  }, []);

  const removeMarker = useCallback((id: string) => {
    currentMarkers = currentMarkers.filter((m) => m.id !== id);
    saveMarkers(currentMarkers);
    notify();
  }, []);

  const resetMarkers = useCallback(() => {
    currentMarkers = defaultMarkers;
    saveMarkers(currentMarkers);
    notify();
  }, []);

  return {
    markers: currentMarkers,
    setMarkers,
    updateMarkerPosition,
    addMarker,
    removeMarker,
    resetMarkers,
  };
}
