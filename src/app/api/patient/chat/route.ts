import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { patientChatReply, type ChatTurn } from "@/lib/patient-chat";

export async function POST(req: NextRequest) {
  try {
    const { patientId, messages } = (await req.json()) as { patientId?: string; messages: ChatTurn[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }

    let name: string | undefined;
    if (patientId) {
      const p = await prisma.patient.findUnique({ where: { id: patientId }, select: { name: true } });
      name = p?.name;
    }

    const result = await patientChatReply(messages, name);

    // 환자 대화 로그 저장 (있으면)
    if (patientId) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (lastUser) {
        await prisma.message.create({
          data: { patientId, channel: "chatbot", direction: "inbound", body: lastUser.content },
        });
      }
      await prisma.message.create({
        data: { patientId, channel: "chatbot", direction: "outbound", body: result.reply },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[patient/chat]", err);
    return NextResponse.json({ error: "응답 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
