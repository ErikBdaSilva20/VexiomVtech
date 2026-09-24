import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createContract } from "@/lib/contracts/create-contract"
import { encryptContractFile } from "@/lib/contracts/encrypt-contract-file"

import { createContractAction } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/contracts/create-contract", () => ({
  createContract: vi.fn(),
}))

vi.mock("@/lib/contracts/encrypt-contract-file", () => ({
  encryptContractFile: vi.fn(),
}))

const leadId = "11111111-1111-4111-8111-111111111111"
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])

function validFormData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const fields: Record<string, string> = {
    lead_id: leadId,
    amount: "1500.50",
    ...overrides,
  }
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  data.append("service_types", "site")
  return data
}

function pdfFile(name = "contrato.pdf", size = PDF_BYTES.length) {
  const content = new Uint8Array(Math.max(size, PDF_BYTES.length))
  content.set(PDF_BYTES)
  return new File([content], name, { type: "application/pdf" })
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockReset()
  vi.mocked(createContract).mockReset()
  vi.mocked(encryptContractFile).mockReset()
})

describe("createContractAction", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createContractAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Sessão expirada. Faça login novamente." })
    expect(createContract).not.toHaveBeenCalled()
  })

  it("rejects a non-super_admin, even with a valid session (defense in depth alongside RLS)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createContractAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar contratos." })
    expect(createContract).not.toHaveBeenCalled()
  })

  it("returns field errors for an invalid payload, without touching storage/DB", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const result = await createContractAction(undefined, validFormData({ amount: "-10" }))

    expect(result?.status).toBe("error")
    expect(createContract).not.toHaveBeenCalled()
  })

  it("rejects hours missing when a demanda service type is selected", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    const data = validFormData()
    data.append("service_types", "demanda")

    const result = await createContractAction(undefined, data)

    expect(result?.status).toBe("error")
    expect(createContract).not.toHaveBeenCalled()
  })

  it("creates the contract with no file, passing the caller's own admin id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createContract).mockResolvedValue({ ok: true, id: "contract-1" })

    const result = await createContractAction(undefined, validFormData())

    expect(result).toEqual({ status: "success", id: "contract-1" })
    expect(createContract).toHaveBeenCalledWith(expect.anything(), expect.anything(), "admin-1", undefined)
    expect(encryptContractFile).not.toHaveBeenCalled()
  })

  it("encrypts and forwards the file when a valid PDF is attached", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    const encrypted = Buffer.from("encrypted")
    vi.mocked(encryptContractFile).mockReturnValue(encrypted)
    vi.mocked(createContract).mockResolvedValue({ ok: true, id: "contract-1" })

    const data = validFormData()
    data.set("file", pdfFile())

    const result = await createContractAction(undefined, data)

    expect(result).toEqual({ status: "success", id: "contract-1" })
    expect(encryptContractFile).toHaveBeenCalled()
    expect(createContract).toHaveBeenCalledWith(expect.anything(), expect.anything(), "admin-1", encrypted)
  })

  it("rejects a non-PDF file before encrypting or touching the DB", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const data = validFormData()
    data.set("file", new File([new Uint8Array([1, 2, 3, 4])], "not-a-pdf.txt", { type: "text/plain" }))

    const result = await createContractAction(undefined, data)

    expect(result?.status).toBe("error")
    expect(encryptContractFile).not.toHaveBeenCalled()
    expect(createContract).not.toHaveBeenCalled()
  })

  it("rejects a file over the size cap", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const data = validFormData()
    data.set("file", pdfFile("huge.pdf", 10 * 1024 * 1024 + 1))

    const result = await createContractAction(undefined, data)

    expect(result?.status).toBe("error")
    expect(createContract).not.toHaveBeenCalled()
  })

  it("ignores a created_by field spoofed via FormData, always using the caller's own admin id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createContract).mockResolvedValue({ ok: true, id: "contract-1" })

    await createContractAction(undefined, validFormData({ created_by: "someone-else" }))

    expect(createContract).toHaveBeenCalledWith(expect.anything(), expect.anything(), "admin-1", undefined)
  })

  it("surfaces a specific message for an invalid lead", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createContract).mockResolvedValue({ ok: false, error: "invalid_lead" })

    const result = await createContractAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "O lead selecionado não existe." })
  })

  it("surfaces a specific message when upload fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(encryptContractFile).mockReturnValue(Buffer.from("x"))
    vi.mocked(createContract).mockResolvedValue({ ok: false, error: "upload_failed" })

    const data = validFormData()
    data.set("file", pdfFile())

    const result = await createContractAction(undefined, data)

    expect(result).toEqual({ status: "error", error: "Não foi possível enviar o arquivo do contrato." })
  })
})
