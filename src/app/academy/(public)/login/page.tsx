"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import AcademyButton from "@/components/academy/AcademyButton";
import AcademyInput from "@/components/academy/AcademyInput";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

type Step = "email" | "otp";

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/academy/dashboard";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: send OTP ────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("not found") || error.message.includes("signup")
          ? "No encontramos esa cuenta. ¿Quieres inscribirte?"
          : error.message
      );
      return;
    }
    setStep("otp");
  };

  // ── Step 2: verify OTP ──────────────────────────────────────
  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 8) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
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
    window.location.href = redirectTo;
  };

  // ── OTP input handling ──────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 7) inputRefs.current[index + 1]?.focus();
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
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setResending(false);
    setOtp(["", "", "", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center px-4 py-16">
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

        <div className="relative bg-[#16213e] border border-[#C5A059]/15 p-8 overflow-hidden">
          <ScrollworkCorners size={52} opacity={0.9} />

          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-cinzel text-xl uppercase tracking-widest text-white mb-1 text-center">
                  Bienvenido
                </h1>
                <p className="font-crimson text-gray-400 text-sm text-center mb-8">
                  Ingresa tu correo para recibir un código de acceso
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 text-red-400 font-crimson text-sm px-4 py-3 mb-5">
                    {error}{" "}
                    {error.includes("inscribirte") && (
                      <Link href="/academy/register" className="underline text-[#C5A059]">
                        Inscríbete aquí
                      </Link>
                    )}
                  </div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-5">
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
                    Enviar código <ArrowRight className="w-4 h-4" />
                  </AcademyButton>
                </form>

                <p className="text-center font-crimson text-xs text-gray-600 mt-5">
                  Recibirás un código de un solo uso. Sin contraseñas.
                </p>

                <p className="text-center font-crimson text-sm text-gray-500 mt-6">
                  ¿No tienes cuenta?{" "}
                  <Link href="/academy/register" className="text-[#C5A059] hover:underline">
                    Inscríbete gratis
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#C5A059]" />
                  </div>
                </div>

                <h2 className="font-cinzel text-xl uppercase tracking-widest text-white mb-2 text-center">
                  Revisa tu correo
                </h2>
                <p className="font-crimson text-gray-400 text-sm text-center mb-1">
                  Código de acceso enviado a
                </p>
                <p className="font-cinzel text-[#C5A059] text-sm text-center mb-8">
                  {email}
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 text-red-400 font-crimson text-sm px-4 py-3 mb-5 text-center">
                    {error}
                  </div>
                )}

                {/* 6-digit OTP */}
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
                      className="w-11 h-14 text-center text-2xl font-cinzel text-white bg-[#0e1b30] border border-white/10 focus:border-[#C5A059]/60 focus:outline-none transition-colors disabled:opacity-50"
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
                    onClick={() => { setStep("email"); setError(""); setOtp(["","","","","","","",""]); }}
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
