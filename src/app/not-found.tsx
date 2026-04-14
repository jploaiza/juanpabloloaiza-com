import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <img
        src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
        alt="Juan Pablo Loaiza"
        width={140}
        height={40}
        className="mb-10 opacity-70"
      />
      <p className="text-[#C5A059] uppercase tracking-widest text-xs mb-3" style={{ fontFamily: "serif" }}>
        Error 404
      </p>
      <h1 className="text-white text-2xl mb-4 font-normal" style={{ fontFamily: "Georgia, serif" }}>
        Página no encontrada
      </h1>
      <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-sm" style={{ fontFamily: "Georgia, serif" }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-[#C5A059] text-[#020617] text-xs uppercase tracking-widest hover:bg-[#D4B06A] transition"
        style={{ fontFamily: "serif" }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
