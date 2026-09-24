import Image from "next/image"

function safeCaseImageUrl(raw: string | null) {
  if (!raw || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  try {
    const url = new URL(raw)
    const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    if (url.origin !== storageOrigin ||
      !url.pathname.startsWith("/storage/v1/object/public/case-images/")) return null
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

export function safeExternalCaseUrl(raw: string | null) {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

export function CaseImage({
  src,
  title,
  eager = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  src: string | null
  title: string
  eager?: boolean
  sizes?: string
}) {
  const safeSrc = safeCaseImageUrl(src)

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-[#32342f] bg-[#181a17]">
      {safeSrc ? (
        <Image
          src={safeSrc}
          alt={"Captura do projeto " + title}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_42%,#292d22_0%,#131513_66%)] text-[#fbd020]">
          <span aria-hidden="true" className="flex size-14 items-center justify-center border border-[#686330] text-3xl font-bold">V</span>
          <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#b8b9ae]">Projeto Vexiom</span>
        </div>
      )}
    </div>
  )
}
