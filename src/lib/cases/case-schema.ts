import { z } from "zod"

// Mirrors the admin form's own limits (case-editor.tsx maxLength attributes)
// — kept local to this domain rather than reusing lib/leads' constants,
// since the two happen to coincide today but aren't the same business rule.
const MAX_SHORT_TEXT = 200
const MAX_LONG_TEXT = 5000
const MAX_TECH_STACK_ITEMS = 30
const MAX_TECH_STACK_ITEM_LENGTH = 50

// Matches the `pattern` attribute on the admin form's slug input.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres.`)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
}

/**
 * `tech_stack` arrives as one comma-separated string from the admin form
 * (case-editor.tsx's single text input) — split, trim, and drop empty
 * entries here rather than pushing that parsing into the Server Action.
 */
const techStackSchema = z
  .string()
  .nullish()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  )
  .pipe(z.array(z.string().max(MAX_TECH_STACK_ITEM_LENGTH)).max(MAX_TECH_STACK_ITEMS))

/**
 * Shared fields for both create and update (FR27/4.1). `published` is
 * intentionally excluded from `createCaseSchema` — a new case is always a
 * draft (`published: false`) regardless of what the form sends; publishing
 * is something an admin does to an existing case via `updateCase`.
 */
const caseFieldsSchema = z.object({
  title: z.string().trim().min(1, "Nome é obrigatório.").max(MAX_SHORT_TEXT),
  slug: z
    .string()
    .trim()
    .min(1, "Endereço (slug) é obrigatório.")
    .max(MAX_SHORT_TEXT)
    .regex(SLUG_PATTERN, "Use apenas letras minúsculas, números e hífens."),
  category: z.string().trim().min(1, "Categoria é obrigatória.").max(MAX_SHORT_TEXT),
  client_name: optionalText(MAX_SHORT_TEXT),
  project_id: z
    .string()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(z.uuid("Projeto inválido.").nullable()),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(MAX_LONG_TEXT),
  problem_solved: z.string().trim().min(1, "Campo obrigatório.").max(MAX_LONG_TEXT),
  motivation: z.string().trim().min(1, "Campo obrigatório.").max(MAX_LONG_TEXT),
  external_link: z
    .union([z.url("Link inválido.").max(MAX_SHORT_TEXT, `Deve ter no máximo ${MAX_SHORT_TEXT} caracteres.`), z.literal("")])
    .nullish()
    .transform((value) => (value ? value : null)),
  tech_stack: techStackSchema,
  is_founder_project: z.boolean(),
  display_order: z.coerce.number().int("Deve ser um número inteiro.").min(0, "Não pode ser negativo."),
})

export const createCaseSchema = caseFieldsSchema

export const updateCaseSchema = caseFieldsSchema.extend({
  case_id: z.uuid("Case inválido."),
  published: z.boolean(),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>
