import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes auth cookies via `next/headers`. `cookies()` is
 * async in Next.js 16, so this function is async too — always `await` it.
 *
 * Server Components can't set cookies, so the `setAll` call below will
 * throw when called from one; that's expected and safe to ignore as long
 * as `proxy.ts` is refreshing the session on every request (see proxy.ts).
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — no-op; proxy.ts handles
            // session refresh instead.
          }
        },
      },
    },
  );
}
