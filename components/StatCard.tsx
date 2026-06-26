type Accent = "indigo" | "emerald" | "cyan" | "violet" | "amber" | "rose";

const accentMap: Record<Accent, string> = {
  indigo: "from-indigo-500 to-blue-500",
  emerald: "from-emerald-500 to-teal-500",
  cyan: "from-cyan-500 to-sky-500",
  violet: "from-violet-500 to-purple-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-500",
};

export default function StatCard({
  label,
  value,
  accent = "indigo",
  hint,
}: {
  label: string;
  value: string | number;
  accent?: Accent;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition hover:border-slate-700 hover:bg-slate-900/80">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentMap[accent]}`}
      />
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
