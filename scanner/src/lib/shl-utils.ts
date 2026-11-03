/**
 * SHL (Smart Health Link) Utilities
 *
 * Handles parsing and validation of SHL URLs in both formats:
 * - Raw: shlink:/eyJ1cmwiOi...
 * - Full: https://<any host>/#shlink:/eyJ1cmwiOi...
 *
 * Only the shlink:/ part of a scan is ever used. The viewer URL is always
 * rebuilt on the configured viewer host, so a QR code cannot send the
 * decryption key to a host of its choosing.
 */

export interface SHLPayload {
  url: string;       // Manifest URL
  key: string;       // 43-char base64url encryption key
  exp?: number;      // Expiration (Unix epoch seconds)
  flag?: string;     // L (long-term), P (passcode), U (unsigned)
  label?: string;    // Human-readable label
  v?: number;        // Protocol version
}

/**
 * Viewer the scanner opens links in. Set EXPO_PUBLIC_VIEWER_URL to override
 * (e.g. a local viewer-app for demos).
 */
export const VIEWER_URL = (
  process.env.EXPO_PUBLIC_VIEWER_URL || "https://viewer.login.health"
).replace(/\/+$/, "");

const SHL_PAYLOAD_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Check if a string is a valid SHL URL (either format)
 */
export function isSHLUrl(data: string): boolean {
  return data.startsWith("shlink:/") || data.includes("#shlink:/");
}

/**
 * Extract the raw shlink:/ URI from either format, discarding any host
 */
export function extractRawSHL(data: string): string {
  const trimmed = data.trim();
  let encoded: string | undefined;

  if (trimmed.startsWith("shlink:/")) {
    encoded = trimmed.slice("shlink:/".length);
  } else if (trimmed.includes("#shlink:/")) {
    encoded = trimmed.split("#shlink:/")[1];
  }

  if (!encoded || !SHL_PAYLOAD_PATTERN.test(encoded)) {
    throw new Error("Invalid SHL format");
  }
  return `shlink:/${encoded}`;
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

  // Decode base64 to string (error details omitted: they can echo the key)
  let payload: SHLPayload;
  try {
    payload = JSON.parse(atob(base64));
  } catch {
    throw new Error("Invalid SHL: payload could not be decoded");
  }

  // Validate required fields
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid SHL: payload could not be decoded");
  }
  if (!payload.url || typeof payload.url !== "string") {
    throw new Error("Invalid SHL: missing manifest URL");
  }
  if (!payload.key || typeof payload.key !== "string") {
    throw new Error("Invalid SHL: missing encryption key");
  }
  if (payload.key.length !== 43) {
    throw new Error("Invalid SHL: malformed encryption key");
  }
  getManifestHost(payload);

  return payload;
}

/**
 * Hostname the viewer will fetch the manifest from. Throws unless the
 * manifest URL is https.
 */
export function getManifestHost(payload: Pick<SHLPayload, "url">): string {
  let manifestUrl: URL;
  try {
    manifestUrl = new URL(payload.url);
  } catch {
    throw new Error("Invalid SHL: malformed manifest URL");
  }
  if (manifestUrl.protocol !== "https:" || !manifestUrl.hostname) {
    throw new Error(
      "Invalid SHL: manifest URL must use https. This link was not opened."
    );
  }
  return manifestUrl.hostname;
}

/**
 * Hostname of the configured viewer, for display
 */
export function getViewerHost(): string {
  try {
    return new URL(VIEWER_URL).host;
  } catch {
    return VIEWER_URL;
  }
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
 * Build the viewer URL for any SHL format. The scanned URL's own host is
 * never used; the payload is always opened on the configured viewer.
 */
export function buildViewerUrl(scannedData: string): string {
  return `${VIEWER_URL}/#${extractRawSHL(scannedData)}`;
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
