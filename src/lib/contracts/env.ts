import "server-only"

/**
 * Reads a required environment variable, throwing a clear error naming the
 * variable if it is missing/unset. Mirrors `src/lib/supabase/env.ts`'s
 * `requireEnv` — colocated here rather than shared since this one is
 * contracts-domain-specific and must never be imported by anything that
 * could reach the client bundle.
 */
function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

// 32 raw bytes for AES-256, hex-encoded (64 hex chars) in the env var so it
// survives `.env` files/shell quoting without escaping concerns. Generate
// with e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
const KEY_LENGTH_BYTES = 32

export function getContractFileEncryptionKey(): Buffer {
  const hex = requireEnv("CONTRACT_FILE_ENCRYPTION_KEY")
  const key = Buffer.from(hex, "hex")

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `CONTRACT_FILE_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (64 hex chars), got ${key.length}.`
    )
  }

  return key
}
