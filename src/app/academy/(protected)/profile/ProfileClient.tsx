"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AcademyHeader from "@/components/academy/AcademyHeader";
import AcademyCard from "@/components/academy/AcademyCard";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, User, Mail, Phone, Lock } from "lucide-react";

export default function ProfileClient() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    role: "student" | "admin";
    created_at: string;
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [savingPassword, setSavingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/academy/login"); return; }
      supabase.from("profiles").select("id, email, full_name, phone, avatar_url, role, created_at")
        .eq("id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setFullName(data.full_name ?? "");
            setPhone(data.phone ?? "");
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", profile!.id);
    setSavingProfile(false);
    if (error) { setProfileError("Error al guardar. Intenta de nuevo."); return; }
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) { setPasswordError("Las contraseñas no coinciden."); return; }
    if (newPassword.length < 8) { setPasswordError("Mínimo 8 caracteres."); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { setPasswordError(error.message); return; }
    setNewPassword(""); setConfirmPassword("");
    setSavedPassword(true);
    setTimeout(() => setSavedPassword(false), 2500);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <AcademyHeader user={profile} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(197,160,89,0.05),transparent)]" />

      <main className="max-w-2xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-8">
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">Mi cuenta</p>
          <h1 className="font-cinzel text-2xl text-white">Perfil</h1>
        </div>

        {/* Profile form */}
        <AcademyCard className="mb-6">
          <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#C5A059]" /> Datos personales
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Email (readonly) */}
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Email
              </label>
              <div className="bg-[#0a1628] border border-white/5 px-4 py-2.5 font-crimson text-sm text-gray-500 select-none">
                {profile.email}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0a1628] border border-white/10 focus:border-[#C5A059]/40 px-4 py-2.5 font-crimson text-sm text-gray-200 outline-none transition"
                placeholder="Tu nombre"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0a1628] border border-white/10 focus:border-[#C5A059]/40 px-4 py-2.5 font-crimson text-sm text-gray-200 outline-none transition"
                placeholder="+56 9 1234 5678"
              />
            </div>

            {profileError && (
              <p className="font-crimson text-sm text-red-400">{profileError}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 bg-[#C5A059] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-[#d4b06a] transition disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : savedProfile ? (
                <Check className="w-3.5 h-3.5" />
              ) : null}
              {savedProfile ? "Guardado" : "Guardar cambios"}
            </button>
          </form>
        </AcademyCard>

        {/* Password form */}
        <AcademyCard>
          <div className="relative overflow-hidden">
            <ScrollworkCorners size={32} opacity={0.5} />
            <h2 className="font-cinzel text-xs uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" /> Cambiar contraseña
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0a1628] border border-white/10 focus:border-[#C5A059]/40 px-4 py-2.5 font-crimson text-sm text-gray-200 outline-none transition"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 block">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a1628] border border-white/10 focus:border-[#C5A059]/40 px-4 py-2.5 font-crimson text-sm text-gray-200 outline-none transition"
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <p className="font-crimson text-sm text-red-400">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 border border-[#C5A059]/40 text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-[#C5A059]/10 transition disabled:opacity-30"
              >
                {savingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedPassword ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                {savedPassword ? "Contraseña actualizada" : "Actualizar contraseña"}
              </button>
            </form>
          </div>
        </AcademyCard>
      </main>
    </div>
  );
}
