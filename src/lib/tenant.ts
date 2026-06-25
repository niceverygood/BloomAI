import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./auth";

/**
 * 현재 로그인 세션 → 테넌트(병원) + 사용자.
 * 세션이 없으면 /login 으로. (middleware가 1차 게이트, 여기서 2차 안전망)
 */
export async function getActiveContext() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });
  if (!user) redirect("/login");

  return { tenant: user.tenant, user };
}
