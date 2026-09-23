import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BLOG_POSTS, getBlogPostBySlug } from "@/data/blog-content"
import { PageHero } from "@/components/shared/page-hero"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) return {}

  return {
    title: `${post.title} — Vexiom`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) notFound()

  return (
    <>
      <PageHero eyebrow="Blog" title={post.title} />
      <section className="page-section">
        <p>{post.content}</p>
      </section>
    </>
  )
}
