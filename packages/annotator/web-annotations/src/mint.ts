/** Where writes get the time and new ids. Tests pass their own; the defaults use Web Crypto. */
export interface Mint {
  /** An ISO 8601 date-time. */
  now(): string
  /** 11 random characters from `[a-z0-9]`. */
  blockId(): string
  /** A v4 UUID, without `urn:uuid:`. */
  uuid(): string
}

// Web Crypto is a global in Obsidian, browsers and Node alike; typed here since the package has no DOM or Node types.
interface WebCrypto {
  getRandomValues(array: Uint8Array): Uint8Array
  randomUUID(): string
}
const webCrypto = (): WebCrypto => (globalThis as unknown as { crypto: WebCrypto }).crypto

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"

export const defaultMint: Mint = {
  now: () => new Date().toISOString(),
  blockId: () => {
    let id = ""
    while (id.length < 11) {
      // 252 is the largest multiple of 36 under 256: rejecting above it keeps every character equally likely.
      for (const byte of webCrypto().getRandomValues(new Uint8Array(16))) {
        if (byte < 252 && id.length < 11) id += ALPHABET[byte % 36]
      }
    }
    return id
  },
  uuid: () => webCrypto().randomUUID(),
}
