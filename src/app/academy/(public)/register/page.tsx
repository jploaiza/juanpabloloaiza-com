"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, User, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import AcademyButton from "@/components/academy/AcademyButton";
import AcademyInput from "@/components/academy/AcademyInput";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

type Step = "form" | "otp";

function RegisterForm() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: send OTP ────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Por favor ingresa tu nombre."); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/academy/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("otp");
  };

  // ── Step 2: verify OTP ──────────────────────────────────────
  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 8) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setLoading(false);
      setError("Código incorrecto o expirado. Solicita uno nuevo.");
      setOtp(["", "", "", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    // Auto-enroll in the course
    if (data.user) {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", "hipnosis-regresiva-preparacion")
        .maybeSingle();
      if (course) {
        await supabase
          .from("enrollments")
          .upsert({ user_id: data.user.id, course_id: course.id }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
      }
    }
    window.location.href = "/academy/dashboard";
  };

  // ── OTP input handling ──────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    const full = next.join("");
    if (full.length === 8) handleVerifyOTP(full);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (pasted.length === 8) {
      setOtp(pasted.split(""));
      handleVerifyOTP(pasted);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: name.trim() } },
    });
    setResending(false);
    setOtp(["", "", "", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-4 py-16">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(197,160,89,0.07),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/academy">
            <Image
              src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
              alt="JPL Academy"
              width={180}
              height={60}
              className="h-10 w-auto mx-auto mb-4"
            />
          </Link>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/60">Academy</p>
        </div>

        <div className="relative bg-[#0a1628] border border-[#C5A059]/15 p-8">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#C5A059]/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#C5A059]/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#C5A059]/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#C5A059]/50" />

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-cinzel text-xl uppercase tracking-widest text-white mb-1 text-center">
                  Inscríbete gratis
                </h1>
                <p className="font-crimson text-gray-400 text-sm text-center mb-8">
                  Acceso completo al curso, sin costo
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 text-red-400 font-crimson text-sm px-4 py-3 mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-5">
                  <AcademyInput
                    label="Nombre completo"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="w-4 h-4" />}
                    autoComplete="name"
                    required
                  />
                  <AcademyInput
                    label="Correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    autoComplete="email"
                    required
                  />
                  <AcademyButton type="submit" loading={loading} fullWidth size="lg">
                    Enviar código de acceso <ArrowRight className="w-4 h-4" />
                  </AcademyButton>
                </form>

                <p className="text-center font-crimson text-xs text-gray-600 mt-5 leading-relaxed">
                  Recibirás un código de un solo uso en tu correo.<br />Sin contraseñas.
                </p>

                <p className="text-center font-crimson text-sm text-gray-500 mt-6">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/academy/login" className="text-[#C5A059] hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                {/* Mail icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#C5A059]" />
                  </div>
                </div>

                <h2 className="font-cinzel text-xl uppercase tracking-widest text-white mb-2 text-center">
                  Revisa tu correo
                </h2>
                <p className="font-crimson text-gray-400 text-sm text-center mb-1">
                  Enviamos un código de acceso a
                </p>
                <p className="font-cinzel text-[#C5A059] text-sm text-center mb-8">
                  {email}
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 text-red-400 font-crimson text-sm px-4 py-3 mb-5 text-center">
                    {error}
                  </div>
                )}

                {/* 6-digit OTP input */}
                <div className="flex justify-center gap-3 mb-8" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={loading}
                      className="w-11 h-14 text-center text-2xl font-cinzel text-white bg-[#020d1f] border border-white/10 focus:border-[#C5A059]/60 focus:outline-none transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>

                {loading && (
                  <p className="text-center font-cinzel text-[10px] uppercase tracking-widest text-[#C5A059] mb-4">
                    Verificando...
                  </p>
                )}

                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition disabled:opacity-40"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {resending ? "Enviando..." : "Reenviar código"}
                  </button>
                  <button
                    onClick={() => { setStep("form"); setError(""); setOtp(["","","","","","","",""]); }}
                    className="font-crimson text-sm text-gray-600 hover:text-gray-400 transition"
                  >
                    ← Cambiar correo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
