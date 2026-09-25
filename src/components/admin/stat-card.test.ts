import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { StatCard } from "./stat-card"

describe("StatCard", () => {
  it("renders label and value", () => {
    const html = renderToStaticMarkup(createElement(StatCard, { label: "Leads no período", value: "42" }))

    expect(html).toContain("Leads no período")
    expect(html).toContain("42")
  })

  it("renders an optional hint and trend when provided", () => {
    const html = renderToStaticMarkup(
      createElement(StatCard, {
        label: "Saldo do período",
        value: "R$ 100,00",
        hint: "Consolidado do mês",
        trend: { direction: "up", label: "Positivo" },
      })
    )

    expect(html).toContain("Consolidado do mês")
    expect(html).toContain("Positivo")
  })

  it("omits hint and trend markup when not provided", () => {
    const html = renderToStaticMarkup(createElement(StatCard, { label: "Total", value: "0" }))

    expect(html).not.toContain("Positivo")
  })
})
