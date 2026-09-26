import type { Metadata } from "next"

import { BLOG_POSTS } from "@/data/blog-content"
import { PageHero } from "@/components/shared/page-hero"
import { BlogPostCard } from "@/components/blog/blog-post-card"

export const metadata: Metadata = {
  title: "Blog - Vexiom",
  description:
    "Conteúdo sobre tecnologia, sistemas e automação para negócios que querem crescer com estrutura.",
}

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Conteúdo para quem constrói."
        description="Ideias, sistemas e automações explicados sem enrolação."
      />
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))]"
        aria-label="Lista de posts"
      >
        {BLOG_POSTS.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(calc(220*var(--unit)),1fr))] gap-[calc(13*var(--unit))]">
            {BLOG_POSTS.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p>Novos conteúdos em breve.</p>
        )}
      </section>
    </>
  )
}
