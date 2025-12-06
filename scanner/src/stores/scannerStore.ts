import { create } from "zustand";
import { SHLPayload } from "../lib/shl-utils";

interface ScannerState {
  // Last scanned data
  lastScan: {
    data: string;
    payload: SHLPayload;
  } | null;

  // Camera state
  flashEnabled: boolean;
  hasPermission: boolean | null;

  // Actions
  setLastScan: (data: string, payload: SHLPayload) => void;
  clearLastScan: () => void;
  toggleFlash: () => void;
  setPermission: (granted: boolean) => void;
}

export const useScannerStore = create<ScannerState>()((set) => ({
  lastScan: null,
  flashEnabled: false,
  hasPermission: null,

  setLastScan: (data, payload) =>
    set({ lastScan: { data, payload } }),

  clearLastScan: () => set({ lastScan: null }),

  toggleFlash: () =>
    set((state) => ({ flashEnabled: !state.flashEnabled })),

  setPermission: (granted) => set({ hasPermission: granted }),
}));
