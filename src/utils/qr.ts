const PROFILE_SCHEME = 'ducku://profile';

/**
 * Build the QR payload string for a user's profile.
 * This is what gets rendered into a QR code and scanned by others.
 */
export function getProfileQRPayload(uid: string): string {
  return `${PROFILE_SCHEME}/${uid}`;
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
