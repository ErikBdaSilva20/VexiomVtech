import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { decryptContractFile } from "./decrypt-contract-file"
import { encryptContractFile } from "./encrypt-contract-file"

const TEST_KEY_HEX = "0".repeat(64)

beforeEach(() => {
  process.env.CONTRACT_FILE_ENCRYPTION_KEY = TEST_KEY_HEX
})

afterEach(() => {
  delete process.env.CONTRACT_FILE_ENCRYPTION_KEY
})

describe("decryptContractFile", () => {
  it("round-trips: decrypts what encryptContractFile produced back to the original bytes", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")
    const encrypted = encryptContractFile(plaintext)

    const decrypted = decryptContractFile(encrypted)

    expect(decrypted.equals(plaintext)).toBe(true)
  })

  it("throws when the auth tag doesn't verify (tampered ciphertext)", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")
    const encrypted = encryptContractFile(plaintext)
    encrypted[encrypted.length - 1] ^= 0xff // flip a ciphertext byte

    expect(() => decryptContractFile(encrypted)).toThrow()
  })

  it("throws when the auth tag itself is corrupted", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")
    const encrypted = encryptContractFile(plaintext)
    encrypted[15] ^= 0xff // byte within the authTag region (offset 12..28)

    expect(() => decryptContractFile(encrypted)).toThrow()
  })

  it("throws when the encryption key env var is missing", () => {
    delete process.env.CONTRACT_FILE_ENCRYPTION_KEY

    expect(() => decryptContractFile(Buffer.alloc(40))).toThrow()
  })
})
