const map: Record<string, string> = {
  new: "bg-olive/10 text-olive border-olive/30",
  contacted: "bg-navy/5 text-navy border-navy/20",
  qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unqualified: "bg-secondary text-steel border-border",
  converted: "bg-navy text-smoke border-navy",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-secondary text-steel border-border",
  sent: "bg-navy/5 text-navy border-navy/20",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  expired: "bg-secondary text-steel border-border",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider border ${map[status] ?? "bg-secondary text-steel border-border"}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
    {status}
  </span>
);
