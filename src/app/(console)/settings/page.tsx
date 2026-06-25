import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { roleLabels } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { tenant } = await getActiveContext();
  const [users, protocols] = await Promise.all([
    prisma.user.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } }),
    prisma.protocol.findMany({ where: { tenantId: tenant.id } }),
  ]);
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div>
      <PageHeader kicker="설정" title="병원 설정" description="병원 정보, 팀, 시술 프로토콜, AI 연동 상태를 관리합니다." />

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle>병원 정보</SectionTitle>
          <Row label="병원명" value={tenant.name} />
          <Row label="식별자(slug)" value={tenant.slug} />
          <Row label="플랜" value={<Badge className="bg-coral-soft text-coral-deep capitalize">{tenant.plan}</Badge>} />
        </Card>

        <Card className="p-5">
          <SectionTitle>AI 연동</SectionTitle>
          <Row
            label="Claude API"
            value={
              hasApiKey ? (
                <Badge className="bg-sage-soft text-sage">연결됨</Badge>
              ) : (
                <Badge className="bg-gold-soft text-gold">데모 모드</Badge>
              )
            }
          />
          <Row label="모델" value={process.env.ANTHROPIC_MODEL || "claude-opus-4-8"} />
          <p className="mt-2 text-xs text-muted">
            .env 의 <code>ANTHROPIC_API_KEY</code> 를 설정하면 상담 요약·챗봇이 실제 Claude로 동작합니다.
          </p>
        </Card>

        <Card className="p-5">
          <SectionTitle>팀 ({users.length})</SectionTitle>
          <div className="divide-y divide-line">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-bold text-plum">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
                <Badge className="bg-peach text-muted">{roleLabels[u.role]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>시술 프로토콜</SectionTitle>
          {protocols.length === 0 ? (
            <p className="text-sm text-muted">등록된 프로토콜이 없습니다.</p>
          ) : (
            protocols.map((p) => {
              let steps: string[] = [];
              try {
                steps = JSON.parse(p.steps);
              } catch {}
              return (
                <div key={p.id}>
                  <div className="text-sm font-bold text-plum">{p.name}</div>
                  <ol className="mt-2 space-y-1 text-xs text-muted">
                    {steps.map((s, i) => (
                      <li key={i}>{i + 1}. {s}</li>
                    ))}
                  </ol>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
