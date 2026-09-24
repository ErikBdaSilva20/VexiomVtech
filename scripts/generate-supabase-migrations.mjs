#!/usr/bin/env node
// Concatenates every file in supabase/migrations/ (in filename order) into
// supabase/migrations.sql, each section headed by a comment with the source
// filename. Run via `pnpm db:migrations`.
//
// supabase/migrations.sql is generated output — never hand-edit it. To
// change the schema, add a new numbered file under supabase/migrations/ and
// re-run this script.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..")
const migrationsDir = join(repoRoot, "supabase", "migrations")
const outputFile = join(repoRoot, "supabase", "migrations.sql")

if (!existsSync(migrationsDir)) {
  console.error(`No .sql files found in ${migrationsDir}`)
  process.exit(1)
}

const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()

if (migrationFiles.length === 0) {
  console.error(`No .sql files found in ${migrationsDir}`)
  process.exit(1)
}

const header = [
  "-- GENERATED FILE — do not hand-edit.",
  "-- Produced by scripts/generate-supabase-migrations.mjs from every file in",
  "-- supabase/migrations/, concatenated in filename order. Paste this whole",
  "-- file into the Supabase SQL editor to apply all migrations in one shot.",
  "-- To change the schema, add a new numbered file under supabase/migrations/",
  "-- and re-run `pnpm db:migrations`.",
  "",
].join("\n")

const sections = migrationFiles.map((file) => {
  const contents = readFileSync(join(migrationsDir, file), "utf8").trimEnd()
  return `-- ---------------------------------------------------------------------------\n-- Source: supabase/migrations/${file}\n-- ---------------------------------------------------------------------------\n\n${contents}\n`
})

writeFileSync(outputFile, `${header}\n${sections.join("\n")}`)

console.log(
  `Wrote ${outputFile} from ${migrationFiles.length} migration file(s): ${migrationFiles.join(", ")}`
)
