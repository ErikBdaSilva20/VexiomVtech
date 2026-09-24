import { createDecipheriv } from "node:crypto"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { encryptContractFile } from "./encrypt-contract-file"

const TEST_KEY_HEX = "0".repeat(64)

beforeEach(() => {
  process.env.CONTRACT_FILE_ENCRYPTION_KEY = TEST_KEY_HEX
})

afterEach(() => {
  delete process.env.CONTRACT_FILE_ENCRYPTION_KEY
})

describe("encryptContractFile", () => {
  it("produces output that is not the plaintext PDF bytes", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")
    const encrypted = encryptContractFile(plaintext)

    expect(encrypted.equals(plaintext)).toBe(false)
    expect(encrypted.includes(plaintext)).toBe(false)
  })

  it("produces a different ciphertext on every call (random IV)", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")

    const first = encryptContractFile(plaintext)
    const second = encryptContractFile(plaintext)

    expect(first.equals(second)).toBe(false)
  })

  it("round-trips: iv || authTag || ciphertext decrypts back to the original bytes", () => {
    const plaintext = Buffer.from("%PDF-1.4 fake pdf content")
    const encrypted = encryptContractFile(plaintext)

    const iv = encrypted.subarray(0, 12)
    const authTag = encrypted.subarray(12, 28)
    const ciphertext = encrypted.subarray(28)

    const key = Buffer.from(TEST_KEY_HEX, "hex")
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])

    expect(decrypted.equals(plaintext)).toBe(true)
  })

  it("throws when the encryption key env var is missing", () => {
    delete process.env.CONTRACT_FILE_ENCRYPTION_KEY

    expect(() => encryptContractFile(Buffer.from("x"))).toThrow()
  })

  it("throws when the encryption key env var decodes to the wrong length", () => {
    process.env.CONTRACT_FILE_ENCRYPTION_KEY = "abcd"

    expect(() => encryptContractFile(Buffer.from("x"))).toThrow()
  })
})
