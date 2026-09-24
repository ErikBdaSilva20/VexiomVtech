import Link from "next/link"

import type { AdminRole } from "@/lib/supabase/database.types"

type Section = "leads" | "cases" | "projects" | "financeiro" | "contracts"

const LINKS: { section: Section; label: string; href: string; superAdminOnly: boolean }[] = [
  { section: "leads", label: "Leads", href: "/painel-8f2k/leads", superAdminOnly: false },
  { section: "cases", label: "Cases", href: "/painel-8f2k/cases", superAdminOnly: true },
  { section: "projects", label: "Projetos", href: "/painel-8f2k/projetos", superAdminOnly: true },
  { section: "financeiro", label: "Financeiro", href: "/painel-8f2k/financeiro", superAdminOnly: true },
  { section: "contracts", label: "Contratos", href: "/painel-8f2k/contratos", superAdminOnly: true },
]

export function AdminNav({
  role,
  active,
}: {
  role: AdminRole
  active: Section
}) {
  return (
    <nav aria-label="Seções do painel" className="mb-8 overflow-x-auto border-b border-[#292b28]">
      <ul className="flex min-w-max list-none gap-1 p-0">
        {LINKS.filter((item) => !item.superAdminOnly || role === "super_admin").map((item) => (
          <li key={item.section}>
            <Link
              href={item.href}
              prefetch={false}
              aria-current={active === item.section ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#fbd020] " +
                (active === item.section
                  ? "border-[#fbd020] text-[#fbd020]"
                  : "border-transparent text-[#a6a7a0] hover:text-white")
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
