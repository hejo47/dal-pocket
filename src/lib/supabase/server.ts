import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabasePublishableKey } from "./config";

export async function createClient() {
  const url = supabaseUrl;
  const key = supabasePublishableKey;
  if (!url || !key) throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server components cannot set cookies; the API/proxy refreshes sessions. */ }
      },
    },
  });
}
