import Link from "next/link"

import type { AdminRole } from "@/lib/supabase/database.types"

type Section = "overview" | "leads" | "cases" | "projects" | "financeiro" | "contracts"

const LINKS: { section: Section; label: string; href: string; superAdminOnly: boolean }[] = [
  { section: "overview", label: "Visão geral", href: "/painel-8f2k", superAdminOnly: false },
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
    <nav aria-label="Seções do painel" className="-mx-1 mb-6 overflow-x-auto border-b border-[#292b28] px-1 sm:mb-8">
      <ul className="flex min-w-max list-none gap-0.5 p-0 sm:gap-1">
        {LINKS.filter((item) => !item.superAdminOnly || role === "super_admin").map((item) => (
          <li key={item.section}>
            <Link
              href={item.href}
              prefetch={false}
              aria-current={active === item.section ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#fbd020] sm:px-4 " +
                (active === item.section ? "text-[#fbd020]" : "text-[#a6a7a0] hover:text-white")
              }
            >
              <span
                className={
                  active === item.section
                    ? "underline decoration-2 underline-offset-[14px]"
                    : "decoration-transparent"
                }
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
