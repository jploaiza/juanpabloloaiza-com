import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public academy routes (no auth required)
  const publicAcademyRoutes = [
    "/academy",
    "/academy/login",
    "/academy/register",
  ];
  const isPublicAcademy =
    publicAcademyRoutes.includes(path) ||
    path.startsWith("/academy/certificate/") ||
    path.startsWith("/academy/auth/");

  const isAcademyRoute = path.startsWith("/academy");
  const isProtectedAcademy = isAcademyRoute && !isPublicAcademy;

  if (isProtectedAcademy && !user) {
    const loginUrl = new URL("/academy/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin guard
  if (path.startsWith("/academy/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/academy/dashboard", request.url));
    }
  }

  // Redirect logged-in users away from login/register
  if (user && (path === "/academy/login" || path === "/academy/register")) {
    return NextResponse.redirect(new URL("/academy/dashboard", request.url));
  }

  return supabaseResponse;
}
