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

// Redirect all /admin/* to the consolidated /academy/admin
export default function AdminLayout({ children: _ }: Props) {
  redirect("/academy/admin");
}
