import { describe, expect, it, vi } from "vitest"

import { fetchAllPages } from "./paginate-transactions"

describe("fetchAllPages", () => {
  it("returns a single page unmodified when under the page size", async () => {
    const buildPage = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })

    const result = await fetchAllPages(buildPage)

    expect(result).toEqual([{ id: 1 }])
    expect(buildPage).toHaveBeenCalledTimes(1)
    expect(buildPage).toHaveBeenCalledWith(0, 999)
  })

  it("paginates until a short page is returned", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
    const lastPage = [{ id: 1000 }]
    const buildPage = vi
      .fn()
      .mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: lastPage, error: null })

    const result = await fetchAllPages(buildPage)

    expect(result).toHaveLength(1001)
    expect(buildPage).toHaveBeenNthCalledWith(1, 0, 999)
    expect(buildPage).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it("returns an empty array when the first page is empty", async () => {
    const buildPage = vi.fn().mockResolvedValue({ data: [], error: null })

    const result = await fetchAllPages(buildPage)

    expect(result).toEqual([])
    expect(buildPage).toHaveBeenCalledTimes(1)
  })

  it("throws a user-facing error when the first page fails", async () => {
    const buildPage = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(fetchAllPages(buildPage)).rejects.toThrow(
      "Não foi possível carregar os lançamentos financeiros."
    )
    consoleSpy.mockRestore()
  })

  it("throws instead of returning a partial result when a later page fails", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
    const buildPage = vi
      .fn()
      .mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(fetchAllPages(buildPage)).rejects.toThrow(
      "Não foi possível carregar os lançamentos financeiros."
    )
    expect(buildPage).toHaveBeenCalledTimes(2)
    consoleSpy.mockRestore()
  })
})
