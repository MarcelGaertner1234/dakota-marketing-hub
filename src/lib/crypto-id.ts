// Cryptographically secure ID + Token Helpers
// Replaces Math.random().toString(36) for anything that must not be guessable:
// goody codes, QR review tokens, upload filenames.

const ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789" // 32 chars, no 0/O/1/I/L ambiguity

function randomInt(max: number): number {
  // Unbiased rejection sampling against 256-mod skew.
  const limit = Math.floor(256 / max) * max
  const buf = new Uint8Array(1)
  while (true) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % max
  }
}

function randomString(length: number, alphabet = ALPHABET): string {
  let out = ""
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)]
  return out
}

// DAKOTA-XXXXXX — 6 chars from 32-char alphabet = 32^6 ≈ 1 Mrd. Kombinationen.
export function secureGoodyCode(): string {
  return `DAKOTA-${randomString(6)}`
}

// Review-Tokens sind URL-segments (/bewerten/[token]). 10 chars von 32-char alphabet = 32^10 ≈ 10^15.
export function secureReviewToken(): string {
  return randomString(10).toLowerCase()
}

// Upload-Filenames wollen wir unrate-able, aber ASCII-safe.
export function secureFileSuffix(): string {
  return randomString(8).toLowerCase()
}
