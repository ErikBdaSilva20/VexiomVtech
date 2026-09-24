// A `FormData` field that's absent (not present as a key at all) arrives as
// `null` — a plain <input> whose value is an empty string still arrives as
// `""`, which downstream schemas validate normally (most fields are
// required, so an explicit blank is a real validation error, not "unset").
export function textFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}
