import Link from "next/link";
import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { PageHeader, Card, Badge } from "@/components/ui";
import {
  stageLabels,
  stageBadge,
  stageOrder,
  cycleTypeLabels,
  cycleStatusLabels,
  riskBadge,
  riskLevelLabels,
  age,
} from "@/lib/domain";
import { fromNow } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { stage?: string };
}) {
  const { tenant } = await getActiveContext();
  const activeStage = searchParams.stage;

  const patients = await prisma.patient.findMany({
    where: { tenantId: tenant.id, ...(activeStage ? { stage: activeStage } : {}) },
    include: {
      cycles: { orderBy: { startedAt: "desc" }, take: 1 },
      riskScores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const counts = await prisma.patient.groupBy({
    by: ["stage"],
    where: { tenantId: tenant.id },
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.stage, c._count]));
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <div>
      <PageHeader
        kicker="환자"
        title="환자 파이프라인"
        description="단계별로 환자를 관리하고, AI가 표시한 위험 신호를 함께 확인하세요."
      />

      {/* 단계 필터 */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip label={`전체 ${total}`} href="/patients" active={!activeStage} />
        {stageOrder.map((s) => (
          <FilterChip
            key={s}
            label={`${stageLabels[s]} ${countMap[s] ?? 0}`}
            href={`/patients?stage=${s}`}
            active={activeStage === s}
          />
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-peach/50 text-left text-xs font-bold text-muted">
              <th className="px-5 py-3">환자</th>
              <th className="px-5 py-3">단계</th>
              <th className="px-5 py-3">현재 사이클</th>
              <th className="px-5 py-3">AI 위험도</th>
              <th className="px-5 py-3">최근 연락</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {patients.map((p) => {
              const cycle = p.cycles[0];
              const risk = p.riskScores[0];
              return (
                <tr key={p.id} className="group hover:bg-peach/40">
                  <td className="px-5 py-3">
                    <Link href={`/patients/${p.id}`} className="block">
                      <div className="font-bold text-plum group-hover:text-coral-deep">{p.name}</div>
                      <div className="text-xs text-muted">
                        {age(p.birthDate)} · {p.diagnosis ?? "-"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={stageBadge[p.stage]}>{stageLabels[p.stage]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {cycle ? (
                      <div>
                        <div className="font-semibold text-ink">{cycleTypeLabels[cycle.type]}</div>
                        <div className="text-xs text-muted">
                          {cycle.cycleNumber}차 · {cycleStatusLabels[cycle.status]}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {risk ? (
                      <Badge className={riskBadge[risk.level]}>
                        {risk.score} · {riskLevelLabels[risk.level]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{fromNow(p.lastContactAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors " +
        (active ? "bg-coral text-white" : "bg-white border border-line text-muted hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}
