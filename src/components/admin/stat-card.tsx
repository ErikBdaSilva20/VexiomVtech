export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string
  value: string
  hint?: string
  trend?: { direction: "up" | "down" | "neutral"; label: string }
}) {
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-300"
      : trend?.direction === "down"
        ? "text-[#ffb0a5]"
        : "text-[#a6a7a0]"

  return (
    <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
      <p className="text-xs font-medium text-[#aaa]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#85867f]">{hint}</p>}
      {trend && (
        <p className={"mt-1 text-xs font-medium " + trendColor}>{trend.label}</p>
      )}
    </div>
  )
}
