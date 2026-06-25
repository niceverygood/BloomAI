import { prisma } from "./db";

/**
 * 현재 활성 테넌트(병원)와 사용자.
 *
 * ⚠️ MVP 데모용: 시드된 첫 번째 병원/코디네이터를 반환한다.
 * 프로덕션에서는 세션(인증) → tenantId 매핑으로 교체하고,
 * 모든 쿼리에 tenantId 스코프(또는 Postgres RLS)를 강제해야 한다.
 */
export async function getActiveContext() {
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
  if (!tenant) throw new Error("테넌트가 없습니다. `npm run db:seed` 를 실행하세요.");

  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: "coordinator" },
  });

  return { tenant, user };
}
