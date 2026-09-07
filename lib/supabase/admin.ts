import { createClient } from "@supabase/supabase-js"

function normalizeSecret(value: string | undefined) {
  return value
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\[nr]/g, "")
    .trim()
}

export function createAdminClient() {
  const supabaseUrl = normalizeSecret(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
  const serviceRoleKey = normalizeSecret(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  )

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
