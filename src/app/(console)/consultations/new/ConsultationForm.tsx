"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { stageLabels } from "@/lib/domain";

type PatientOpt = { id: string; name: string; stage: string };

type Summary = {
  chiefComplaint: string;
  summary: string;
  emotional: string;
  decisions: string[];
  followUpActions: string[];
  nextAppointment: string | null;
  riskFlag: "none" | "watch" | "urgent";
  mock: boolean;
};

const SAMPLE = `코디: 안녕하세요 수민님, 오늘 컨디션은 어떠세요?
환자: 네 괜찮아요. 근데 어제 자극 주사 맞고 나서 배가 조금 더부룩한 느낌이 있어요. 괜찮은 건가요?
코디: 자극 주사 맞으시면 난포가 자라면서 그런 느낌 드실 수 있어요. 심한 통증이나 갑자기 살이 찌는 느낌은 없으셨고요?
환자: 그 정도는 아니에요. 그냥 좀 빵빵한 느낌. 사실 이번이 두 번째라 잘 될까 걱정도 되고 좀 불안해요.
코디: 충분히 그러실 수 있어요. 어제 초음파상 난포가 잘 자라고 있어서 경과는 좋은 편이에요. 내일 다시 초음파 보고 트리거 시점 정할 거예요.
환자: 네. 주사는 오늘도 같은 시간에 맞으면 되죠?
코디: 네 저녁 8시에 고날에프 맞으시고, 길항제도 잊지 마세요. 혹시 복통이 심해지면 바로 연락 주세요.
환자: 알겠습니다. 감사합니다.`;

export function ConsultationForm({
  patients,
  defaultPatientId,
  hasApiKey,
}: {
  patients: PatientOpt[];
  defaultPatientId?: string;
  hasApiKey: boolean;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.id ?? "");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ summary: Summary; tasksCreated: number; consultationId: string } | null>(null);

  async function generate() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/consultation-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류가 발생했습니다.");
      setResult(data);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* 입력 */}
      <Card className="p-5">
        {!hasApiKey && (
          <div className="mb-4 rounded-xl bg-gold-soft px-4 py-3 text-xs font-semibold text-gold">
            데모 모드 — <code>ANTHROPIC_API_KEY</code> 미설정. 내장 요약 엔진으로 동작합니다. 키를 넣으면 실제 Claude로 정밀 요약됩니다.
          </div>
        )}

        <label className="mb-1.5 block text-sm font-bold text-plum">환자</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="mb-4 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {stageLabels[p.stage]}
            </option>
          ))}
        </select>

        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-bold text-plum">상담 녹취 / 메모</label>
          <button onClick={() => setTranscript(SAMPLE)} className="text-xs font-semibold text-coral-deep hover:underline">
            샘플 불러오기
          </button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={14}
          placeholder="상담 내용을 붙여넣거나 입력하세요. (음성 녹취 STT 연동 자리)"
          className="w-full resize-none rounded-xl border border-line bg-white px-3 py-3 text-sm leading-relaxed"
        />

        {error && <div className="mt-3 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral-deep">{error}</div>}

        <button onClick={generate} disabled={loading || !patientId || transcript.trim().length < 10} className="btn-primary mt-4 w-full">
          {loading ? "AI가 요약 중…" : "✨ AI 요약 생성"}
        </button>
      </Card>

      {/* 결과 */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
          <h2 className="text-base font-extrabold text-plum">구조화 요약</h2>
        </div>

        {!result ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
            왼쪽에 상담 내용을 입력하고<br />‘AI 요약 생성’을 눌러보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {result.summary.riskFlag !== "none" && (
              <div className={"rounded-xl px-4 py-3 text-sm font-semibold " + (result.summary.riskFlag === "urgent" ? "bg-coral-soft text-coral-deep" : "bg-gold-soft text-gold")}>
                {result.summary.riskFlag === "urgent" ? "🚨 응급 신호 감지 — 즉시 의료진 확인 필요" : "⚠ 주의 신호 — 정서/경과 모니터링 권장"}
              </div>
            )}

            <Field label="주호소">{result.summary.chiefComplaint}</Field>
            <Field label="상담 요약">{result.summary.summary}</Field>
            <Field label="환자 정서">{result.summary.emotional}</Field>

            {result.summary.decisions?.length > 0 && (
              <Field label="결정 사항">
                <ul className="list-disc space-y-0.5 pl-4">
                  {result.summary.decisions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </Field>
            )}

            <Field label={`후속 액션 (할일 ${result.tasksCreated}건 자동 등록됨)`}>
              <ul className="space-y-1">
                {result.summary.followUpActions.map((a, i) => (
                  <li key={i} className="rounded-lg bg-peach px-3 py-1.5 text-sm">☑ {a}</li>
                ))}
              </ul>
            </Field>

            {result.summary.nextAppointment && <Field label="다음 예약 제안">{result.summary.nextAppointment}</Field>}

            <div className="flex items-center justify-between pt-2 text-xs text-muted">
              <span>{result.summary.mock ? "데모 요약 (목업)" : "Claude 생성"}</span>
              <Link href={`/patients/${patientId}`} className="font-semibold text-coral-deep hover:underline">
                환자 차트에서 보기 →
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold text-coral-deep">{label}</div>
      <div className="mt-0.5 text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}
