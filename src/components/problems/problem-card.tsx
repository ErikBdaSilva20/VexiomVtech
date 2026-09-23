import type { ProblemItem } from "@/data/home-content"

interface ProblemCardProps {
  problem: ProblemItem
}

/** One diagnostic card — icon, index badge, kicker, title, description, impact line. */
export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <article className="problem-card">
      <svg className="icon problem-icon" aria-hidden="true">
        <use href={`#${problem.icon}`} />
      </svg>
      <p className="problem-index" aria-hidden="true">
        {problem.index}
      </p>
      <p className="problem-kicker">{problem.kicker}</p>
      <h3>{problem.title}</h3>
      <p className="problem-detail">{problem.description}</p>
      <p className="problem-impact">{problem.impact}</p>
    </article>
  )
}
