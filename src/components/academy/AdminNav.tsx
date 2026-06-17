"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, BarChart2, TrendingUp, Calendar, Mail, Send, LayoutTemplate, Zap, ChevronDown, LineChart, List, ClipboardList } from "lucide-react";
import { useState } from "react";

const NEWSLETTER_SUBNAV = [
  { href: "/academy/admin/newsletter/campaigns", label: "Campañas", icon: Send },
  { href: "/academy/admin/newsletter/envios", label: "Envíos", icon: LineChart },
  { href: "/academy/admin/newsletter/subscribers", label: "Suscriptores", icon: Users },
  { href: "/academy/admin/newsletter/lists", label: "Listas", icon: List },
  { href: "/academy/admin/newsletter/templates", label: "Plantillas", icon: LayoutTemplate },
  { href: "/academy/admin/newsletter/automations", label: "Automatizaciones", icon: Zap },
];

const LINKS = [
  { href: "/academy/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/academy/admin/crm", label: "CRM", icon: Users },
  { href: "/academy/admin/calendar", label: "Calendario", icon: Calendar },
  { href: "/academy/admin/blog", label: "Blog", icon: FileText },
  { href: "/academy/admin/formularios", label: "Formularios", icon: ClipboardList },
  { href: "/academy/admin/newsletter", label: "Newsletter", icon: Mail, hasSubnav: true },
  { href: "/academy/admin/analytics", label: "Analíticas", icon: BarChart2 },
  { href: "/academy/admin/trends", label: "Tendencias", icon: TrendingUp },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isNewsletterActive = pathname.startsWith("/academy/admin/newsletter");
  const [newsletterOpen, setNewsletterOpen] = useState(isNewsletterActive);

  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      {LINKS.map(({ href, label, icon: Icon, exact, hasSubnav }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);

        if (hasSubnav) {
          return (
            <div key={href}>
              <button
                onClick={() => setNewsletterOpen((o) => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors border-l-2 ${
                  active
                    ? "bg-[#C5A059]/8 text-[#C5A059] border-[#C5A059]"
                    : "text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/5 border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-cinzel text-[10px] uppercase tracking-widest flex-1 text-left">{label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${newsletterOpen ? "rotate-180" : ""}`} />
              </button>
              {newsletterOpen && (
                <div className="ml-4 border-l border-[#C5A059]/15 pl-2 space-y-0.5 mb-0.5">
                  {NEWSLETTER_SUBNAV.map(({ href: subHref, label: subLabel, icon: SubIcon }) => {
                    const subActive = pathname.startsWith(subHref);
                    return (
                      <Link key={subHref} href={subHref}
                        className={`flex items-center gap-2 px-2 py-2 transition-colors border-l-2 ${
                          subActive
                            ? "bg-[#C5A059]/8 text-[#C5A059] border-[#C5A059]"
                            : "text-gray-500 hover:text-[#C5A059] hover:bg-[#C5A059]/5 border-transparent"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-cinzel text-[9px] uppercase tracking-widest">{subLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

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
