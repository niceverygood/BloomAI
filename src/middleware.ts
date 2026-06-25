import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로 (로그인 + 인증 API + 환자 모바일 PWA 데모 + 환자 API)
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/m" ||
    pathname.startsWith("/m/") ||
    pathname.startsWith("/api/patient")
  ) {
    return NextResponse.next();
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  // API는 401, 페이지는 로그인으로 리다이렉트
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // 정적 자산/이미지/매니페스트 제외하고 전부 보호
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:png|svg|jpg|jpeg|ico)$).*)"],
};
