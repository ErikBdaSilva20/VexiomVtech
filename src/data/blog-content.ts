/**
 * Single source of truth for blog posts. No CMS/backend exists yet, so
 * posts live here as static data — same pattern as home-content.ts.
 * Swap for a CMS fetch later without touching the page components: they
 * only depend on this module's exported shape.
 */

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "por-que-automatizar-processos-manuais",
    title: "Por que automatizar processos manuais",
    excerpt:
      "Planilhas e retrabalho custam mais do que parecem. Entenda o impacto real de operar sem automação.",
    content:
      "Toda operação que depende de planilhas e processos manuais paga um preço invisível: tempo. Esse tempo, somado ao longo dos meses, é o que separa negócios que escalam dos que travam. Automatizar não é sobre tecnologia pela tecnologia — é sobre devolver horas para o que gera resultado.",
    publishedAt: "2026-01-15",
  },
]

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}
