import Link from "next/link"

import type { BlogPost } from "@/data/blog-content"

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block px-[calc(26*var(--unit))] py-[calc(21*var(--unit))] border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#1113106b,#10110f3b)] transition-[border-color,background-color] duration-[180ms] hover:border-[#8b7b17] hover:bg-[#1c1d15]"
    >
      <time
        className="block text-vexiom-yellow text-[calc(11*var(--unit))] font-[550] tracking-[0.1em] uppercase"
        dateTime={post.publishedAt}
      >
        {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </time>
      <h2 className="mt-[calc(10*var(--unit))] text-[calc(16*var(--unit))] font-bold tracking-[-0.03em]">
        {post.title}
      </h2>
      <p className="mt-[calc(8*var(--unit))] text-[#c6c6c8] text-[calc(13*var(--unit))] leading-[calc(20*var(--unit))]">
        {post.excerpt}
      </p>
    </Link>
  )
}
