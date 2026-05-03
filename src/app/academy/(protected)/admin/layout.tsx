import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus_Jakarta_Sans } from "next/font/google";
import AcademyHeader from "@/components/academy/AcademyHeader";
import { AdminSidebar, AdminBottomNav } from "@/components/academy/AdminNav";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-admin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function AcademyAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy/dashboard");

  return (
    <div
      className={`${jakarta.variable} min-h-screen bg-[#0a1628]`}
      style={{ "--font-cinzel": "var(--font-admin)", "--font-crimson": "var(--font-admin)" } as React.CSSProperties}
    >
      <AcademyHeader user={profile} />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-52 bg-[#0a1628] border-r border-white/5 z-40 pt-8 pb-6 px-3">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/50 mb-5 px-2">
          Admin
        </p>
        <AdminSidebar />
        <div className="border-t border-white/5 pt-4 px-2 mt-4">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600 truncate">
            {profile?.full_name ?? profile?.email}
          </p>
          <p className="font-cinzel text-[9px] text-[#C5A059]/40 mt-0.5">Administrador</p>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1628]/98 backdrop-blur-xl border-t border-white/5 flex">
        <AdminBottomNav />
      </nav>

      {/* Main content */}
      <div className="lg:pl-52 pt-16 pb-20 lg:pb-0 min-h-screen">
        {children}
      </div>
    </div>
  );
}
