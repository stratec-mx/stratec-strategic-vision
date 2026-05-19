import { ReactNode } from "react";

export const PageHeader = ({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 pb-6 border-b border-border">
    <div>
      {eyebrow && <div className="eyebrow mb-2">— {eyebrow}</div>}
      <h1 className="font-display text-3xl md:text-4xl font-light text-navy tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-sm text-steel max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
