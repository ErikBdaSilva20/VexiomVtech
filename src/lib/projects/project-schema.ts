import { z } from "zod"

const MAX_SHORT_TEXT = 200

const PROJECT_STATUSES = ["em_andamento", "concluido", "cancelado"] as const

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres.`)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
}

function optionalUuid() {
  return z
    .string()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(z.uuid("Lead inválido.").nullable())
}

function optionalDate() {
  return z
    .string()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(z.iso.date("Data inválida.").nullable())
}

/**
 * Shared fields for both create and update (FR34/5.1). `status` defaults to
 * `em_andamento` on create; the `finished_at` requirement below applies to
 * both paths so an update can't silently move a project to `concluido`
 * without recording when it finished.
 */
// Applied to both create/update via `superRefine` below — checks both the
// concluido/finished_at pairing and date ordering in one pass so field-level
// errors don't overwrite each other.
function checkDates(
  data: { status: (typeof PROJECT_STATUSES)[number]; started_at: string | null; finished_at: string | null },
  ctx: z.RefinementCtx
) {
  if (data.status === "concluido" && data.finished_at === null) {
    ctx.addIssue({
      code: "custom",
      message: "Data de conclusão é obrigatória para projetos concluídos.",
      path: ["finished_at"],
    })
  }
  if (data.started_at !== null && data.finished_at !== null && data.finished_at < data.started_at) {
    ctx.addIssue({
      code: "custom",
      message: "Data de conclusão não pode ser anterior à data de início.",
      path: ["finished_at"],
    })
  }
}

const projectFieldsSchema = z
  .object({
    title: z.string().trim().min(1, "Título é obrigatório.").max(MAX_SHORT_TEXT),
    client_name: optionalText(MAX_SHORT_TEXT),
    lead_id: optionalUuid(),
    status: z.enum(PROJECT_STATUSES).default("em_andamento"),
    started_at: optionalDate(),
    finished_at: optionalDate(),
  })
  .superRefine(checkDates)

export const createProjectSchema = projectFieldsSchema

export const updateProjectSchema = z
  .object({
    project_id: z.uuid("Projeto inválido."),
    title: z.string().trim().min(1, "Título é obrigatório.").max(MAX_SHORT_TEXT),
    client_name: optionalText(MAX_SHORT_TEXT),
    lead_id: optionalUuid(),
    status: z.enum(PROJECT_STATUSES),
    started_at: optionalDate(),
    finished_at: optionalDate(),
  })
  .superRefine(checkDates)

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
