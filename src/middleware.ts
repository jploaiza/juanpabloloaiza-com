import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // /blog?page=1 es un duplicado de /blog: redirección 301/308 real. (redirect() dentro de la
  // página llega como 200 porque el loading.tsx global ya empezó a transmitir, y el redirect
  // de next.config.ts conserva el query string y entra en bucle.)
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/blog") {
    if (searchParams.get("page") === "1") {
      const url = request.nextUrl.clone();
      searchParams.delete("page");
      url.search = searchParams.toString();
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }
  return await updateSession(request);
}

export const config = {
  matcher: ["/blog", "/academy/:path*", "/admin", "/admin/:path*", "/api/admin/:path*", "/api/patients/:path*", "/api/calendar/:path*", "/api/crm-settings/:path*"],
};
