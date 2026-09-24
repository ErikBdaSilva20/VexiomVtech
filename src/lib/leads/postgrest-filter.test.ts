import { describe, expect, it } from "vitest"

import { escapeIlikeOrFilterValue } from "./postgrest-filter"

describe("escapeIlikeOrFilterValue", () => {
  it("leaves plain text untouched", () => {
    expect(escapeIlikeOrFilterValue("Erik Silva")).toBe("Erik Silva")
  })

  it("escapes a comma so it can't terminate the or() condition early", () => {
    expect(escapeIlikeOrFilterValue("a,status.eq.novo_lead")).toBe(
      "a\\,status\\.eq\\.novo\\_lead"
    )
  })

  it("escapes parentheses so they can't open/close a filter group", () => {
    expect(escapeIlikeOrFilterValue("a)or(id.neq.0")).toBe("a\\)or\\(id\\.neq\\.0")
  })

  it("escapes dots so they can't introduce a new column.operator segment", () => {
    expect(escapeIlikeOrFilterValue("name.eq.x")).toBe("name\\.eq\\.x")
  })

  it("escapes ilike wildcards % and _ so they match literally", () => {
    expect(escapeIlikeOrFilterValue("100%_done")).toBe("100\\%\\_done")
  })

  it("escapes a literal backslash first, so a trailing one can't swallow the next escape", () => {
    expect(escapeIlikeOrFilterValue("a\\,b")).toBe("a\\\\\\,b")
  })
})
