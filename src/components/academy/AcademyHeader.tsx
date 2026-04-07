"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, User, LayoutDashboard, Menu, X, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/academy";

interface Props {
  user?: Profile | null;
}

export default function AcademyHeader({ user }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/academy");
    router.refresh();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-[#C5A059]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={user ? "/academy/dashboard" : "/academy"} className="flex items-center gap-3 group">
          <Image
            src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
            alt="JPL Academy"
            width={140}
            height={48}
            className="h-8 w-auto opacity-90 group-hover:opacity-100 transition"
          />
          <span className="hidden sm:block font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059]/70 border-l border-[#C5A059]/20 pl-3">
            Academy
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/academy/dashboard"
                className={`font-cinzel text-[11px] uppercase tracking-widest transition ${
                  pathname.includes("dashboard") ? "text-[#C5A059]" : "text-gray-400 hover:text-[#C5A059]"
                }`}
              >
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/academy/admin"
                  className="font-cinzel text-[11px] uppercase tracking-widest text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" /> Admin
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                <Link
                  href="/academy/profile"
                  className="flex items-center gap-2 group"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-[#C5A059]/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#C5A059]" />
                    </div>
                  )}
                  <span className="font-cinzel text-[11px] uppercase tracking-widest text-gray-400 group-hover:text-[#C5A059] transition">
                    {user.full_name?.split(" ")[0] ?? "Perfil"}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/academy/login"
                className="font-cinzel text-[11px] uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/academy/register"
                className="font-cinzel text-[11px] uppercase tracking-widest border border-[#C5A059]/40 text-[#C5A059] px-4 py-2 hover:bg-[#C5A059]/10 transition"
              >
                Inscribirme gratis
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#C5A059] p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#020617]/98 border-t border-[#C5A059]/10 px-6 py-5 space-y-4">
          {user ? (
            <>
              <Link href="/academy/dashboard" className="block font-cinzel text-sm uppercase tracking-widest text-gray-300 hover:text-[#C5A059] py-2 border-b border-white/5" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="inline w-4 h-4 mr-2" /> Dashboard
              </Link>
              <Link href="/academy/profile" className="block font-cinzel text-sm uppercase tracking-widest text-gray-300 hover:text-[#C5A059] py-2 border-b border-white/5" onClick={() => setMenuOpen(false)}>
                <User className="inline w-4 h-4 mr-2" /> Perfil
              </Link>
              {user.role === "admin" && (
                <Link href="/academy/admin" className="block font-cinzel text-sm uppercase tracking-widest text-purple-400 py-2 border-b border-white/5" onClick={() => setMenuOpen(false)}>
                  <Shield className="inline w-4 h-4 mr-2" /> Admin
                </Link>
              )}
              <button onClick={handleSignOut} className="block w-full text-left font-cinzel text-sm uppercase tracking-widest text-red-400 py-2">
                <LogOut className="inline w-4 h-4 mr-2" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/academy/login" className="block font-cinzel text-sm uppercase tracking-widest text-gray-300 hover:text-[#C5A059] py-2" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
              <Link href="/academy/register" className="block font-cinzel text-sm uppercase tracking-widest text-[#C5A059] py-2" onClick={() => setMenuOpen(false)}>Inscribirme gratis</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
