"use client";

import { useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string; escalate?: boolean };

export function MobileChat({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [turns, setTurns] = useState<Turn[]>([
    { role: "assistant", content: `${patientName}님, 저는 24시간 함께하는 BloomAI예요. 궁금한 점이나 마음이 힘든 순간, 언제든 편하게 말씀해 주세요. 🌷` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...turns, { role: "user" as const, content: text }];
    setTurns(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/patient/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, messages: next.map((t) => ({ role: t.role, content: t.content })) }),
      });
      const data = await res.json();
      setTurns((t) => [...t, { role: "assistant", content: data.reply || "죄송해요, 다시 시도해 주세요.", escalate: data.escalate }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "연결이 불안정해요. 잠시 후 다시 시도해 주세요." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  const SUGGEST = ["주사 시간을 놓쳤어요", "이번에 잘 될지 너무 불안해요", "검사 결과는 언제 나오나요?"];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3">
        <span className="rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
        <span className="text-sm font-bold text-plum">AI 케어 챗봇</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-sage"><span className="h-1.5 w-1.5 rounded-full bg-sage" /> 24시간</span>
      </div>

      <div ref={scrollRef} className="max-h-72 space-y-2.5 overflow-y-auto bg-peach/40 p-3">
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed " +
                (t.role === "user"
                  ? "bg-coral text-white"
                  : t.escalate
                  ? "bg-coral-soft text-coral-deep font-semibold"
                  : "bg-white text-ink")
              }
            >
              {t.escalate && <div className="mb-1 text-xs">🚨 즉시 병원 연락 권장</div>}
              {t.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="rounded-2xl bg-white px-3.5 py-2 text-sm text-muted">…</div></div>}
      </div>

      {turns.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {SUGGEST.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="rounded-full bg-peach px-2.5 py-1 text-[11px] font-semibold text-coral-deep">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
        />
        <button onClick={send} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white disabled:opacity-50">
          ↑
        </button>
      </div>
    </div>
  );
}
