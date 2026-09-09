import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Client Components. Uses the public anon key only —
 * every request is still subject to RLS. Create a fresh client per call
 * site rather than sharing one module-level instance, per @supabase/ssr's
 * guidance for the App Router.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
