import Link from "next/link"

import type { BlogPost } from "@/data/blog-content"

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <time className="blog-card-date" dateTime={post.publishedAt}>
        {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </time>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
    </Link>
  )
}
