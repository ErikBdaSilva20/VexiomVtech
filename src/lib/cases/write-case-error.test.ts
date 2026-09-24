import { describe, expect, it } from "vitest"

import { classifyWriteCaseError } from "./write-case-error"

describe("classifyWriteCaseError", () => {
  it("classifies a unique violation as duplicate_slug", () => {
    expect(classifyWriteCaseError({ code: "23505" })).toBe("duplicate_slug")
  })

  it("classifies a foreign key violation as invalid_project", () => {
    expect(classifyWriteCaseError({ code: "23503" })).toBe("invalid_project")
  })

  it("classifies anything else as unknown", () => {
    expect(classifyWriteCaseError({ code: "42501" })).toBe("unknown")
    expect(classifyWriteCaseError(null)).toBe("unknown")
  })
})
