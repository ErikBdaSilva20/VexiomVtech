import { describe, expect, it, vi } from "vitest"

import { createContract } from "./create-contract"
import type { CreateContractInput } from "./contract-schema"

function mockClient(options: {
  insertResult: { data: unknown; error: unknown }
  uploadResult?: { error: unknown }
  removeResult?: { error: unknown }
}) {
  const single = vi.fn().mockResolvedValue(options.insertResult)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })

  const upload = vi.fn().mockResolvedValue(options.uploadResult ?? { error: null })
  const remove = vi.fn().mockResolvedValue(options.removeResult ?? { error: null })
  const storageFrom = vi.fn().mockReturnValue({ upload, remove })

  return { from, insert, select, single, storage: { from: storageFrom }, upload, remove }
}

const input: CreateContractInput = {
  lead_id: "11111111-1111-4111-8111-111111111111",
  service_types: ["site"],
  amount: 1500.5,
  hours: null,
}

describe("createContract", () => {
  it("inserts with the caller's admin id as created_by, no file, no upload attempted", async () => {
    const { from, insert, storage } = mockClient({ insertResult: { data: { id: "contract-1" }, error: null } })
    const supabase = { from, storage } as never

    const result = await createContract(supabase, input, "admin-1")

    expect(result).toEqual({ ok: true, id: "contract-1" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: "admin-1", file_object_path: null })
    )
    expect(storage.from).not.toHaveBeenCalled()
  })

  it("uploads the encrypted buffer under a random object name before inserting", async () => {
    const { from, insert, storage, upload } = mockClient({
      insertResult: { data: { id: "contract-1" }, error: null },
    })
    const supabase = { from, storage } as never

    const result = await createContract(supabase, input, "admin-1", Buffer.from("encrypted-bytes"))

    expect(result).toEqual({ ok: true, id: "contract-1" })
    expect(storage.from).toHaveBeenCalledWith("contracts")
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.bin$/),
      Buffer.from("encrypted-bytes"),
      expect.objectContaining({ upsert: false })
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ file_object_path: expect.stringMatching(/\.bin$/) })
    )
  })

  it("returns upload_failed and never inserts a row when the upload fails", async () => {
    const { from, insert, storage } = mockClient({
      insertResult: { data: { id: "contract-1" }, error: null },
      uploadResult: { error: { message: "boom" } },
    })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1", Buffer.from("encrypted-bytes"))

    expect(result).toEqual({ ok: false, error: "upload_failed" })
    expect(insert).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("cleans up the uploaded object when the row insert fails", async () => {
    const { from, storage, remove } = mockClient({
      insertResult: { data: null, error: { code: "23503" } },
    })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1", Buffer.from("encrypted-bytes"))

    expect(result).toEqual({ ok: false, error: "invalid_lead" })
    expect(remove).toHaveBeenCalledWith([expect.stringMatching(/\.bin$/)])
    consoleSpy.mockRestore()
  })

  it("returns invalid_lead on a foreign key violation", async () => {
    const { from, storage } = mockClient({ insertResult: { data: null, error: { code: "23503" } } })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "invalid_lead" })
    consoleSpy.mockRestore()
  })

  it("returns invalid_hours on a check violation naming the hours constraint", async () => {
    const { from, storage } = mockClient({
      insertResult: { data: null, error: { code: "23514", message: 'violates check constraint "contracts_hours_positive"' } },
    })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "invalid_hours" })
    consoleSpy.mockRestore()
  })

  it("returns invalid_amount on a check violation naming the amount constraint", async () => {
    const { from, storage } = mockClient({
      insertResult: { data: null, error: { code: "23514", message: 'violates check constraint "contracts_amount_positive"' } },
    })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "invalid_amount" })
    consoleSpy.mockRestore()
  })

  it("returns unknown on any other error", async () => {
    const { from, storage } = mockClient({ insertResult: { data: null, error: { code: "99999" } } })
    const supabase = { from, storage } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createContract(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })

  it("never lets input override created_by", async () => {
    const { from, insert, storage } = mockClient({ insertResult: { data: { id: "contract-1" }, error: null } })
    const supabase = { from, storage } as never

    await createContract(supabase, { ...input, created_by: "someone-else" } as never, "admin-1")

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "admin-1" }))
  })
})
