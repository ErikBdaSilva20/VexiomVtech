// Hand-written types matching the schema in supabase/setup.sql, which in
// turn follows docs/plans/08-integracao-supabase-e-area-administrativa.md
// verbatim. Keep this file in sync by hand whenever setup.sql changes (no
// Supabase CLI codegen is wired up yet).

export type AdminRole = "super_admin" | "employer"
export type LeadProbability = "baixa" | "media" | "alta"
export type LeadInteractionType =
  | "nota"
  | "mensagem_enviada"
  | "mensagem_recebida"
  | "mudanca_status"
export type LeadMeetingStatus = "agendada" | "realizada" | "cancelada"
export type ProjectStatus = "em_andamento" | "concluido" | "cancelado"
export type TransactionDirection = "entrada" | "saida"

type AdminUsersRow = {
  user_id: string
  role: AdminRole
  name: string | null
  created_at: string
}
type AdminUsersInsert = {
  user_id: string
  role: AdminRole
  name?: string | null
  created_at?: string
}
type AdminUsersUpdate = Partial<AdminUsersInsert>

type LeadsRow = {
  id: string
  created_at: string
  name: string
  company: string | null
  email: string
  whatsapp: string
  project_type: string
  description: string
  desired_deadline: string | null
  budget_range: string | null
  preferred_channel: string | null
  preferred_time: string | null
  status: string
  assigned_to: string | null
  viewed_at: string | null
  responded_at: string | null
  next_action: string | null
  next_action_at: string | null
  probability: LeadProbability | null
  tags: string[] | null
  non_conversion_reason: string | null
  source: string
  created_by: string | null
  possible_duplicate_of: string | null
  last_interaction_at: string | null
}
type LeadsInsert = {
  id?: string
  created_at?: string
  name: string
  company?: string | null
  email: string
  whatsapp: string
  project_type: string
  description: string
  desired_deadline?: string | null
  budget_range?: string | null
  preferred_channel?: string | null
  preferred_time?: string | null
  status?: string
  assigned_to?: string | null
  viewed_at?: string | null
  responded_at?: string | null
  next_action?: string | null
  next_action_at?: string | null
  probability?: LeadProbability | null
  tags?: string[] | null
  non_conversion_reason?: string | null
  source?: string
  created_by?: string | null
  possible_duplicate_of?: string | null
  last_interaction_at?: string | null
}
type LeadsUpdate = Partial<LeadsInsert>

type LeadInteractionsRow = {
  id: string
  lead_id: string
  author_id: string | null
  type: LeadInteractionType
  content: string
  occurred_at: string
}
type LeadInteractionsInsert = {
  id?: string
  lead_id: string
  author_id?: string | null
  type: LeadInteractionType
  content: string
  occurred_at?: string
}
type LeadInteractionsUpdate = Partial<LeadInteractionsInsert>

type LeadMeetingsRow = {
  id: string
  lead_id: string
  scheduled_at: string
  status: LeadMeetingStatus
  notes: string | null
  created_at: string | null
}
type LeadMeetingsInsert = {
  id?: string
  lead_id: string
  scheduled_at: string
  status?: LeadMeetingStatus
  notes?: string | null
  created_at?: string | null
}
type LeadMeetingsUpdate = Partial<LeadMeetingsInsert>

type ProjectsRow = {
  id: string
  title: string
  client_name: string | null
  lead_id: string | null
  status: ProjectStatus
  started_at: string | null
  finished_at: string | null
  created_at: string | null
}
type ProjectsInsert = {
  id?: string
  title: string
  client_name?: string | null
  lead_id?: string | null
  status?: ProjectStatus
  started_at?: string | null
  finished_at?: string | null
  created_at?: string | null
}
type ProjectsUpdate = Partial<ProjectsInsert>

type CasesRow = {
  id: string
  slug: string
  title: string
  category: string
  client_name: string | null
  is_founder_project: boolean
  project_id: string | null
  cover_image_url: string | null
  gallery_urls: string[] | null
  external_link: string | null
  description: string
  tech_stack: string[] | null
  problem_solved: string
  motivation: string
  published: boolean
  display_order: number
  created_at: string | null
  updated_at: string | null
}
type CasesInsert = {
  id?: string
  slug: string
  title: string
  category: string
  client_name?: string | null
  is_founder_project?: boolean
  project_id?: string | null
  cover_image_url?: string | null
  gallery_urls?: string[] | null
  external_link?: string | null
  description: string
  tech_stack?: string[] | null
  problem_solved: string
  motivation: string
  published?: boolean
  display_order?: number
  created_at?: string | null
  updated_at?: string | null
}
type CasesUpdate = Partial<CasesInsert>

type FinancialTransactionsRow = {
  id: string
  direction: TransactionDirection
  category: string
  amount: number
  occurred_at: string
  description: string
  project_id: string | null
  partner_id: string | null
  created_by: string
  created_at: string | null
}
type FinancialTransactionsInsert = {
  id?: string
  direction: TransactionDirection
  category: string
  amount: number
  occurred_at?: string
  description: string
  project_id?: string | null
  partner_id?: string | null
  created_by: string
  created_at?: string | null
}
type FinancialTransactionsUpdate = Partial<FinancialTransactionsInsert>

// `Relationships` (foreign-key metadata for embedded `select()` queries) and
// the schema-level `Views`/`Functions` maps are required by supabase-js's
// `GenericTable`/`GenericSchema` constraints even when unused — left empty
// here since this spec doesn't do relational embeds or call `.rpc()`.
export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUsersRow
        Insert: AdminUsersInsert
        Update: AdminUsersUpdate
        Relationships: []
      }
      leads: {
        Row: LeadsRow
        Insert: LeadsInsert
        Update: LeadsUpdate
        Relationships: []
      }
      lead_interactions: {
        Row: LeadInteractionsRow
        Insert: LeadInteractionsInsert
        Update: LeadInteractionsUpdate
        Relationships: []
      }
      lead_meetings: {
        Row: LeadMeetingsRow
        Insert: LeadMeetingsInsert
        Update: LeadMeetingsUpdate
        Relationships: []
      }
      projects: {
        Row: ProjectsRow
        Insert: ProjectsInsert
        Update: ProjectsUpdate
        Relationships: []
      }
      cases: {
        Row: CasesRow
        Insert: CasesInsert
        Update: CasesUpdate
        Relationships: []
      }
      financial_transactions: {
        Row: FinancialTransactionsRow
        Insert: FinancialTransactionsInsert
        Update: FinancialTransactionsUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
