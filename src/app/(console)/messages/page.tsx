import Link from "next/link";
import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { PageHeader, Card, Badge, SectionTitle, EmptyState } from "@/components/ui";
import { channelLabels } from "@/lib/domain";
import { fromNow } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { tenant } = await getActiveContext();

  const messages = await prisma.message.findMany({
    where: { patient: { tenantId: tenant.id } },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  // AI 챗봇으로 들어온 환자 문의 = 사람 확인이 필요한 에스컬레이션 후보
  const escalations = messages.filter((m) => m.channel === "chatbot" && m.direction === "inbound");

  return (
    <div>
      <PageHeader
        kicker="메시지"
        title="소통 허브"
        description="알림톡·문자·AI 챗봇 대화를 한 곳에서. 챗봇이 사람 연결로 분류한 문의를 우선 확인하세요."
      />

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-5">
          <SectionTitle>최근 소통</SectionTitle>
          {messages.length === 0 ? (
            <EmptyState>소통 기록이 없습니다.</EmptyState>
          ) : (
            <div className="divide-y divide-line">
              {messages.map((m) => (
                <Link key={m.id} href={`/patients/${m.patientId}`} className="flex items-start gap-3 py-3 hover:opacity-80">
                  <div className="w-9 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-peach text-xs font-bold text-coral-deep">
                      {m.patient.name.slice(0, 1)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-plum">{m.patient.name}</span>
                      <Badge className={m.channel === "chatbot" ? "bg-coral-soft text-coral-deep" : "bg-sage-soft text-sage"}>
                        {channelLabels[m.channel]}
                      </Badge>
                      <span className="text-[11px] text-muted">{m.direction === "inbound" ? "환자" : "병원"}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-ink">{m.body}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-muted">{fromNow(m.createdAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <span className="rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
              에스컬레이션 큐
            </span>
          </SectionTitle>
          {escalations.length === 0 ? (
            <EmptyState>사람 확인이 필요한 문의가 없습니다.</EmptyState>
          ) : (
            <div className="space-y-2">
              {escalations.map((m) => (
                <Link key={m.id} href={`/patients/${m.patientId}`} className="block rounded-xl border border-line p-3 hover:bg-peach">
                  <div className="text-sm font-bold text-plum">{m.patient.name}</div>
                  <div className="mt-0.5 text-sm text-ink">“{m.body}”</div>
                  <div className="mt-1 text-[11px] text-coral-deep">→ 답변 검토 필요</div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
