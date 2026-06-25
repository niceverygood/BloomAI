import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveContext } from "@/lib/tenant";
import { summarizeConsultation } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { patientId, transcript } = await req.json();
    if (!patientId || !transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: "환자와 상담 내용을 입력해 주세요." }, { status: 400 });
    }

    const { tenant, user } = await getActiveContext();
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: tenant.id },
    });
    if (!patient) {
      return NextResponse.json({ error: "환자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 1) Claude(또는 데모)로 상담 요약
    const summary = await summarizeConsultation(transcript, patient.name);

    // 2) 상담 기록 저장
    const consultation = await prisma.consultation.create({
      data: {
        patientId: patient.id,
        authorId: user?.id,
        transcript,
        summary: JSON.stringify(summary),
        aiModel: summary.mock ? "데모(목업)" : process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
      },
    });

    // 3) 후속 액션 → 할일 자동 등록
    const createdTasks = await Promise.all(
      (summary.followUpActions ?? []).map((title) =>
        prisma.task.create({
          data: {
            patientId: patient.id,
            assigneeId: user?.id,
            title,
            source: "ai",
            dueAt: new Date(Date.now() + 86400000),
          },
        })
      )
    );

    // 4) 최근 연락 시각 갱신
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastContactAt: new Date() },
    });

    return NextResponse.json({
      summary,
      consultationId: consultation.id,
      tasksCreated: createdTasks.length,
    });
  } catch (err) {
    console.error("[consultation-summary] error:", err);
    return NextResponse.json({ error: "요약 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
