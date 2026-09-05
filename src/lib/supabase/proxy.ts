import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { isListedAdmin } from "@/src/lib/auth/admin-membership";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/env-public";

/**
 * Refresh the Auth session cookies and gate `/admin` routes.
 * Public portfolio paths are left untouched when this is only matched for `/admin`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Validate JWT — do not use getSession() for authorization.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/admin/login";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  let isAdmin = false;
  if (user) {
    const { data: membership } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = isListedAdmin(membership, user.id);
  }

  if (isAdminPath && !isLogin && !isAdmin) {
    const url = request.nextUrl.clone();
    if (!user) {
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
    } else {
      url.pathname = "/";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  if (isLogin && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/projects";
    return NextResponse.redirect(url);
  }

  supabaseResponse.headers.set("Cache-Control", "private, no-store");
  return supabaseResponse;
}
