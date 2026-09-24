import { describe, expect, it } from "vitest"

import { listContractsQuerySchema } from "./list-contracts-schema"

describe("listContractsQuerySchema", () => {
  it("defaults page to 1 and page_size to 20", () => {
    const result = listContractsQuerySchema.parse({})

    expect(result).toEqual({ page: 1, page_size: 20 })
  })

  it("coerces string page/page_size to numbers", () => {
    const result = listContractsQuerySchema.parse({ page: "2", page_size: "10" })

    expect(result).toEqual({ page: 2, page_size: 10 })
  })

  it("rejects page below 1", () => {
    expect(() => listContractsQuerySchema.parse({ page: 0 })).toThrow()
  })

  it("rejects page_size above 100", () => {
    expect(() => listContractsQuerySchema.parse({ page_size: 101 })).toThrow()
  })

  it("rejects page_size below 1", () => {
    expect(() => listContractsQuerySchema.parse({ page_size: 0 })).toThrow()
  })

  it("has no search/filter fields beyond page and page_size", () => {
    const result = listContractsQuerySchema.parse({ page: 1, page_size: 20, search: "x", status: "y" })

    expect(Object.keys(result)).toEqual(["page", "page_size"])
  })
})
