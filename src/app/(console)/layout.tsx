import { Sidebar } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { OnboardingTour } from "@/components/OnboardingTour";
import { getActiveContext } from "@/lib/tenant";
import { roleLabels } from "@/lib/domain";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { tenant, user } = await getActiveContext();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tenantName={tenant.name} plan={tenant.plan} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white/80 px-6 backdrop-blur">
          <div className="text-sm text-muted">난임 전문 AI CRM</div>
          <UserMenu name={user.name} role={roleLabels[user.role] ?? user.role} color={user.avatarColor ?? undefined} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <OnboardingTour />
    </div>
  );
}
