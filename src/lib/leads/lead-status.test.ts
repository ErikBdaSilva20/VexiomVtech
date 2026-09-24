import { describe, expect, it } from "vitest"

import { LEAD_STATUSES, leadStatusSchema } from "./lead-status"

describe("leadStatusSchema", () => {
  it.each(LEAD_STATUSES)("accepts %s", (status) => {
    expect(leadStatusSchema.safeParse(status).success).toBe(true)
  })

  it("rejects a value outside the defined list", () => {
    expect(leadStatusSchema.safeParse("inventado").success).toBe(false)
  })

  it("rejects mudanca_status — not a selectable commercial status", () => {
    expect(leadStatusSchema.safeParse("mudanca_status").success).toBe(false)
  })
})
