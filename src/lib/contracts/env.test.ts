import { afterEach, describe, expect, it } from "vitest"

import { getContractFileEncryptionKey } from "./env"

const VALID_KEY_HEX = "0".repeat(64)

afterEach(() => {
  delete process.env.CONTRACT_FILE_ENCRYPTION_KEY
})

describe("getContractFileEncryptionKey", () => {
  it("returns a 32-byte buffer for a valid hex key", () => {
    process.env.CONTRACT_FILE_ENCRYPTION_KEY = VALID_KEY_HEX

    const key = getContractFileEncryptionKey()

    expect(key).toBeInstanceOf(Buffer)
    expect(key.length).toBe(32)
  })

  it("throws when the env var is missing", () => {
    delete process.env.CONTRACT_FILE_ENCRYPTION_KEY

    expect(() => getContractFileEncryptionKey()).toThrow()
  })

  it("throws when the env var decodes to the wrong length", () => {
    process.env.CONTRACT_FILE_ENCRYPTION_KEY = "abcd"

    expect(() => getContractFileEncryptionKey()).toThrow()
  })
})
