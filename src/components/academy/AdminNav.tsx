"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, BarChart2 } from "lucide-react";

const LINKS = [
  { href: "/academy/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/academy/admin/crm", label: "CRM", icon: Users },
  { href: "/academy/admin/blog", label: "Blog", icon: FileText },
  { href: "/academy/admin/analytics", label: "Analíticas", icon: BarChart2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 transition-colors border-l-2 ${
              active
                ? "bg-[#C5A059]/8 text-[#C5A059] border-[#C5A059]"
                : "text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/5 border-transparent"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-cinzel text-[10px] uppercase tracking-widest">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition ${
              active ? "text-[#C5A059]" : "text-gray-500 hover:text-[#C5A059]"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-cinzel text-[8px] uppercase tracking-widest">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
