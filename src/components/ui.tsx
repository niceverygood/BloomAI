import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && (
          <span className="text-xs font-bold uppercase tracking-wider text-coral-deep">{kicker}</span>
        )}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-plum">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "coral" | "sage" | "gold";
}) {
  const toneMap = {
    default: "text-plum",
    coral: "text-coral-deep",
    sage: "text-sage",
    gold: "text-gold",
  };
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className={cn("mt-2 text-3xl font-extrabold tracking-tight", toneMap[tone])}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("badge", className)}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-extrabold text-plum">{children}</h2>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
