"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  mobile?: boolean;
}

export default function AdminNavLink({ href, label, icon: Icon, exact, mobile }: Props) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex-1 flex flex-col items-center gap-1 py-3 transition ${
          isActive ? "text-[#C5A059]" : "text-gray-500 hover:text-[#C5A059]"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="font-cinzel text-[8px] uppercase tracking-widest">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${
        isActive
          ? "bg-[#C5A059]/8 text-[#C5A059] border-l-2 border-[#C5A059]"
          : "text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/5 border-l-2 border-transparent"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="font-cinzel text-[10px] uppercase tracking-widest">{label}</span>
    </Link>
  );
}
