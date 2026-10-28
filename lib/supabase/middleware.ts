import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

<<<<<<< HEAD
const SUPABASE_REQUEST_TIMEOUT_MS = 5_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const timeout = AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;

  return fetch(input, { ...init, signal });
}

=======
>>>>>>> origin/main
/**
 * Refreshes the Supabase auth session on every request and returns both the
 * (possibly updated) response and a Supabase client bound to it, so proxy.ts
 * can also read the user's role for route protection. Named for the
 * `middleware.ts` -> `proxy.ts` rename in Next.js 16 — logic lives here so
 * proxy.ts stays a thin entry point.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
<<<<<<< HEAD
      global: { fetch: fetchWithTimeout },
=======
>>>>>>> origin/main
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

<<<<<<< HEAD
  // IMPORTANT: do not replace this with getSession(). A session read only
  // trusts the cookie; getUser() verifies the token with Supabase Auth before
  // this request is allowed to enter a protected role section.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { response, supabase, user: user ?? null, authError: error ?? null };
=======
  // IMPORTANT: do not remove. This revalidates the session against Supabase
  // Auth (not just the local JWT), which is what actually refreshes an
  // expiring session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
>>>>>>> origin/main
}
