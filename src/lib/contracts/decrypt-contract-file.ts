import "server-only"

import { createDecipheriv } from "node:crypto"

import { getContractFileEncryptionKey } from "@/lib/contracts/env"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH_BYTES = 12
const AUTH_TAG_LENGTH_BYTES = 16

/**
 * Inverts `encryptContractFile`'s layout: `iv (12 bytes) || authTag (16
 * bytes) || ciphertext`. Lets GCM's auth-tag verification failure (thrown by
 * `decipher.final()` on a corrupted/tampered buffer) propagate as-is — the
 * caller (the download route) is responsible for turning that into a
 * generic 500 and logging the real error server-side, never echoing crypto
 * internals to the client.
 */
export function decryptContractFile(buffer: Buffer): Buffer {
  const key = getContractFileEncryptionKey()

  const iv = buffer.subarray(0, IV_LENGTH_BYTES)
  const authTag = buffer.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES)
  const ciphertext = buffer.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
