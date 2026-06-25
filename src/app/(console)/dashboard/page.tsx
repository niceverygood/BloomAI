import Link from "next/link";
import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { PageHeader, StatCard, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import {
  stageLabels,
  stageBadge,
  apptTypeLabels,
  riskBadge,
  riskLevelLabels,
  parseReasons,
} from "@/lib/domain";
import { fmtDateTime, fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { tenant } = await getActiveContext();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const patientWhere = { tenantId: tenant.id };

  const [totalPatients, inCycle, todaysAppts, todaysMeds, openAiTasks, riskPatients] =
    await Promise.all([
      prisma.patient.count({ where: patientWhere }),
      prisma.patient.count({ where: { ...patientWhere, stage: "in_cycle" } }),
      prisma.appointment.findMany({
        where: {
          patient: patientWhere,
          startsAt: { gte: startOfToday, lte: endOfToday },
          status: "scheduled",
        },
        include: { patient: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.medication.findMany({
        where: {
          patient: patientWhere,
          scheduledAt: { gte: startOfToday, lte: endOfToday },
        },
        include: { patient: true },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.task.findMany({
        where: { patient: patientWhere, done: false, source: "ai" },
        include: { patient: true },
        orderBy: { dueAt: "asc" },
        take: 6,
      }),
      prisma.patient.findMany({
        where: patientWhere,
        include: { riskScores: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
    ]);

  const missedMeds = todaysMeds.filter((m) => m.status === "missed").length;
  const highRisk = riskPatients
    .map((p) => ({ patient: p, risk: p.riskScores[0] }))
    .filter((x) => x.risk && x.risk.level !== "low")
    .sort((a, b) => (b.risk?.score ?? 0) - (a.risk?.score ?? 0))
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        kicker="대시보드"
        title="오늘의 BloomAI"
        description="환자 현황과 AI가 정리한 오늘의 우선순위를 한눈에 확인하세요."
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="전체 환자" value={totalPatients} sub="활성 등록 기준" />
        <StatCard label="사이클 진행중" value={inCycle} tone="coral" sub="자극~이식 단계" />
        <StatCard label="오늘 예약" value={todaysAppts.length} tone="sage" sub={`주사 ${todaysMeds.length}건 예정`} />
        <StatCard
          label="AI 처리 대기"
          value={openAiTasks.length}
          tone="gold"
          sub={missedMeds > 0 ? `주사 누락 ${missedMeds}건 주의` : "누락 없음"}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        {/* 오늘의 일정 */}
        <Card className="col-span-2 p-5">
          <SectionTitle right={<Link href="/patients" className="text-xs font-semibold text-coral-deep">전체 환자 →</Link>}>
            오늘의 일정
          </SectionTitle>
          {todaysAppts.length === 0 ? (
            <EmptyState>오늘 예정된 예약이 없습니다.</EmptyState>
          ) : (
            <div className="divide-y divide-line">
              {todaysAppts.map((a) => (
                <Link
                  key={a.id}
                  href={`/patients/${a.patientId}`}
                  className="flex items-center gap-4 py-3 hover:opacity-80"
                >
                  <div className="w-14 text-sm font-bold text-coral-deep">{fmtTime(a.startsAt)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-plum">{a.patient.name}</div>
                    <div className="text-xs text-muted">{apptTypeLabels[a.type] ?? a.type}</div>
                  </div>
                  <Badge className={stageBadge[a.patient.stage]}>{stageLabels[a.patient.stage]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* AI 할일 큐 */}
        <Card className="p-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <span className="rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
              처리 대기 큐
            </span>
          </SectionTitle>
          {openAiTasks.length === 0 ? (
            <EmptyState>대기중인 작업이 없습니다 🎉</EmptyState>
          ) : (
            <div className="space-y-2">
              {openAiTasks.map((t) => (
                <Link
                  key={t.id}
                  href={t.patientId ? `/patients/${t.patientId}` : "#"}
                  className="block rounded-xl border border-line p-3 hover:bg-peach"
                >
                  <div className="text-sm font-semibold text-ink">{t.title}</div>
                  {t.patient && (
                    <div className="mt-1 text-xs text-muted">{t.patient.name}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 이탈 위험 인사이트 */}
      <Card className="mt-5 p-5">
        <SectionTitle right={<span className="text-xs text-muted">AI 이탈·위험 인사이트</span>}>
          먼저 손 내밀어야 할 환자
        </SectionTitle>
        {highRisk.length === 0 ? (
          <EmptyState>현재 위험 신호가 감지된 환자가 없습니다.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {highRisk.map(({ patient, risk }) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="rounded-xl border border-line p-4 transition-shadow hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-plum">{patient.name}</div>
                  <Badge className={riskBadge[risk!.level]}>
                    위험도 {risk!.score} · {riskLevelLabels[risk!.level]}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {parseReasons(risk!.reasons).map((r, i) => (
                    <span key={i} className="rounded-md bg-peach px-2 py-0.5 text-[11px] text-muted">
                      {r}
                    </span>
                  ))}
                </div>
                {risk!.action && (
                  <div className="mt-2 text-xs font-semibold text-coral-deep">→ {risk!.action}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
