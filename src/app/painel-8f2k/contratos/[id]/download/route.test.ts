import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { decryptContractFile } from "@/lib/contracts/decrypt-contract-file"
import { fetchContract } from "@/lib/contracts/fetch-contract"
import { logContractAccess } from "@/lib/contracts/log-contract-access"

import { GET } from "./route"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/contracts/fetch-contract", () => ({
  fetchContract: vi.fn(),
}))

vi.mock("@/lib/contracts/decrypt-contract-file", () => ({
  decryptContractFile: vi.fn(),
}))

vi.mock("@/lib/contracts/log-contract-access", () => ({
  logContractAccess: vi.fn(),
}))

const contractRow = {
  id: "contract-1",
  lead_id: "lead-1",
  service_types: ["site"],
  amount: 1000,
  hours: null,
  file_object_path: "abc.bin",
  created_by: "admin-1",
  created_at: "2026-01-01T00:00:00Z",
}

function params(id = "contract-1") {
  return { params: Promise.resolve({ id }) }
}

async function importSupabaseServer() {
  const mod = await import("@/lib/supabase/server")
  return mod.createClient as unknown as ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockReset()
  vi.mocked(fetchContract).mockReset()
  vi.mocked(decryptContractFile).mockReset()
  vi.mocked(logContractAccess).mockReset()
})

describe("GET /painel-8f2k/contratos/[id]/download", () => {
  it("returns 403 and never touches storage/DB for a non-super_admin caller", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const response = await GET(new Request("http://localhost"), params())

    expect(response.status).toBe(403)
    expect(fetchContract).not.toHaveBeenCalled()
    expect(decryptContractFile).not.toHaveBeenCalled()
    expect(logContractAccess).not.toHaveBeenCalled()
  })

  it("returns 403 when there is no session", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const response = await GET(new Request("http://localhost"), params())

    expect(response.status).toBe(403)
    expect(fetchContract).not.toHaveBeenCalled()
  })

  it("returns 404 when the contract doesn't exist", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue(null)

    const response = await GET(new Request("http://localhost"), params())

    expect(response.status).toBe(404)
    expect(logContractAccess).not.toHaveBeenCalled()
  })

  it("returns 404 when the contract has no attached file", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue({ ...contractRow, file_object_path: null })

    const response = await GET(new Request("http://localhost"), params())

    expect(response.status).toBe(404)
    expect(logContractAccess).not.toHaveBeenCalled()
  })

  it("returns 200 with the decrypted PDF bytes and logs the access on success", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue(contractRow)
    vi.mocked(decryptContractFile).mockReturnValue(Buffer.from("%PDF-1.4 fake"))
    vi.mocked(logContractAccess).mockResolvedValue(undefined)

    const download = vi.fn().mockResolvedValue({ data: new Blob(["encrypted-bytes"]), error: null })
    const storageFrom = vi.fn().mockReturnValue({ download })
    const createClient = await importSupabaseServer()
    createClient.mockResolvedValue({ storage: { from: storageFrom } })

    const response = await GET(new Request("http://localhost"), params())
    const body = Buffer.from(await response.arrayBuffer())

    expect(response.status).toBe(200)
    expect(body.subarray(0, 4).toString()).toBe("%PDF")
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="contrato-contract-1.pdf"')
    expect(response.headers.get("Cache-Control")).toBe("no-store, private")
    expect(storageFrom).toHaveBeenCalledWith("contracts")
    expect(download).toHaveBeenCalledWith("abc.bin")
    expect(logContractAccess).toHaveBeenCalledWith(expect.anything(), "contract-1", "admin-1")
  })

  it("returns 500 with a generic message when the storage download fails, no log row written", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue(contractRow)

    const download = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } })
    const storageFrom = vi.fn().mockReturnValue({ download })
    const createClient = await importSupabaseServer()
    createClient.mockResolvedValue({ storage: { from: storageFrom } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET(new Request("http://localhost"), params())
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toMatch(/not found/)
    expect(logContractAccess).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("returns 500 with a generic message when decryption fails (tampered ciphertext), no log row written", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue(contractRow)
    vi.mocked(decryptContractFile).mockImplementation(() => {
      throw new Error("Unsupported state or unable to authenticate data")
    })

    const download = vi.fn().mockResolvedValue({ data: new Blob(["encrypted-bytes"]), error: null })
    const storageFrom = vi.fn().mockReturnValue({ download })
    const createClient = await importSupabaseServer()
    createClient.mockResolvedValue({ storage: { from: storageFrom } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET(new Request("http://localhost"), params())
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toMatch(/authenticate data/)
    expect(logContractAccess).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("returns 500 with a generic message when an uncaught error occurs (e.g. requireSuperAdmin's underlying auth call rejects)", async () => {
    vi.mocked(getCurrentAdmin).mockRejectedValue(new Error("supabase auth unreachable"))
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET(new Request("http://localhost"), params())
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toMatch(/supabase auth unreachable/)
    expect(fetchContract).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("still serves the PDF (fail-open) when the access-log insert fails after a successful decrypt", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(fetchContract).mockResolvedValue(contractRow)
    vi.mocked(decryptContractFile).mockReturnValue(Buffer.from("%PDF-1.4 fake"))
    vi.mocked(logContractAccess).mockRejectedValue(new Error("transient db error"))

    const download = vi.fn().mockResolvedValue({ data: new Blob(["encrypted-bytes"]), error: null })
    const storageFrom = vi.fn().mockReturnValue({ download })
    const createClient = await importSupabaseServer()
    createClient.mockResolvedValue({ storage: { from: storageFrom } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET(new Request("http://localhost"), params())
    const body = Buffer.from(await response.arrayBuffer())

    expect(response.status).toBe(200)
    expect(body.subarray(0, 4).toString()).toBe("%PDF")
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
