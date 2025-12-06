/**
 * Scan History Management
 *
 * Persists scan history using AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "scan_history";
const MAX_HISTORY_ITEMS = 50;

export interface ScanHistoryItem {
  id: string;
  scannedData: string;
  label?: string;
  expiration?: number;
  scannedAt: string;
}

/**
 * Generate a unique ID for history items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Save a scan to history
 */
export async function saveToHistory(
  scannedData: string,
  label?: string,
  expiration?: number
): Promise<ScanHistoryItem> {
  const history = await getHistory();

  const newItem: ScanHistoryItem = {
    id: generateId(),
    scannedData,
    label,
    expiration,
    scannedAt: new Date().toISOString(),
  };

  // Add to beginning, limit to max items
  const updated = [newItem, ...history.slice(0, MAX_HISTORY_ITEMS - 1)];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

  return newItem;
}

/**
 * Get all scan history
 */
export async function getHistory(): Promise<ScanHistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a history item by ID
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter((item) => item.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

/**
 * Format date for display
 */
export function formatScanDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}
