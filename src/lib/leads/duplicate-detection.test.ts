import { describe, expect, it, vi } from "vitest"

import { findDuplicateLeadId } from "./duplicate-detection"

type MatchResult = { id: string; created_at: string } | null

function mockSupabase({
  byEmail,
  byWhatsapp,
}: {
  byEmail: MatchResult
  byWhatsapp: MatchResult
}) {
  const from = vi.fn().mockImplementation(() => {
    let field: "email" | "whatsapp" | undefined

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((column: "email" | "whatsapp") => {
        field = column
        return builder
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => ({
        data: field === "email" ? byEmail : byWhatsapp,
        error: null,
      })),
    }

    return builder
  })

  return { from } as never
}

describe("findDuplicateLeadId", () => {
  it("returns null when no lead matches email or whatsapp", async () => {
    const supabase = mockSupabase({ byEmail: null, byWhatsapp: null })

    const result = await findDuplicateLeadId(supabase, {
      email: "new@example.com",
      whatsapp: "11999999999",
    })

    expect(result).toBeNull()
  })

  it("returns the matching lead id when only email matches", async () => {
    const supabase = mockSupabase({
      byEmail: { id: "lead-email", created_at: "2026-01-01T00:00:00Z" },
      byWhatsapp: null,
    })

    const result = await findDuplicateLeadId(supabase, {
      email: "existing@example.com",
      whatsapp: "11999999999",
    })

    expect(result).toBe("lead-email")
  })

  it("returns the matching lead id when only whatsapp matches", async () => {
    const supabase = mockSupabase({
      byEmail: null,
      byWhatsapp: { id: "lead-whatsapp", created_at: "2026-01-01T00:00:00Z" },
    })

    const result = await findDuplicateLeadId(supabase, {
      email: "new@example.com",
      whatsapp: "11988888888",
    })

    expect(result).toBe("lead-whatsapp")
  })

  it("returns the oldest match when both email and whatsapp match different leads", async () => {
    const supabase = mockSupabase({
      byEmail: { id: "lead-newer", created_at: "2026-02-01T00:00:00Z" },
      byWhatsapp: { id: "lead-older", created_at: "2026-01-01T00:00:00Z" },
    })

    const result = await findDuplicateLeadId(supabase, {
      email: "existing@example.com",
      whatsapp: "11988888888",
    })

    expect(result).toBe("lead-older")
  })

  it("returns null and does not throw when the underlying query errors", async () => {
    const from = vi.fn().mockImplementation(() => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } }),
      }
      return builder
    })

    const result = await findDuplicateLeadId({ from } as never, {
      email: "new@example.com",
      whatsapp: "11999999999",
    })

    expect(result).toBeNull()
  })
})
