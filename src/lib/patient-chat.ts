import Anthropic from "@anthropic-ai/sdk";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ChatResult = { reply: string; escalate: boolean; mock: boolean };

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SYSTEM = `너는 난임 클리닉 'BloomAI'의 환자 지원 AI 챗봇이다. 환자에게 정서적 지지와 일반 정보를 제공한다.

규칙:
- 너는 의사가 아니다. 진단, 처방, 약물 용량 변경을 절대 하지 않는다.
- 난임 환자는 정서적으로 힘든 경우가 많다. 따뜻하고 공감적인 한국어로 짧고 다정하게 답한다.
- 시술/주사/검사에 대한 일반 정보는 제공하되, 개인 의료 판단이 필요하면 반드시 "담당 의료진과 상의" 하도록 안내한다.
- 응급/위험 신호(심한 복통, 다량 출혈, 호흡곤란, 심한 어지럼, 고열, 자해 생각 등)가 보이면, 즉시 병원에 연락하도록 강하게 안내하고 답변 맨 끝에 [ESCALATE] 토큰을 붙인다.
- 2~4문장으로 짧게 답한다.`;

export async function patientChatReply(history: ChatTurn[], patientName?: string): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const lastUser = [...history].reverse().find((h) => h.role === "user")?.content || "";
  if (!apiKey) return mockReply(lastUser);

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM + (patientName ? `\n\n환자 이름: ${patientName}` : ""),
      messages: history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
    });
    let text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const escalate = text.includes("[ESCALATE]");
    text = text.replace(/\[ESCALATE\]/g, "").trim();
    return { reply: text, escalate, mock: false };
  } catch (err) {
    console.error("[patient-chat]", err);
    return mockReply(lastUser);
  }
}

function mockReply(last: string): ChatResult {
  const urgent = ["심한 복통", "출혈", "숨", "쓰러", "어지러", "고열"].some((k) => last.includes(k));
  if (urgent) {
    return {
      reply: "말씀하신 증상은 빠른 확인이 필요할 수 있어요. 지금 바로 담당 병원에 전화해 주세요. 많이 놀라셨죠, 괜찮으실 거예요. 곁에서 도울게요.",
      escalate: true,
      mock: true,
    };
  }
  if (["불안", "무섭", "걱정", "힘들", "울"].some((k) => last.includes(k))) {
    return { reply: "지금 많이 힘드시죠. 그 마음 충분히 이해해요. 난임 과정은 누구에게나 버겁고, 그렇게 느끼는 건 당연한 거예요. 혼자가 아니에요 — 필요하면 담당 코디네이터님께 정서 상담도 연결해 드릴 수 있어요. 🌷", escalate: false, mock: true };
  }
  if (["주사", "약"].some((k) => last.includes(k))) {
    return { reply: "자가주사는 정해진 시간에 맞추는 게 중요해요. 혹시 시간을 놓치셨다면 너무 걱정 마시고, 가능한 빨리 맞으신 뒤 담당 간호사님께 알려주세요. 정확한 안내는 의료진이 도와드릴 거예요. (데모 답변)", escalate: false, mock: true };
  }
  return { reply: "네, 말씀해 주셔서 감사해요. 제가 도울 수 있는 일반 정보는 안내해 드리고, 의료적 판단이 필요한 부분은 담당 의료진과 연결해 드릴게요. 어떤 점이 궁금하세요? (데모 답변 — 실제 Claude 연동 시 더 정밀해집니다)", escalate: false, mock: true };
}
