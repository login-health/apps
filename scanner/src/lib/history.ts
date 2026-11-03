/**
 * Scan History Management
 *
 * Persists scan history using AsyncStorage. Scanners run on shared clinic
 * devices, so history never stores the SHL payload, its key, or any URL:
 * only a label, the scan time, and the manifest host. Entries are a log,
 * not a way to reopen a link.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "scan_history";
const MAX_HISTORY_ITEMS = 20;
const DEFAULT_LABEL = "Health Link";

export interface ScanHistoryItem {
  id: string;
  label: string;
  manifestHost: string;
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
  manifestHost: string,
  label?: string
): Promise<ScanHistoryItem> {
  const history = await getHistory();

  const newItem: ScanHistoryItem = {
    id: generateId(),
    label: label || DEFAULT_LABEL,
    manifestHost,
    scannedAt: new Date().toISOString(),
  };

  // Add to beginning, limit to max items
  const updated = [newItem, ...history.slice(0, MAX_HISTORY_ITEMS - 1)];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

  return newItem;
}

/**
 * Best-effort manifest host from an entry written by an older version,
 * which stored the full scanned SHL in `scannedData`.
 */
function legacyManifestHost(scannedData: unknown): string {
  if (typeof scannedData !== "string") {
    return "unknown";
  }
  try {
    const encoded = scannedData.split("shlink:/")[1] ?? "";
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(base64 + padding));
    return new URL(payload.url).hostname || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Keep only the fields history is allowed to hold. Anything else on a
 * stored entry (scannedData, key, url, ...) is dropped.
 */
function sanitizeItem(raw: any): ScanHistoryItem {
  return {
    id: typeof raw?.id === "string" ? raw.id : generateId(),
    label:
      typeof raw?.label === "string" && raw.label ? raw.label : DEFAULT_LABEL,
    manifestHost:
      typeof raw?.manifestHost === "string"
        ? raw.manifestHost
        : legacyManifestHost(raw?.scannedData),
    scannedAt:
      typeof raw?.scannedAt === "string"
        ? raw.scannedAt
        : new Date().toISOString(),
  };
}

function isClean(raw: any, item: ScanHistoryItem): boolean {
  return (
    raw !== null &&
    typeof raw === "object" &&
    Object.keys(raw).length === 4 &&
    raw.id === item.id &&
    raw.label === item.label &&
    raw.manifestHost === item.manifestHost &&
    raw.scannedAt === item.scannedAt
  );
}

/**
 * Get all scan history. Entries stored by older versions (which kept the
 * SHL and its key) are stripped and the cleaned list is written back.
 */
export async function getHistory(): Promise<ScanHistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    if (!stored) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    const rawItems: any[] = Array.isArray(parsed) ? parsed : [];
    const items = rawItems.map(sanitizeItem).slice(0, MAX_HISTORY_ITEMS);

    const needsRewrite =
      !Array.isArray(parsed) ||
      rawItems.length !== items.length ||
      rawItems.some((raw, i) => !isClean(raw, items[i]));
    if (needsRewrite) {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    }
    return items;
  } catch {
    // Unreadable history may still contain secrets; drop it
    await AsyncStorage.removeItem(HISTORY_KEY).catch(() => undefined);
    return [];
  }
}

/**
 * Strip secrets from any history written by an older version. Call once
 * at app startup.
 */
export async function migrateHistory(): Promise<void> {
  await getHistory();
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
