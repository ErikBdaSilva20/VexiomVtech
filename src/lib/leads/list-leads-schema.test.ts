import { describe, expect, it } from "vitest"

import { listLeadsQuerySchema } from "./list-leads-schema"

describe("listLeadsQuerySchema", () => {
  it("applies defaults when nothing is provided", () => {
    const result = listLeadsQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ page: 1, page_size: 20 })
    }
  })

  it("normalizes empty-string filters to undefined", () => {
    const result = listLeadsQuerySchema.safeParse({ search: "", status: "" })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBeUndefined()
      expect(result.data.status).toBeUndefined()
    }
  })

  it("trims and keeps a valid search term", () => {
    const result = listLeadsQuerySchema.safeParse({ search: "  erik  " })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBe("erik")
    }
  })

  it("coerces page and page_size from strings (query params)", () => {
    const result = listLeadsQuerySchema.safeParse({ page: "2", page_size: "50" })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.page_size).toBe(50)
    }
  })

  it("rejects a page_size above the max", () => {
    const result = listLeadsQuerySchema.safeParse({ page_size: 500 })

    expect(result.success).toBe(false)
  })

  it("rejects a page below 1", () => {
    const result = listLeadsQuerySchema.safeParse({ page: 0 })

    expect(result.success).toBe(false)
  })

  it("rejects an assigned_to that isn't a UUID", () => {
    const result = listLeadsQuerySchema.safeParse({ assigned_to: "not-a-uuid" })

    expect(result.success).toBe(false)
  })

  it("accepts a valid assigned_to UUID", () => {
    const result = listLeadsQuerySchema.safeParse({
      assigned_to: "11111111-1111-4111-8111-111111111111",
    })

    expect(result.success).toBe(true)
  })
})
