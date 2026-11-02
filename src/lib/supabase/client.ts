"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey } from "./config";

export function createClient() {
  const url = supabaseUrl;
  const key = supabasePublishableKey;
  if (!url || !key) throw new Error("SUPABASE_AUTH_NOT_CONFIGURED");
  return createBrowserClient(url, key);
}
