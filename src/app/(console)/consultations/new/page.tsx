import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { PageHeader } from "@/components/ui";
import { ConsultationForm } from "./ConsultationForm";

export const dynamic = "force-dynamic";

export default async function NewConsultationPage({
  searchParams,
}: {
  searchParams: { patientId?: string };
}) {
  const { tenant } = await getActiveContext();
  const patients = await prisma.patient.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, stage: true },
    orderBy: { name: "asc" },
  });

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div>
      <PageHeader
        kicker="AI 상담요약"
        title="상담 자동 기록 · 요약"
        description="상담 녹취를 붙여넣으면 AI가 난임 특화 노트로 정리하고, 후속 할일까지 자동 등록합니다."
      />
      <ConsultationForm patients={patients} defaultPatientId={searchParams.patientId} hasApiKey={hasApiKey} />
    </div>
  );
}
