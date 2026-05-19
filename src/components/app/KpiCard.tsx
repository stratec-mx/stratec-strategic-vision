import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export const KpiCard = ({
  label, value, delta, icon: Icon, hint,
}: { label: string; value: string; delta?: string; icon: LucideIcon; hint?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="border border-border bg-card p-6 group hover:border-navy/30 transition"
  >
    <div className="flex items-start justify-between">
      <div className="text-[10px] uppercase tracking-[0.25em] text-steel">{label}</div>
      <Icon className="h-4 w-4 text-olive" />
    </div>
    <div className="mt-6 font-display text-3xl text-navy font-light">{value}</div>
    <div className="mt-2 flex items-center gap-2 text-xs text-steel">
      {delta && <span className="text-olive font-medium">{delta}</span>}
      {hint && <span>{hint}</span>}
    </div>
  </motion.div>
);
