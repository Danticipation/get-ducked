import QRCode from 'qrcode';

const PROFILE_SCHEME = 'ducku://profile';

/**
 * Generate a QR code data URL for a user's profile (by uid).
 * Used for "duck me" stickers and sharing.
 */
export async function generateProfileQRDataUrl(uid: string): Promise<string> {
  const payload = `${PROFILE_SCHEME}/${uid}`;
  return QRCode.toDataURL(payload, { width: 400, margin: 2 });
}

/**
 * Parse a scanned QR payload and return the profile uid if valid.
 * Supports ducku://profile/{uid} or https://ducku.app/profile/{uid}
 */
export function parseProfileFromQR(data: string): string | null {
  const trimmed = data.trim();
  const duckuMatch = trimmed.match(/^ducku:\/\/profile\/([a-zA-Z0-9_-]+)/);
  if (duckuMatch) return duckuMatch[1];
  const httpsMatch = trimmed.match(/^https?:\/\/ducku\.app\/profile\/([a-zA-Z0-9_-]+)/);
  if (httpsMatch) return httpsMatch[1];
  return null;
}
