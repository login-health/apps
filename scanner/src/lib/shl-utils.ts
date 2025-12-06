/**
 * SHL (Smart Health Link) Utilities
 *
 * Handles parsing and validation of SHL URLs in both formats:
 * - Raw: shlink:/eyJ1cmwiOi...
 * - Full: https://shl.login.health/#shlink:/eyJ1cmwiOi...
 */

export interface SHLPayload {
  url: string;       // Manifest URL
  key: string;       // 43-char base64url encryption key
  exp?: number;      // Expiration (Unix epoch seconds)
  flag?: string;     // L (long-term), P (passcode), U (unsigned)
  label?: string;    // Human-readable label
  v?: number;        // Protocol version
}

export const FALLBACK_VIEWER_URL = "https://shl.login.health";

/**
 * Check if a string is a valid SHL URL (either format)
 */
export function isSHLUrl(data: string): boolean {
  return data.startsWith("shlink:/") || data.includes("#shlink:/");
}

/**
 * Extract the raw shlink:/ URI from either format
 */
export function extractRawSHL(data: string): string {
  if (data.includes("#shlink:/")) {
    return data.split("#")[1];
  }
  if (data.startsWith("shlink:/")) {
    return data;
  }
  throw new Error("Invalid SHL format");
}

/**
 * Parse the base64url-encoded payload from an SHL
 */
export function parseSHLPayload(scannedData: string): SHLPayload {
  const rawUri = extractRawSHL(scannedData);
  const base64Payload = rawUri.replace("shlink:/", "");

  // Decode base64url to base64
  const padding = "=".repeat((4 - (base64Payload.length % 4)) % 4);
  const base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/") + padding;

  // Decode base64 to string
  const jsonStr = atob(base64);
  const payload: SHLPayload = JSON.parse(jsonStr);

  // Validate required fields
  if (!payload.url) {
    throw new Error("Invalid SHL: missing manifest URL");
  }
  if (!payload.key) {
    throw new Error("Invalid SHL: missing encryption key");
  }
  if (payload.key.length !== 43) {
    throw new Error("Invalid SHL: malformed encryption key");
  }

  return payload;
}

/**
 * Check if an SHL has expired
 */
export function isSHLExpired(payload: SHLPayload): boolean {
  if (!payload.exp) {
    return false; // No expiration set
  }
  return Date.now() / 1000 > payload.exp;
}

/**
 * Check if an SHL requires a passcode
 */
export function requiresPasscode(payload: SHLPayload): boolean {
  return payload.flag?.includes("P") ?? false;
}

/**
 * Check if an SHL is a long-term share
 */
export function isLongTermShare(payload: SHLPayload): boolean {
  return payload.flag?.includes("L") ?? false;
}

/**
 * Normalize any SHL format to a full URL with viewer
 */
export function normalizeToFullUrl(scannedData: string): string {
  if (scannedData.includes("#shlink:/")) {
    // Already a full URL
    return scannedData;
  }
  if (scannedData.startsWith("shlink:/")) {
    // Raw URI - prepend fallback viewer
    return `${FALLBACK_VIEWER_URL}/#${scannedData}`;
  }
  throw new Error("Invalid SHL format");
}

/**
 * Format expiration time for display
 */
export function formatExpiration(exp: number | undefined): string {
  if (!exp) {
    return "No expiration";
  }

  const expDate = new Date(exp * 1000);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();

  if (diffMs < 0) {
    return "Expired";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `Expires in ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
}
