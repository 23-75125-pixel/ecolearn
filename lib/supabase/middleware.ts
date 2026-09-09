import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase auth session on every request and returns both the
 * (possibly updated) response and a Supabase client bound to it, so proxy.ts
 * can also read the user's role for route protection. Named for the
 * `middleware.ts` -> `proxy.ts` rename in Next.js 16 — logic lives here so
 * proxy.ts stays a thin entry point.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  // IMPORTANT: do not remove. This revalidates the session against Supabase
  // Auth (not just the local JWT), which is what actually refreshes an
  // expiring session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
