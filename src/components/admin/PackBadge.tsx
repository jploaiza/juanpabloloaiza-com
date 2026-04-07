interface Props {
  sessionsUsed: number;
  sessionsTotal: number;
  endDate: string | null;
  isActive: boolean;
}

export default function PackBadge({ sessionsUsed, sessionsTotal, endDate, isActive }: Props) {
  const sessionsLeft = sessionsTotal - sessionsUsed;

  let daysLeft: number | null = null;
  if (endDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-700 bg-gray-900/60 font-cinzel text-[9px] uppercase tracking-widest text-gray-500">
        Inactivo
      </span>
    );
  }

  const isRed = sessionsLeft === 0 || (daysLeft !== null && daysLeft <= 7);
  const isYellow = !isRed && daysLeft !== null && daysLeft <= 14;
  const isGreen = !isRed && !isYellow;

  const colorClasses = isRed
    ? "border-red-500/50 bg-red-950/40 text-red-400"
    : isYellow
    ? "border-amber-500/50 bg-amber-950/40 text-amber-400"
    : "border-emerald-500/50 bg-emerald-950/40 text-emerald-400";

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 border font-cinzel text-[9px] uppercase tracking-widest ${colorClasses}`}>
      <span>{sessionsLeft}/{sessionsTotal} ses.</span>
      {daysLeft !== null && (
        <>
          <span className="opacity-40">·</span>
          <span>{daysLeft > 0 ? `${daysLeft}d` : "Vencido"}</span>
        </>
      )}
    </span>
  );
}
