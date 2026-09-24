import "server-only"

import { createCipheriv, randomBytes } from "node:crypto"

import { getContractFileEncryptionKey } from "@/lib/contracts/env"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH_BYTES = 12

/**
 * Encrypts a contract file buffer with AES-256-GCM before it ever reaches
 * Supabase Storage — the private `contracts` bucket is defense-in-depth via
 * RLS, but the actual sensitive-data guarantee is that it never holds
 * plaintext bytes.
 *
 * Output layout is `iv (12 bytes) || authTag (16 bytes) || ciphertext`, all
 * self-contained in one buffer so decryption (deferred to a later story,
 * per the spec) only needs the same symmetric key plus this one blob — no
 * separate metadata to keep track of. A fresh random IV is generated on
 * every call, as required for GCM: reusing an IV with the same key breaks
 * its confidentiality guarantees.
 */
export function encryptContractFile(buffer: Buffer): Buffer {
  const key = getContractFileEncryptionKey()
  const iv = randomBytes(IV_LENGTH_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, ciphertext])
}
