import { describe, expect, it } from "vitest"

import { classifyWriteContractError } from "./write-contract-error"

describe("classifyWriteContractError", () => {
  it("classifies a foreign key violation as invalid_lead", () => {
    expect(classifyWriteContractError({ code: "23503" })).toBe("invalid_lead")
  })

  it("classifies a check violation on the hours constraint as invalid_hours", () => {
    expect(
      classifyWriteContractError({
        code: "23514",
        message: 'new row for relation "contracts" violates check constraint "contracts_hours_positive"',
      })
    ).toBe("invalid_hours")
  })

  it("classifies a check violation on the amount constraint as invalid_amount", () => {
    expect(
      classifyWriteContractError({
        code: "23514",
        message: 'new row for relation "contracts" violates check constraint "contracts_amount_positive"',
      })
    ).toBe("invalid_amount")
  })

  it("classifies a check violation with no message as invalid_amount", () => {
    expect(classifyWriteContractError({ code: "23514" })).toBe("invalid_amount")
  })

  it("classifies anything else as unknown", () => {
    expect(classifyWriteContractError({ code: "99999" })).toBe("unknown")
  })

  it("classifies a null error as unknown", () => {
    expect(classifyWriteContractError(null)).toBe("unknown")
  })
})
