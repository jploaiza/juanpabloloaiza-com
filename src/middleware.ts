import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/academy/:path*", "/admin", "/admin/:path*", "/api/admin/:path*", "/api/patients/:path*", "/api/calendar/:path*", "/api/crm-settings/:path*"],
};
