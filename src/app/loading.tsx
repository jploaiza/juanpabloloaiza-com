export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center gap-8">
      <img
        src="https://media.juanpabloloaiza.com/images/Logo%20transparente%20blanco.png"
        alt="Juan Pablo Loaiza"
        width={140}
        height={40}
        className="opacity-60"
      />
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
