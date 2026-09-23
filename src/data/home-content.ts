/**
 * Single source of truth for every visible string and href on the home
 * page, copied verbatim from home-reference.html (the sole content source
 * of truth for this page — see spec-vexiom-home-page.md).
 */

export const CONTACT_EMAIL = "contato@vexiom.com.br"

export interface NavItem {
  label: string
  href: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "Cases", href: "/cases" },
  { label: "Como trabalhamos", href: "/como-trabalhamos" },
  { label: "Contato", href: "/contato" },
]

export const HEADER_CTA = {
  label: "Vamos conversar",
  href: `mailto:${CONTACT_EMAIL}?subject=Vamos%20conversar`,
}

export interface HeroStat {
  value: string
  label: string
}

export const HERO_STATS: HeroStat[] = [
  { value: "+50", label: "projetos entregues" },
  { value: "98%", label: "clientes satisfeitos" },
  { value: "4+ anos", label: "no mercado" },
]

export const HERO_PRIMARY_CTA = {
  label: "Agendar conversa",
  href: `mailto:${CONTACT_EMAIL}?subject=Agendar%20uma%20conversa`,
}

export const HERO_SECONDARY_CTA = {
  label: "Ver soluções",
  href: "#servicos",
}

export type ServiceIconId = "monitor" | "settings" | "cart" | "brain"

export interface ServiceItem {
  icon: ServiceIconId
  title: string
  /** Two lines, rendered with a <br /> between them, matching the reference. */
  description: [string, string]
  href: string
  featured?: boolean
}

export type ProblemIconId = "clock" | "monitor" | "link" | "trending-up"

export interface ProblemItem {
  icon: ProblemIconId
  /** "01" – "04", rendered as a small badge on the card. */
  index: string
  kicker: string
  title: string
  description: string
  impact: string
}

export const PROBLEMS: ProblemItem[] = [
  {
    icon: "clock",
    index: "01",
    kicker: "OPERAÇÃO MANUAL",
    title: "Tempo perdido em tarefas repetitivas",
    description:
      "Planilhas, retrabalho e processos manuais consomem horas que deveriam ir para o que gera resultado.",
    impact: "Impacto: menos tempo para vender e atender bem.",
  },
  {
    icon: "monitor",
    index: "02",
    kicker: "PRESENÇA DIGITAL",
    title: "Um site que não convence",
    description:
      "Sem uma presença digital clara, o cliente em potencial desconfia e escolhe o concorrente.",
    impact: "Impacto: oportunidades perdidas antes do primeiro contato.",
  },
  {
    icon: "link",
    index: "03",
    kicker: "FERRAMENTAS DESCONECTADAS",
    title: "Sistemas que não conversam entre si",
    description:
      "Vendas, atendimento e operação rodam em ferramentas separadas, e a informação se perde no caminho.",
    impact: "Impacto: retrabalho, erros e decisões tomadas às cegas.",
  },
  {
    icon: "trending-up",
    index: "04",
    kicker: "CRESCIMENTO SEM ESTRUTURA",
    title: "Crescer expõe a desorganização",
    description:
      "O que funcionava no início trava a operação assim que o volume de clientes aumenta.",
    impact: "Impacto: escala com dor, em vez de crescimento sustentável.",
  },
]

export const PROBLEMS_BRIDGE_CTA = {
  label: "Quero analisar meu cenário",
  href: `mailto:${CONTACT_EMAIL}?subject=Quero%20analisar%20meu%20cen%C3%A1rio`,
}

export const SERVICES: ServiceItem[] = [
  {
    icon: "monitor",
    title: "Sites e Landing Pages",
    description: ["Presença digital que", "gera oportunidades."],
    href: `mailto:${CONTACT_EMAIL}?subject=Sites%20e%20Landing%20Pages`,
  },
  {
    icon: "settings",
    title: "Sistemas Sob Medida",
    description: ["Processos mais simples", "e negócios mais eficientes."],
    href: `mailto:${CONTACT_EMAIL}?subject=Sistemas%20Sob%20Medida`,
    featured: true,
  },
  {
    icon: "cart",
    title: "Lojas Online",
    description: ["Venda mais com", "experiências que convertem."],
    href: `mailto:${CONTACT_EMAIL}?subject=Lojas%20Online`,
  },
  {
    icon: "brain",
    title: "Automações com IA",
    description: ["Mais tempo para o que", "realmente importa."],
    href: `mailto:${CONTACT_EMAIL}?subject=Automa%C3%A7%C3%B5es%20com%20IA`,
  },
]
