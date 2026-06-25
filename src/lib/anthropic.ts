import Anthropic from "@anthropic-ai/sdk";

/**
 * BloomAI — Claude 기반 상담 자동 요약
 *
 * ANTHROPIC_API_KEY 가 설정되어 있으면 실제 Claude API로 동작하고,
 * 없으면 내장 데모(목업) 요약으로 폴백한다. → 키 없이도 앱 전체가 실행됨.
 *
 * 안전 원칙: AI는 진단·처방하지 않는다. 기록 구조화·후속 액션 추출까지만.
 */

export type ConsultationSummary = {
  chiefComplaint: string; // 주호소
  summary: string; // 상담 내용 요약
  emotional: string; // 환자 정서/우려
  decisions: string[]; // 결정 사항
  followUpActions: string[]; // 후속 액션 (→ 할일 자동 등록)
  nextAppointment: string | null; // 다음 예약 제안
  riskFlag: "none" | "watch" | "urgent"; // 위험 신호 감지
  mock: boolean; // 데모 모드 여부
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SYSTEM = `너는 대한민국 난임 전문 클리닉의 상담 기록을 돕는 AI 어시스턴트다.
코디네이터/간호사가 환자와 나눈 상담 녹취를 받아, 차트에 바로 붙일 수 있는 구조화된 노트로 정리한다.

규칙:
- 너는 의료적 진단이나 처방을 하지 않는다. 기록 정리와 후속 행정 액션 추출에 집중한다.
- 난임 도메인 용어(난포, 자극주사, 트리거, 채취, 이식, 황체기, β-hCG, AMH 등)를 정확히 사용한다.
- 환자의 정서적 상태(불안, 좌절, 기대 등)를 반드시 별도로 포착한다. 난임 케어에서 매우 중요하다.
- 응급/위험 신호(심한 복통, OHSS 의심, 다량 출혈, 자해 언급 등)가 보이면 riskFlag를 "urgent"로 둔다.
- 반드시 아래 JSON 스키마로만 응답한다. 다른 텍스트를 절대 추가하지 마라.

{
  "chiefComplaint": "주호소 한 줄",
  "summary": "상담 핵심 내용 2-4문장",
  "emotional": "환자의 정서 상태/우려 1-2문장",
  "decisions": ["결정사항1", "결정사항2"],
  "followUpActions": ["코디가 할 후속 액션(행정/안내)"],
  "nextAppointment": "다음 예약 제안 또는 null",
  "riskFlag": "none | watch | urgent"
}`;

export async function summarizeConsultation(
  transcript: string,
  patientName?: string
): Promise<ConsultationSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return mockSummary(transcript);

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `환자: ${patientName ?? "환자"}\n\n[상담 녹취]\n${transcript}\n\n위 상담을 지정된 JSON 스키마로 요약해줘.`,
        },
      ],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const parsed = extractJson(text);
    return {
      chiefComplaint: parsed.chiefComplaint ?? "",
      summary: parsed.summary ?? "",
      emotional: parsed.emotional ?? "",
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      followUpActions: Array.isArray(parsed.followUpActions) ? parsed.followUpActions : [],
      nextAppointment: parsed.nextAppointment ?? null,
      riskFlag: ["none", "watch", "urgent"].includes(parsed.riskFlag) ? parsed.riskFlag : "none",
      mock: false,
    };
  } catch (err) {
    console.error("[anthropic] 호출 실패, 데모 요약으로 폴백:", err);
    return { ...mockSummary(transcript), mock: true };
  }
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}

/** 키 없이도 그럴듯하게 동작하는 데모 요약 (입력 기반 휴리스틱) */
function mockSummary(transcript: string): ConsultationSummary {
  const t = transcript.toLowerCase();
  const has = (...kw: string[]) => kw.some((k) => transcript.includes(k));

  const urgent = has("심한 복통", "출혈", "쓰러", "숨", "응급");
  const anxious = has("불안", "걱정", "무섭", "힘들", "우울", "지친", "포기");

  const decisions: string[] = [];
  const actions: string[] = [];
  if (has("주사", "자극", "약")) {
    decisions.push("자극 주사 일정 유지 및 자가주사 안내 재확인");
    actions.push("자가주사 가이드 영상 알림톡 발송");
  }
  if (has("초음파", "난포", "모니터")) {
    decisions.push("난포 모니터링 위해 추가 내원 일정 조정");
    actions.push("난포 초음파 예약 확정 및 알림톡 발송");
  }
  if (has("이식", "채취", "트리거")) {
    decisions.push("시술 단계 일정은 검사 결과 확인 후 확정");
    actions.push("시술 일정 후보 정리 후 의료진 승인 요청");
  }
  if (has("비용", "지원", "보험")) {
    actions.push("시술 비용 및 정부지원 안내 자료 발송");
  }
  if (anxious) actions.push("정서 케어 — 안심 메시지/상담 콜 검토");
  if (actions.length === 0) {
    actions.push("상담 내용 차트 반영 및 다음 단계 안내");
  }

  return {
    chiefComplaint: has("불안", "걱정")
      ? "시술 진행에 대한 불안 및 일정 문의"
      : "현재 사이클 진행 상황 및 다음 단계 상담",
    summary:
      "환자와 현재 시술 단계 및 향후 일정에 대해 상담함. " +
      (has("주사") ? "자가주사 투여와 관련한 안내를 진행했고, " : "") +
      "다음 내원 및 검사 일정에 대해 논의함. (데모 요약 — 실제 Claude 연동 시 정밀도 향상)",
    emotional: anxious
      ? "반복되는 과정에 대한 불안과 피로를 표현함. 정서적 지지가 필요해 보임."
      : "전반적으로 안정적이며 치료 계획에 협조적임.",
    decisions: decisions.length ? decisions : ["현재 치료 계획 유지", "다음 검사 결과 확인 후 단계 결정"],
    followUpActions: actions,
    nextAppointment: has("초음파", "난포") ? "2-3일 내 난포 초음파" : "다음 주기 상담 예약",
    riskFlag: urgent ? "urgent" : anxious ? "watch" : "none",
    mock: true,
  };
}

export const SAMPLE_TRANSCRIPT = `코디: 안녕하세요 수민님, 오늘 컨디션은 어떠세요?
환자: 네 괜찮아요. 근데 어제 자극 주사 맞고 나서 배가 조금 더부룩한 느낌이 있어요. 괜찮은 건가요?
코디: 자극 주사 맞으시면 난포가 자라면서 그런 느낌 드실 수 있어요. 심한 통증이나 갑자기 살이 찌는 느낌은 없으셨고요?
환자: 그 정도는 아니에요. 그냥 좀 빵빵한 느낌. 사실 이번이 두 번째라 잘 될까 걱정도 되고 좀 불안해요.
코디: 충분히 그러실 수 있어요. 어제 초음파상 난포가 잘 자라고 있어서 경과는 좋은 편이에요. 내일 다시 초음파 보고 트리거 시점 정할 거예요.
환자: 네. 주사는 오늘도 같은 시간에 맞으면 되죠?
코디: 네 저녁 8시에 고날에프 맞으시고, 길항제도 잊지 마세요. 혹시 복통이 심해지면 바로 연락 주세요.
환자: 알겠습니다. 감사합니다.`;
