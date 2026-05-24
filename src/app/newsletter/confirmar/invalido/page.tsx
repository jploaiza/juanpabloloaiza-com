import Link from "next/link";

export const metadata = { title: "Enlace inválido — Juan Pablo Loaiza" };

export default function InvalidoPage() {
  return (
    <main className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-[#C5A059]/20 bg-[#16213e] p-10 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#C5A059]" />

          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-4">
            Enlace inválido o expirado
          </p>
          <h1 className="font-cinzel text-2xl text-white mb-4 leading-snug">
            Este enlace ya no funciona
          </h1>
          <p className="font-crimson text-base text-gray-400 leading-relaxed mb-8">
            El enlace de confirmación puede haber expirado o ya fue usado.
            Si quieres suscribirte, puedes hacerlo de nuevo desde el blog.
          </p>
          <Link
            href="/blog"
            className="inline-block bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-8 py-3 transition"
          >
            Ir al blog
          </Link>
        </div>
      </div>
    </main>
  );
}
