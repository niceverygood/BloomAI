import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export const metadata = { title: "로그인 — BloomAI" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* 좌측 브랜드 패널 */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-peach via-coral-soft to-[#FFD9E2] p-12 lg:flex">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-xl font-extrabold text-plum">
            Bloom<span className="text-coral-deep">AI</span>
          </span>
        </div>
        <div>
          <div className="text-3xl font-extrabold leading-snug text-plum">
            코디네이터의 손과<br />환자의 마음을<br />동시에 돌보다
          </div>
          <p className="mt-4 max-w-sm text-sm text-[#6E4A55]">
            난임 클리닉을 위한 올인원 AI CRM. 상담 자동요약·시술 일정 자동화·환자 케어를 한 곳에서.
          </p>
        </div>
        <div className="text-xs text-[#8A6A74]">© 2026 BloomAI · 난임 전문 AI CRM</div>
      </div>

      {/* 우측 로그인 */}
      <div className="flex flex-1 items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <Logo size={26} />
              <span className="text-lg font-extrabold text-plum">
                Bloom<span className="text-coral-deep">AI</span>
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-plum">로그인</h1>
          <p className="mt-1 text-sm text-muted">병원 계정으로 로그인하세요.</p>
          <Suspense fallback={<div className="mt-6 text-sm text-muted">로딩 중…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
