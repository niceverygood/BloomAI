import { Sidebar } from "@/components/Sidebar";
import { getActiveContext } from "@/lib/tenant";
import { roleLabels } from "@/lib/domain";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { tenant, user } = await getActiveContext();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tenantName={tenant.name} plan={tenant.plan} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white/80 px-6 backdrop-blur">
          <div className="text-sm text-muted">
            난임 전문 AI CRM
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-plum">{user?.name ?? "사용자"}</div>
              <div className="text-[11px] text-muted">{roleLabels[user?.role ?? "coordinator"]}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-soft text-sm font-bold text-coral-deep">
              {(user?.name ?? "U").slice(0, 1)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
