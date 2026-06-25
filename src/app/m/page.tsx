import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { MobileChat } from "./MobileChat";
import {
  cycleTypeLabels,
  cycleStatusLabels,
  cycleStatusOrder,
  apptTypeLabels,
  routeLabels,
} from "@/lib/domain";
import { fmtDateTime, fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 케어 — BloomAI" };

export default async function MobilePatientPage() {
  // 데모: 사이클 진행중 환자 1명을 환자 본인 시점으로 표시
  const patient = await prisma.patient.findFirst({
    where: { stage: "in_cycle" },
    include: {
      cycles: { orderBy: { startedAt: "desc" }, take: 1 },
      medications: { where: { status: "scheduled" }, orderBy: { scheduledAt: "asc" } },
      appointments: { where: { status: "scheduled" }, orderBy: { startsAt: "asc" }, take: 1 },
    },
  });

  if (!patient) {
    return <div className="p-8 text-center text-muted">표시할 환자가 없습니다. 시드를 실행하세요.</div>;
  }

  const cycle = patient.cycles[0];
  const stepIdx = cycle ? cycleStatusOrder.indexOf(cycle.status) : -1;
  const nextAppt = patient.appointments[0];
  const todayMeds = patient.medications;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-peach pb-28">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-gradient-to-br from-coral to-coral-deep px-5 pb-6 pt-6 text-white">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90">
            <Logo size={18} /> BloomAI
          </div>
          <div className="mt-2 text-lg font-extrabold">{patient.name}님, 안녕하세요 🌷</div>
          <div className="text-xs opacity-90">오늘도 곁에서 함께할게요</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-lg font-bold">
          {patient.name.slice(0, 1)}
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* 내 사이클 */}
        {cycle && (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-plum">내 시술 사이클</div>
              <span className="badge bg-coral-soft text-coral-deep">{cycleTypeLabels[cycle.type]}</span>
            </div>
            <div className="mt-3 text-xl font-extrabold text-coral-deep">{cycleStatusLabels[cycle.status]}</div>
            <div className="mt-1 text-xs text-muted">전체 {cycleStatusOrder.length}단계 중 {stepIdx + 1}단계</div>
            <div className="mt-3 flex gap-1">
              {cycleStatusOrder.map((s, i) => (
                <div key={s} className={"h-1.5 flex-1 rounded-full " + (i <= stepIdx ? "bg-coral" : "bg-line")} />
              ))}
            </div>
          </div>
        )}

        {/* 다음 할 일 */}
        <div className="card p-5">
          <div className="text-sm font-bold text-plum">다음 일정</div>
          {nextAppt ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-sage-soft text-sage">
                <span className="text-[10px]">📅</span>
              </div>
              <div>
                <div className="text-sm font-bold text-ink">{apptTypeLabels[nextAppt.type] ?? nextAppt.type}</div>
                <div className="text-xs text-muted">{fmtDateTime(nextAppt.startsAt)}</div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted">예정된 일정이 없습니다.</div>
          )}
        </div>

        {/* 오늘의 주사 */}
        <div className="card p-5">
          <div className="text-sm font-bold text-plum">오늘의 주사 · 약물 💉</div>
          {todayMeds.length === 0 ? (
            <div className="mt-2 text-sm text-muted">예정된 주사가 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {todayMeds.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-peach px-3 py-2.5">
                  <div>
                    <div className="text-sm font-bold text-plum">{m.name}</div>
                    <div className="text-xs text-muted">{m.dose} · {routeLabels[m.route ?? ""] ?? m.route}</div>
                  </div>
                  <div className="text-sm font-bold text-coral-deep">{fmtTime(m.scheduledAt)}</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            ⏰ 주사는 정해진 시각에 맞는 것이 중요해요. 시간이 되면 알림을 보내드려요.
          </p>
        </div>

        {/* AI 챗봇 */}
        <MobileChat patientId={patient.id} patientName={patient.name} />

        <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
          이 화면은 환자용 모바일 앱(PWA) 데모입니다. 홈 화면에 추가하면 앱처럼 쓸 수 있어요.<br />
          실서비스에서는 카카오/전화 인증으로 환자 본인만 접속합니다.
        </p>
      </div>
    </div>
  );
}
