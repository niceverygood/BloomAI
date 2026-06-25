"use client";

import { useEffect, useState } from "react";

const KEY = "bloomai_tour_done_v1";

const STEPS = [
  {
    icon: "🌸",
    title: "BloomAI에 오신 걸 환영해요",
    body: "난임 클리닉을 위한 올인원 AI CRM입니다. 핵심 기능을 30초만에 둘러볼게요.",
  },
  {
    icon: "▦",
    title: "대시보드 — 오늘의 우선순위",
    body: "오늘의 예약·주사 일정과 AI가 정리한 ‘처리 대기 큐’, 먼저 손 내밀어야 할 이탈 위험 환자를 한눈에 봅니다.",
  },
  {
    icon: "❤",
    title: "환자 360",
    body: "왼쪽 ‘환자’에서 시술 사이클 진행도, 검사 수치 추이, 주사 일정, 상담 기록, 메시지를 한 화면에서 확인하세요.",
  },
  {
    icon: "✨",
    title: "AI 상담요약 (플래그십)",
    body: "상담 녹취를 붙여넣으면 AI가 주호소·정서·결정사항·후속 액션으로 정리하고, 할일까지 자동 등록합니다.",
  },
  {
    icon: "📊",
    title: "AI 인사이트로 선제 케어",
    body: "이탈 위험을 점수화하고 추천 액션을 제시해, 환자가 떠나기 전에 먼저 케어할 수 있어요. 이제 시작해볼까요?",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function finish() {
    localStorage.setItem(KEY, "1");
    setOpen(false);
    setStep(0);
  }
  function openTour() {
    setStep(0);
    setOpen(true);
  }

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <>
      {/* 플로팅 도움말 버튼 (언제든 가이드 다시 보기) */}
      <button
        onClick={openTour}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-coral text-xl text-white shadow-pop transition-transform hover:scale-105"
        title="가이드 다시 보기"
        aria-label="가이드"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-pop">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft text-3xl">
              {s.icon}
            </div>
            <h2 className="text-xl font-extrabold text-plum">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={"h-1.5 rounded-full transition-all " + (i === step ? "w-5 bg-coral" : "w-1.5 bg-line")}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step === 0 ? (
                  <button onClick={finish} className="text-sm font-semibold text-muted hover:text-ink">건너뛰기</button>
                ) : (
                  <button onClick={() => setStep((v) => v - 1)} className="text-sm font-semibold text-muted hover:text-ink">이전</button>
                )}
                <button
                  onClick={() => (last ? finish() : setStep((v) => v + 1))}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {last ? "시작하기" : "다음"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
