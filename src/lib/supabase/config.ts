export function normalizeSupabaseUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.origin : "";
  } catch { return ""; }
}

export const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
export const hasSupabaseAuthConfig = Boolean(supabaseUrl && supabasePublishableKey);
