import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import AcademyHeader from "@/components/academy/AcademyHeader";
import { LayoutDashboard, Users, FileText, BarChart2, Mail } from "lucide-react";

interface Props {
  children: ReactNode;
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/comunicaciones", label: "Comunicaciones", icon: Mail },
];

export default async function AdminLayout({ children }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/login");

  return (
    <div className="min-h-screen bg-[#020617]">
      <AcademyHeader user={profile} />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_0%,rgba(197,160,89,0.04),transparent)]" />

      {/* Sidebar — fixed desktop, hidden mobile */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-56 bg-[#020617] border-r border-white/5 z-40 pt-8 pb-6 px-4">
        <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-6 px-2">
          CRM Admin
        </p>

        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <AdminNavLink key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>

        <div className="border-t border-white/5 pt-4 px-2">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-600">
            {profile?.full_name ?? profile?.email}
          </p>
          <p className="font-cinzel text-[9px] text-[#C5A059]/40 mt-0.5">Administrador</p>
        </div>
      </aside>

      {/* Mobile nav bar at bottom */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/98 backdrop-blur-xl border-t border-white/5 flex">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-[#C5A059] transition"
          >
            <Icon className="w-4 h-4" />
            <span className="font-cinzel text-[8px] uppercase tracking-widest">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="lg:pl-56 pt-16">
        <div className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}

// Server-compatible nav link that highlights based on pathname
// Using a client component wrapper for active state
function AdminNavLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/5 transition-colors group rounded-none"
    >
      <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-[#C5A059]" />
      <span className="font-cinzel text-[10px] uppercase tracking-widest">{label}</span>
    </Link>
  );
}
