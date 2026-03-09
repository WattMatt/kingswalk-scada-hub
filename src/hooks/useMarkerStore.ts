import { useState, useEffect, useCallback } from "react";

export interface MarkerConfig {
  id: string;
  label: string;
  type: "generator" | "transformer" | "switchgear" | "breaker" | "bus" | "custom";
  /** Percentage-based position on the floor plan */
  left: number;
  top: number;
  /** Which generator ID to link to (optional) */
  linkedGenerator?: string;
  /** Which equipment ID to link to for non-generator types */
  linkedEquipment?: string;
}

const STORAGE_KEY = "scada-floor-markers";

const defaultMarkers: MarkerConfig[] = [
  // Generators
  { id: "marker-g1", label: "G1", type: "generator", left: 18, top: 55, linkedGenerator: "GEN-01" },
  { id: "marker-g2", label: "G2", type: "generator", left: 30, top: 55, linkedGenerator: "GEN-02" },
  { id: "marker-g3", label: "G3", type: "generator", left: 42, top: 55, linkedGenerator: "GEN-03" },
  { id: "marker-g4", label: "G4", type: "generator", left: 54, top: 55, linkedGenerator: "GEN-04" },
  // Transformers
  { id: "marker-t1", label: "T1", type: "transformer", left: 24, top: 32, linkedEquipment: "XFMR-1" },
  { id: "marker-t2", label: "T2", type: "transformer", left: 48, top: 32, linkedEquipment: "XFMR-2" },
  // Switchgear
  { id: "marker-sw1", label: "SW", type: "switchgear", left: 36, top: 20, linkedEquipment: "SWG-1" },
  // Circuit breakers
  { id: "marker-cb1", label: "CB1", type: "breaker", left: 24, top: 43, linkedEquipment: "CB-01" },
  { id: "marker-cb2", label: "CB2", type: "breaker", left: 48, top: 43, linkedEquipment: "CB-02" },
  // Main bus
  { id: "marker-bus", label: "BUS", type: "bus", left: 36, top: 12, linkedEquipment: "BUS-1" },
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
