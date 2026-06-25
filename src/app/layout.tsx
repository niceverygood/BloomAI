import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloomAI — 난임 전문 AI CRM",
  description: "난임 클리닉을 위한 올인원 AI CRM. 상담 자동요약·환자 챗봇·시술 일정 자동화·이탈 예측.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BloomAI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FF6B81",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans">{children}</body>
    </html>
  );
}
