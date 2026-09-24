export default function LeadsLoading() {
  return (
    <main className="min-h-screen bg-[#0c0e0c] px-4 py-6 text-[#f3f5f1] sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-7xl animate-pulse" role="status" aria-label="Carregando seção de leads">
        <div className="mb-8 h-12 border-b border-[#282d27]" />
        <div className="mb-7 flex items-end justify-between gap-6 border-b border-[#282d27] pb-7">
          <div className="w-full max-w-xl">
            <div className="h-3 w-32 rounded bg-[#31372f]" />
            <div className="mt-4 h-10 w-48 rounded bg-[#252a24]" />
            <div className="mt-3 h-4 w-full rounded bg-[#20241f]" />
          </div>
          <div className="hidden h-11 w-36 rounded-lg bg-[#4b4215] sm:block" />
        </div>
        <div className="mb-8 grid gap-4 rounded-2xl border border-[#30362e] bg-[#171a17] p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="h-3 w-28 rounded bg-[#4b4215]" />
            <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#252a24]" />
          </div>
          <div className="h-12 rounded-lg bg-[#101210]" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-2xl border border-[#30362e] bg-[#171a17]" />
          ))}
        </div>
        <p className="mt-5 text-sm text-[#9fa69c]">Carregando seção…</p>
      </div>
    </main>
  )
}
