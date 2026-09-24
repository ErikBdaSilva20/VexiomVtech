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

export const HERO_PRIMARY_CTA = {
  label: "Agendar conversa",
  href: `mailto:${CONTACT_EMAIL}?subject=Agendar%20uma%20conversa`,
}

export const HERO_SECONDARY_CTA = {
  label: "Ver soluções",
  href: "#o-que-resolvemos",
}

export type ServiceIconId = "monitor" | "settings" | "cart" | "brain"

export interface ServiceItem {
  icon: ServiceIconId
  title: string
  /** Two lines, rendered with a <br /> between them, matching the reference. */
  description: [string, string]
  href: string
  featured?: boolean
  /**
   * Fields below are only rendered on the /servicos detail page. Kept on the
   * same item instead of a parallel array so service facts (price, scope)
   * never drift from the card shown on the home page.
   */
  kicker?: string
  /** One line naming the situation this service is the right fit for. */
  problemFit?: string
  /** Indicative floor, e.g. "A partir de R$ 650". Never a closed price. */
  startingPrice?: string
  timeline?: string
  includes?: string[]
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
    title: "Seu dia vira apagar incêndio, não vender",
    description:
      "Planilha, retrabalho e processo manual consomem as horas que deveriam estar em atender e fechar clientes.",
    impact: "Impacto: cada hora manual é uma hora a menos vendendo.",
  },
  {
    icon: "monitor",
    index: "02",
    kicker: "PRESENÇA DIGITAL",
    title: "Seu site faz o cliente desconfiar",
    description:
      "Sem clareza sobre o que você oferece, o cliente em potencial escolhe o concorrente que parece mais confiável.",
    impact: "Impacto: a oportunidade se perde antes do primeiro contato.",
  },
  {
    icon: "link",
    index: "03",
    kicker: "FERRAMENTAS DESCONECTADAS",
    title: "Cada sistema tem uma versão da verdade",
    description:
      "Vendas, atendimento e operação rodam separados, e a informação se perde de um time para o outro.",
    impact: "Impacto: retrabalho, erro de dado e decisão tomada no escuro.",
  },
  {
    icon: "trending-up",
    index: "04",
    kicker: "CRESCIMENTO SEM ESTRUTURA",
    title: "Crescer expôs o que era improviso",
    description:
      "O que dava conta no começo trava a operação assim que o volume de clientes aumenta de verdade.",
    impact: "Impacto: a empresa cresce, mas o caos cresce junto.",
  },
]

export const PROBLEMS_BRIDGE_CTA = {
  label: "Quero resolver meu cenário",
  href: `mailto:${CONTACT_EMAIL}?subject=Quero%20analisar%20meu%20cen%C3%A1rio`,
}

export interface ResolutionItem {
  index: string
  category: string
  title: string
  description: string
  outcome: string
}

/** Business outcomes shown in the third Home section, before technical details. */
export const RESOLUTIONS: ResolutionItem[] = [
  {
    index: "01",
    category: "Presença digital",
    title: "Uma presença que transmite confiança.",
    description:
      "Transformamos serviços e ideias em experiências digitais claras, rápidas e fáceis de encontrar.",
    outcome: "Para ser encontrado, entendido e escolhido.",
  },
  {
    index: "02",
    category: "Operação",
    title: "Rotinas que não travam o seu dia.",
    description:
      "Organizamos processos, sistemas e automações para reduzir retrabalho e manter a informação no lugar certo.",
    outcome: "Para sobrar tempo para o que faz o negócio avançar.",
  },
  {
    index: "03",
    category: "Vendas online",
    title: "Uma jornada de compra mais simples.",
    description:
      "Criamos lojas e fluxos digitais que tornam mais fácil apresentar, vender e atender pela internet.",
    outcome: "Para transformar interesse em oportunidade real.",
  },
  {
    index: "04",
    category: "Crescimento",
    title: "Estrutura para evoluir sem perder o controle.",
    description:
      "Construímos soluções sob medida para validar ideias, conectar ferramentas e acompanhar a próxima fase do negócio.",
    outcome: "Para crescer com clareza, não com improviso.",
  },
]

export type WorkStepIconId = "message-circle" | "compass" | "code" | "shield-check"

export interface WorkStepItem {
  icon: WorkStepIconId
  /** "01" – "04", rendered as a small badge on the step. */
  index: string
  title: string
  description: string
  /** Longer explanation, only rendered on the /como-trabalhamos detail page. */
  detail?: string
}

/** The four-step process shown in the "Como trabalhamos" Home section. */
export const WORK_STEPS: WorkStepItem[] = [
  {
    icon: "message-circle",
    index: "01",
    title: "Conversa inicial",
    description:
      "Entendemos o problema na raiz antes de falar de tecnologia ou solução.",
    detail:
      "Conversa gratuita de até 60 minutos, por vídeo ou chamada, para entender o problema, o contexto do negócio e o que já foi tentado antes.",
  },
  {
    icon: "compass",
    index: "02",
    title: "Definição da solução",
    description:
      "Escopo, prioridades e prazos claros, alinhados ao resultado que você precisa.",
    detail:
      "Você recebe um escopo por escrito com o que entra na primeira versão, o prazo estimado e o investimento, sem letra miúda escondida.",
  },
  {
    icon: "code",
    index: "03",
    title: "Desenvolvimento",
    description:
      "Construção com atualizações frequentes, sem surpresas até a entrega.",
    detail:
      "Atualizações frequentes durante a construção, com as decisões importantes validadas com você antes de seguir em frente.",
  },
  {
    icon: "shield-check",
    index: "04",
    title: "Entrega e suporte",
    description:
      "Orientação no uso da solução e acompanhamento contínuo depois do lançamento.",
    detail:
      "Orientação para usar a solução no dia a dia, com a opção de manter suporte contínuo por R$ 30/mês depois do lançamento.",
  },
]

export interface FaqItem {
  question: string
  answer: string
}

/** Frequently asked questions shown at the end of /como-trabalhamos. */
export const HOW_WE_WORK_FAQS: FaqItem[] = [
  {
    question: "Quanto tempo leva um projeto?",
    answer:
      "Depende do tipo de solução e do escopo. Sites levam de 1 a 2 semanas e lojas online de 2 a 3 semanas. Sistemas e automações variam conforme a complexidade e o prazo é definido já na conversa inicial.",
  },
  {
    question: "Atendem empresas fora da minha cidade?",
    answer:
      "Sim. Atendemos clientes de todo o Brasil, sempre à distância, com comunicação clara durante todo o projeto.",
  },
  {
    question: "Preciso entender de tecnologia para contratar?",
    answer:
      "Não. Você explica o problema e o objetivo do negócio, e a Vexiom cuida da parte técnica, traduzindo tudo em decisões simples de entender.",
  },
  {
    question: "E se eu não gostar do resultado no meio do caminho?",
    answer:
      "Cada etapa é validada com você antes de avançar para a próxima, então ajustes acontecem ao longo da construção, não só no final.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "As condições de pagamento são definidas na proposta comercial, depois de entendermos o escopo do seu projeto na conversa inicial.",
  },
]

export const SERVICES: ServiceItem[] = [
  {
    icon: "monitor",
    title: "Sites e Landing Pages",
    description: ["Presença digital que", "gera oportunidades."],
    href: `mailto:${CONTACT_EMAIL}?subject=Sites%20e%20Landing%20Pages`,
    kicker: "PRESENÇA DIGITAL",
    problemFit:
      "Ideal quando seu site atual afasta em vez de convencer, ou quando ainda não existe nenhuma presença online.",
    startingPrice: "A partir de R$ 650",
    timeline: "1 a 2 semanas",
    includes: [
      "Até 5 páginas, com design responsivo sob medida",
      "Formulário de contato integrado",
      "Otimização básica de velocidade e SEO",
      "Páginas extras além das 5 são orçadas à parte",
    ],
  },
  {
    icon: "settings",
    title: "Sistemas Sob Medida",
    description: ["Processos mais simples", "e negócios mais eficientes."],
    href: `mailto:${CONTACT_EMAIL}?subject=Sistemas%20Sob%20Medida`,
    featured: true,
    kicker: "OPERAÇÃO",
    problemFit:
      "Ideal quando sua operação depende de planilha, retrabalho manual ou sistemas que não conversam entre si.",
    startingPrice: "A partir de R$ 900",
    timeline: "Varia por escopo, definido na conversa",
    includes: [
      "Levantamento do processo antes de qualquer linha de código",
      "Desenvolvimento sob medida da primeira versão (V1)",
      "Acompanhamento durante a implantação",
      "Novas funcionalidades entram como evolução, orçadas à parte",
    ],
  },
  {
    icon: "cart",
    title: "Lojas Online",
    description: ["Venda mais com", "experiências que convertem."],
    href: `mailto:${CONTACT_EMAIL}?subject=Lojas%20Online`,
    kicker: "VENDAS ONLINE",
    problemFit:
      "Ideal quando você quer vender pela internet sem depender só de rede social ou marketplace.",
    startingPrice: "A partir de R$ 850",
    timeline: "2 a 3 semanas",
    includes: [
      "Catálogo de produtos",
      "Carrinho e checkout",
      "Integração de pagamento",
      "Até 5 páginas institucionais inclusas",
    ],
  },
  {
    icon: "brain",
    title: "Automações com IA",
    description: ["Mais tempo para o que", "realmente importa."],
    href: `mailto:${CONTACT_EMAIL}?subject=Automa%C3%A7%C3%B5es%20com%20IA`,
    kicker: "AUTOMAÇÃO COM IA",
    problemFit:
      "Ideal quando uma tarefa repetitiva do seu dia a dia já tem um padrão claro e só falta automatizar.",
    startingPrice: "A partir de R$ 550",
    timeline: "Varia por escopo",
    includes: [
      "Automação de um fluxo definido em conjunto com você",
      "Front-end necessário para operar a automação, quando fizer sentido",
      "Novos fluxos adicionais são orçados à parte",
    ],
  },
]

export const SUPPORT_PLAN = {
  price: "R$ 30/mês",
  description:
    "Depois da entrega, você pode manter a solução em dia com um suporte contínuo de baixo custo, sem taxa obrigatória e sem letra miúda.",
}
