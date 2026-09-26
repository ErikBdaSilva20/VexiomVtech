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
  href: "/contato",
}

export const HERO_PRIMARY_CTA = {
  label: "Agendar conversa",
  href: "/contato",
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
  /** Investment is defined after the project scope is understood. */
  investmentNote?: string
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
    title: "Seu site não deixa claro por que escolher você",
    description:
      "Quando a proposta não aparece rápido, o cliente em potencial segue para quem parece mais fácil de entender.",
    impact: "Impacto: a oportunidade se perde antes do primeiro contato.",
  },
  {
    icon: "link",
    index: "03",
    kicker: "FERRAMENTAS DESCONECTADAS",
    title: "Sua equipe trabalha com dados espalhados",
    description:
      "Vendas, atendimento e operação rodam separados, e a informação demora a chegar a quem precisa decidir.",
    impact: "Impacto: retrabalho, erro de dado e decisão tomada no escuro.",
  },
  {
    icon: "trending-up",
    index: "04",
    kicker: "CRESCIMENTO SEM ESTRUTURA",
    title: "O improviso começou a travar o crescimento",
    description:
      "O que dava conta no começo trava a operação assim que o volume de clientes aumenta de verdade.",
    impact: "Impacto: a empresa cresce, mas o caos cresce junto.",
  },
]

export const PROBLEMS_BRIDGE_CTA = {
  label: "Quero resolver meu cenário",
  href: "/contato",
}

export interface ResolutionItem {
  index: string
  category: string
  title: string
  description: string
  outcome: string
}

/** Three initial solution fronts shown on the home page. */
export const RESOLUTIONS: ResolutionItem[] = [
  {
    index: "01",
    category: "SITES E SISTEMAS",
    title: "Uma presença e uma operação que funcionam.",
    description:
      "Criamos sites e sistemas sob medida para explicar melhor o seu negócio e organizar o que acontece por trás dele.",
    outcome: "Para apresentar, atender e operar com mais clareza.",
  },
  {
    index: "02",
    category: "AUTOMAÇÕES COM IA",
    title: "Mais tempo para o que faz seu negócio avançar.",
    description:
      "Automatizamos tarefas repetitivas e conectamos processos para sua equipe trabalhar com menos retrabalho.",
    outcome: "Para transformar horas operacionais em tempo útil.",
  },
  {
    index: "03",
    category: "LOJAS VIRTUAIS",
    title: "Uma venda online mais simples.",
    description:
      "Criamos lojas e fluxos de compra que ajudam o cliente a encontrar, escolher e finalizar sem atrito.",
    outcome: "Para transformar interesse em pedido.",
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
    title: "Entrega e orientação",
    description:
      "Orientação no uso da solução e suporte opcional depois do lançamento.",
    detail:
      "Orientação para usar a solução no dia a dia. Depois do lançamento, você pode contratar suporte contínuo por R$ 30/mês.",
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
      "Cada etapa é validada com você antes de avançar para a próxima, se mesmo assim você não gostar do resultado, podemos conversar novamente para realinharmos o escopo.",
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
    href: "/contato",
    kicker: "PRESENÇA DIGITAL",
    problemFit:
      "Ideal quando seu site atual afasta em vez de convencer, ou quando ainda não existe nenhuma presença online.",
    investmentNote: "Definido após entender o escopo",
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
    href: "/contato",
    featured: true,
    kicker: "OPERAÇÃO",
    problemFit:
      "Ideal quando sua operação depende de planilha, retrabalho manual ou sistemas que não conversam entre si.",
    investmentNote: "Definido após entender o escopo",
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
    href: "/contato",
    kicker: "VENDAS ONLINE",
    problemFit:
      "Ideal quando você quer vender pela internet sem depender só de rede social ou marketplace.",
    investmentNote: "Definido após entender o escopo",
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
    href: "/contato",
    kicker: "AUTOMAÇÃO COM IA",
    problemFit:
      "Ideal quando uma tarefa repetitiva do seu dia a dia já tem um padrão claro e só falta automatizar.",
    investmentNote: "Definido após entender o escopo",
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
    "Depois da entrega, você pode contratar suporte contínuo por R$ 30/mês para manter a solução em dia, sem taxa obrigatória e sem letra miúda.",
}
