import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { Card, Badge, SectionTitle, EmptyState } from "@/components/ui";
import {
  stageLabels,
  stageBadge,
  cycleTypeLabels,
  cycleStatusLabels,
  cycleStatusOrder,
  markerLabels,
  medStatusLabels,
  routeLabels,
  channelLabels,
  riskBadge,
  riskLevelLabels,
  parseReasons,
  age,
} from "@/lib/domain";
import { fmtDate, fmtDateTime, fromNow } from "@/lib/utils";
import type { ConsultationSummary } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function PatientDetail({ params }: { params: { id: string } }) {
  const { tenant } = await getActiveContext();
  const p = await prisma.patient.findFirst({
    where: { id: params.id, tenantId: tenant.id },
    include: {
      coordinator: true,
      cycles: { orderBy: { startedAt: "desc" } },
      labResults: { orderBy: { takenAt: "asc" } },
      medications: { orderBy: { scheduledAt: "asc" } },
      consultations: { orderBy: { createdAt: "desc" }, include: { author: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 8 },
      tasks: { orderBy: { dueAt: "asc" } },
      riskScores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!p) notFound();

  const cycle = p.cycles[0];
  const risk = p.riskScores[0];
  const statusIdx = cycle ? cycleStatusOrder.indexOf(cycle.status) : -1;

  // 검사 결과를 마커별로 그룹화
  const byMarker: Record<string, typeof p.labResults> = {};
  for (const l of p.labResults) (byMarker[l.marker] ??= []).push(l);

  const upcomingMeds = p.medications.filter((m) => m.status === "scheduled");
  const openTasks = p.tasks.filter((t) => !t.done);

  return (
    <div>
      <Link href="/patients" className="mb-4 inline-block text-sm font-semibold text-muted hover:text-ink">
        ← 환자 목록
      </Link>

      {/* 헤더 */}
      <Card className="mb-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft text-xl font-extrabold text-coral-deep">
              {p.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-plum">{p.name}</h1>
                <Badge className={stageBadge[p.stage]}>{stageLabels[p.stage]}</Badge>
                {risk && (
                  <Badge className={riskBadge[risk.level]}>
                    위험도 {risk.score} · {riskLevelLabels[risk.level]}
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-muted">
                {age(p.birthDate)} · {p.diagnosis ?? "-"} · 배우자 {p.partnerName ?? "-"} · AMH {p.amh ?? "-"}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {p.phone} · 담당 {p.coordinator?.name ?? "-"} · 최근 연락 {fromNow(p.lastContactAt)}
              </div>
            </div>
          </div>
          <Link href={`/consultations/new?patientId=${p.id}`} className="btn-primary shrink-0">
            ✨ AI 상담요약 작성
          </Link>
        </div>

        {/* AI 위험 인사이트 */}
        {risk && risk.level !== "low" && (
          <div className="mt-4 rounded-xl bg-peach p-4">
            <div className="text-xs font-bold text-coral-deep">AI 위험 인사이트</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {parseReasons(risk.reasons).map((r, i) => (
                <span key={i} className="rounded-md bg-white px-2 py-0.5 text-xs text-muted">{r}</span>
              ))}
            </div>
            {risk.action && <div className="mt-2 text-sm font-semibold text-plum">권장 액션 → {risk.action}</div>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* 현재 사이클 */}
          <Card className="p-5">
            <SectionTitle right={cycle && <span className="text-xs text-muted">{cycle.cycleNumber}차 · 시작 {fmtDate(cycle.startedAt)}</span>}>
              현재 시술 사이클
            </SectionTitle>
            {!cycle ? (
              <EmptyState>진행중인 사이클이 없습니다.</EmptyState>
            ) : (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Badge className="bg-coral-soft text-coral-deep">{cycleTypeLabels[cycle.type]}</Badge>
                  <span className="text-sm font-bold text-plum">{cycleStatusLabels[cycle.status]}</span>
                </div>
                {/* 단계 프로그레스 */}
                <div className="flex items-center">
                  {cycleStatusOrder.map((s, i) => {
                    const done = i < statusIdx;
                    const current = i === statusIdx;
                    return (
                      <div key={s} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          <div className={"h-1 flex-1 " + (i === 0 ? "bg-transparent" : done || current ? "bg-coral" : "bg-line")} />
                          <div
                            className={
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
                              (current ? "bg-coral text-white ring-4 ring-coral-soft" : done ? "bg-coral text-white" : "bg-line text-muted")
                            }
                          >
                            {i + 1}
                          </div>
                          <div className={"h-1 flex-1 " + (i === cycleStatusOrder.length - 1 ? "bg-transparent" : done ? "bg-coral" : "bg-line")} />
                        </div>
                        <div className={"mt-1.5 text-center text-[10px] leading-tight " + (current ? "font-bold text-coral-deep" : "text-muted")}>
                          {cycleStatusLabels[s]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* 검사 결과 */}
          <Card className="p-5">
            <SectionTitle>검사 결과 추이</SectionTitle>
            {Object.keys(byMarker).length === 0 ? (
              <EmptyState>등록된 검사 결과가 없습니다.</EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(byMarker).map(([marker, list]) => {
                  const latest = list[list.length - 1];
                  const max = Math.max(...list.map((l) => l.value));
                  return (
                    <div key={marker} className="rounded-xl border border-line p-3">
                      <div className="text-xs font-semibold text-muted">{markerLabels[marker] ?? marker}</div>
                      <div className="mt-0.5 text-lg font-extrabold text-plum">
                        {latest.value}
                        <span className="ml-1 text-xs font-medium text-muted">{latest.unit}</span>
                      </div>
                      <div className="mt-2 flex h-10 items-end gap-1">
                        {list.map((l) => (
                          <div
                            key={l.id}
                            className="flex-1 rounded-t bg-coral/70"
                            style={{ height: `${Math.max(8, (l.value / max) * 100)}%` }}
                            title={`${l.value}${l.unit ?? ""} · ${fmtDate(l.takenAt)}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 상담 기록 */}
          <Card className="p-5">
            <SectionTitle right={<Link href={`/consultations/new?patientId=${p.id}`} className="text-xs font-semibold text-coral-deep">+ 상담요약 작성</Link>}>
              상담 기록 (AI 요약)
            </SectionTitle>
            {p.consultations.length === 0 ? (
              <EmptyState>상담 기록이 없습니다. AI 상담요약을 작성해 보세요.</EmptyState>
            ) : (
              <div className="space-y-3">
                {p.consultations.map((c) => {
                  let s: ConsultationSummary | null = null;
                  try {
                    s = c.summary ? JSON.parse(c.summary) : null;
                  } catch {
                    s = null;
                  }
                  return (
                    <div key={c.id} className="rounded-xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted">
                          {fmtDateTime(c.createdAt)} · {c.author?.name ?? "-"}
                        </div>
                        <span className="rounded-md bg-coral-soft px-1.5 py-0.5 text-[10px] font-bold text-coral-deep">
                          {c.aiModel ?? "AI"}
                        </span>
                      </div>
                      {s ? (
                        <div className="mt-2 space-y-1.5 text-sm">
                          <div><b className="text-plum">주호소</b> · {s.chiefComplaint}</div>
                          <div className="text-ink">{s.summary}</div>
                          {s.emotional && <div className="text-xs text-coral-deep">정서: {s.emotional}</div>}
                          {s.followUpActions?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {s.followUpActions.map((a, i) => (
                                <span key={i} className="rounded-md bg-peach px-2 py-0.5 text-[11px] text-muted">☑ {a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted line-clamp-2">{c.transcript}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 사이드 */}
        <div className="space-y-5">
          {/* 주사/약물 */}
          <Card className="p-5">
            <SectionTitle>주사 · 약물 일정</SectionTitle>
            {upcomingMeds.length === 0 ? (
              <EmptyState>예정된 주사가 없습니다.</EmptyState>
            ) : (
              <div className="space-y-2">
                {upcomingMeds.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                    <div>
                      <div className="text-sm font-bold text-plum">{m.name}</div>
                      <div className="text-xs text-muted">
                        {m.dose} · {routeLabels[m.route ?? ""] ?? m.route} · {fmtDateTime(m.scheduledAt)}
                      </div>
                    </div>
                    <Badge className="bg-gold-soft text-gold">{medStatusLabels[m.status]}</Badge>
                  </div>
                ))}
                {p.medications.some((m) => m.status === "missed") && (
                  <div className="rounded-lg bg-coral-soft px-3 py-2 text-xs font-semibold text-coral-deep">
                    ⚠ 누락된 주사가 있습니다. 순응도 콜이 필요합니다.
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 할일 */}
          <Card className="p-5">
            <SectionTitle>할일</SectionTitle>
            {openTasks.length === 0 ? (
              <EmptyState>대기중인 할일이 없습니다.</EmptyState>
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-xl border border-line p-3">
                    <span className={"mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold " + (t.source === "ai" ? "bg-coral text-white" : "bg-line text-muted")}>
                      {t.source === "ai" ? "AI" : "수동"}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-ink">{t.title}</div>
                      {t.dueAt && <div className="text-xs text-muted">마감 {fmtDate(t.dueAt)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 메시지 */}
          <Card className="p-5">
            <SectionTitle>최근 소통</SectionTitle>
            {p.messages.length === 0 ? (
              <EmptyState>소통 기록이 없습니다.</EmptyState>
            ) : (
              <div className="space-y-2">
                {p.messages.map((m) => (
                  <div
                    key={m.id}
                    className={"rounded-xl p-3 text-sm " + (m.direction === "inbound" ? "bg-peach" : "bg-sage-soft")}
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                      <span>{channelLabels[m.channel]} · {m.direction === "inbound" ? "환자" : "병원"}</span>
                      <span>{fromNow(m.createdAt)}</span>
                    </div>
                    <div className="text-ink">{m.body}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
