import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 상대 날짜 헬퍼
const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * 86400000);
const hours = (n: number) => new Date(now.getTime() + n * 3600000);

async function main() {
  console.log("🌸 BloomAI 시드 데이터 생성 중...");

  // 기존 데이터 정리 (개발용)
  await prisma.riskScore.deleteMany();
  await prisma.task.deleteMany();
  await prisma.message.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.treatmentCycle.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // --- 테넌트(병원) ---
  const tenant = await prisma.tenant.create({
    data: {
      name: "블룸 난임센터",
      slug: "bloom-fertility",
      plan: "professional",
    },
  });

  // --- 직원 ---
  const coordinator = await prisma.user.create({
    data: { tenantId: tenant.id, name: "김서연", email: "coord@bloom.kr", role: "coordinator" },
  });
  const nurse = await prisma.user.create({
    data: { tenantId: tenant.id, name: "박지호", email: "nurse@bloom.kr", role: "nurse" },
  });
  const doctor = await prisma.user.create({
    data: { tenantId: tenant.id, name: "이민정", email: "doctor@bloom.kr", role: "doctor" },
  });

  // --- 프로토콜 ---
  await prisma.protocol.create({
    data: {
      tenantId: tenant.id,
      name: "IVF 길항제 프로토콜",
      type: "ivf",
      steps: JSON.stringify([
        "월경 2-3일차 기저 검사(E2/FSH/초음파)",
        "고나도트로핀 자극 시작 (Gonal-F 225IU)",
        "5일차부터 난포 모니터링 + 길항제(Cetrotide)",
        "선도난포 18mm 도달 시 트리거(Ovidrel)",
        "트리거 36시간 후 난자채취(OPU)",
        "수정·배양 (3-5일)",
        "배아이식(ET) + 황체기 보강(프로게스테론)",
        "이식 10-12일 후 β-hCG 검사",
      ]),
    },
  });

  // --- 환자 데이터 정의 ---
  type Seed = {
    name: string;
    birth: string;
    phone: string;
    partner: string;
    stage: string;
    diagnosis: string;
    amh: number;
    lastContactDays: number;
    cycle?: { type: string; status: string; n: number };
    labs?: { marker: string; value: number; unit: string; d: number }[];
    meds?: { name: string; dose: string; route: string; h: number; status: string }[];
    appts?: { type: string; h: number; status: string }[];
    risk?: { score: number; level: string; reasons: string[]; action: string };
    messages?: { channel: string; dir: string; body: string; h: number }[];
    tasks?: { title: string; d: number; source: string; done?: boolean }[];
  };

  const patients: Seed[] = [
    {
      name: "정수민", birth: "1989-04-12", phone: "010-2345-6789", partner: "한도윤",
      stage: "in_cycle", diagnosis: "원인불명 난임", amh: 1.8, lastContactDays: -1,
      cycle: { type: "ivf", status: "monitoring", n: 2 },
      labs: [
        { marker: "E2", value: 320, unit: "pg/mL", d: -4 },
        { marker: "E2", value: 880, unit: "pg/mL", d: -2 },
        { marker: "E2", value: 1640, unit: "pg/mL", d: 0 },
        { marker: "follicle", value: 16, unit: "mm", d: 0 },
        { marker: "LH", value: 3.2, unit: "mIU/mL", d: 0 },
      ],
      meds: [
        { name: "Gonal-F", dose: "225 IU", route: "sc", h: 8, status: "scheduled" },
        { name: "Cetrotide", dose: "0.25 mg", route: "sc", h: 9, status: "scheduled" },
        { name: "Gonal-F", dose: "225 IU", route: "sc", h: -16, status: "taken" },
      ],
      appts: [{ type: "ultrasound", h: 18, status: "scheduled" }],
      risk: { score: 18, level: "low", reasons: ["일정 순응 양호", "주사 누락 없음"], action: "유지 — 정기 모니터링" },
      messages: [
        { channel: "alimtalk", dir: "outbound", body: "[블룸] 내일 오전 9시 난포 초음파 예약 안내드립니다.", h: -20 },
        { channel: "chatbot", dir: "inbound", body: "오늘 주사 시간 놓치면 어떻게 하나요?", h: -22 },
      ],
      tasks: [{ title: "트리거샷 시점 의사 확인 필요 (선도난포 16mm)", d: 0, source: "ai" }],
    },
    {
      name: "오하늘", birth: "1992-09-30", phone: "010-3456-7890", partner: "김태현",
      stage: "in_cycle", diagnosis: "다낭성난소증후군(PCOS)", amh: 6.4, lastContactDays: -3,
      cycle: { type: "ivf", status: "stimulation", n: 1 },
      labs: [
        { marker: "AMH", value: 6.4, unit: "ng/mL", d: -14 },
        { marker: "E2", value: 210, unit: "pg/mL", d: -2 },
        { marker: "follicle", value: 11, unit: "mm", d: -2 },
      ],
      meds: [
        { name: "Menopur", dose: "150 IU", route: "sc", h: 7, status: "scheduled" },
        { name: "Menopur", dose: "150 IU", route: "sc", h: -17, status: "missed" },
      ],
      appts: [{ type: "blood_test", h: 30, status: "scheduled" }],
      risk: { score: 58, level: "medium", reasons: ["최근 주사 1회 누락", "PCOS — OHSS 모니터링 필요"], action: "주사 순응 콜 + OHSS 증상 안내" },
      messages: [{ channel: "alimtalk", dir: "outbound", body: "[블룸] 자극 주사 누락이 확인되었어요. 가능한 빨리 투여 후 알려주세요.", h: -16 }],
      tasks: [{ title: "주사 누락 환자 — 순응도 콜", d: 0, source: "ai" }],
    },
    {
      name: "강유진", birth: "1986-01-22", phone: "010-4567-8901", partner: "조성민",
      stage: "in_cycle", diagnosis: "난소 예비능 저하(DOR)", amh: 0.7, lastContactDays: -2,
      cycle: { type: "fet", status: "transfer", n: 3 },
      labs: [
        { marker: "P4", value: 12.4, unit: "ng/mL", d: 0 },
        { marker: "E2", value: 240, unit: "pg/mL", d: 0 },
      ],
      meds: [
        { name: "프로게스테론 질정", dose: "200 mg", route: "vaginal", h: 6, status: "scheduled" },
        { name: "에스트라디올", dose: "2 mg", route: "oral", h: 6, status: "scheduled" },
      ],
      appts: [{ type: "beta_test", h: 240, status: "scheduled" }],
      risk: { score: 44, level: "medium", reasons: ["3회차 이식 — 정서 지지 필요", "이전 사이클 실패"], action: "이식 후 정서 케어 메시지 발송" },
      messages: [{ channel: "chatbot", dir: "inbound", body: "이번엔 잘 될까요... 너무 불안해요.", h: -5 }],
      tasks: [{ title: "정서 케어 — 이식 후 안심 메시지 검토", d: 1, source: "ai" }],
    },
    {
      name: "윤서아", birth: "1990-11-08", phone: "010-5678-9012", partner: "백준영",
      stage: "pregnant", diagnosis: "난관 요인", amh: 2.1, lastContactDays: -7,
      cycle: { type: "ivf", status: "beta_test", n: 1 },
      labs: [
        { marker: "beta_hcg", value: 142, unit: "mIU/mL", d: -5 },
        { marker: "beta_hcg", value: 410, unit: "mIU/mL", d: -3 },
      ],
      appts: [{ type: "ultrasound", h: 72, status: "scheduled" }],
      risk: { score: 10, level: "low", reasons: ["임신 확인 — β-hCG 정상 상승"], action: "초기 임신 관리 안내" },
      messages: [{ channel: "alimtalk", dir: "outbound", body: "[블룸] 축하드립니다! β-hCG 수치가 정상적으로 상승했어요. 다음 초음파 일정 안내드립니다.", h: -70 }],
      tasks: [{ title: "임신 초기 관리 안내문 발송", d: 0, source: "ai", done: true }],
    },
    {
      name: "임채원", birth: "1994-06-17", phone: "010-6789-0123", partner: "신우진",
      stage: "testing", diagnosis: "검사 진행중", amh: 3.2, lastContactDays: -4,
      labs: [
        { marker: "AMH", value: 3.2, unit: "ng/mL", d: -4 },
        { marker: "FSH", value: 6.8, unit: "mIU/mL", d: -4 },
      ],
      appts: [{ type: "consult", h: 48, status: "scheduled" }],
      risk: { score: 22, level: "low", reasons: ["초기 검사 단계"], action: "검사 결과 상담 예약 확정" },
      tasks: [{ title: "AMH/FSH 결과 기반 시술 상담 준비", d: 2, source: "ai" }],
    },
    {
      name: "한지우", birth: "1988-03-05", phone: "010-7890-1234", partner: "문성호",
      stage: "consult", diagnosis: "초진", amh: 1.1, lastContactDays: -1,
      appts: [{ type: "consult", h: 4, status: "scheduled" }],
      risk: { score: 30, level: "low", reasons: ["초진 — 전환 관리 필요"], action: "초진 후 검사 패키지 안내" },
      tasks: [{ title: "오늘 초진 상담 — 녹취 후 AI 요약", d: 0, source: "manual" }],
    },
    {
      name: "송예린", birth: "1991-08-25", phone: "010-8901-2345", partner: "노현우",
      stage: "followup", diagnosis: "1차 IVF 실패 후 추적", amh: 1.5, lastContactDays: -21,
      cycle: { type: "ivf", status: "complete", n: 1 },
      risk: { score: 76, level: "high", reasons: ["사이클 실패 후 21일 무응답", "재방문 예약 없음", "비용 문의 후 연락 두절"], action: "이탈 위험 — 재상담 제안 + 정서 케어 콜 우선" },
      messages: [{ channel: "sms", dir: "outbound", body: "[블룸] 지난 시술 이후 잘 지내고 계신가요? 다음 단계가 궁금하시면 편히 연락 주세요.", h: -300 }],
      tasks: [{ title: "⚠ 이탈 위험 — 재상담 제안 콜 (우선순위 높음)", d: 0, source: "ai" }],
    },
    {
      name: "배소율", birth: "1993-12-14", phone: "010-9012-3456", partner: "권도현",
      stage: "in_cycle", diagnosis: "남성 요인", amh: 2.8, lastContactDays: -2,
      cycle: { type: "iui", status: "monitoring", n: 1 },
      labs: [
        { marker: "E2", value: 180, unit: "pg/mL", d: -1 },
        { marker: "follicle", value: 14, unit: "mm", d: -1 },
        { marker: "LH", value: 5.1, unit: "mIU/mL", d: -1 },
      ],
      appts: [{ type: "ultrasound", h: 24, status: "scheduled" }],
      risk: { score: 26, level: "low", reasons: ["IUI 1차 — 양호"], action: "배란 시점 모니터링 유지" },
      tasks: [{ title: "배란 시점 IUI 일정 확정", d: 1, source: "ai" }],
    },
  ];

  for (const p of patients) {
    const coord = [coordinator.id, nurse.id][Math.floor(Math.random() * 2)];
    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        name: p.name,
        birthDate: new Date(p.birth),
        phone: p.phone,
        partnerName: p.partner,
        stage: p.stage,
        diagnosis: p.diagnosis,
        amh: p.amh,
        coordinatorId: coordinator.id,
        lastContactAt: days(p.lastContactDays),
      },
    });

    let cycleId: string | undefined;
    if (p.cycle) {
      const cycle = await prisma.treatmentCycle.create({
        data: {
          patientId: patient.id,
          type: p.cycle.type,
          status: p.cycle.status,
          cycleNumber: p.cycle.n,
          startedAt: days(-14),
          outcome: p.cycle.status === "complete" ? "failed" : "ongoing",
        },
      });
      cycleId = cycle.id;
    }

    for (const l of p.labs ?? []) {
      await prisma.labResult.create({
        data: { patientId: patient.id, cycleId, marker: l.marker, value: l.value, unit: l.unit, takenAt: days(l.d) },
      });
    }
    for (const m of p.meds ?? []) {
      await prisma.medication.create({
        data: {
          patientId: patient.id, cycleId, name: m.name, dose: m.dose, route: m.route,
          scheduledAt: hours(m.h), status: m.status,
          takenAt: m.status === "taken" ? hours(m.h) : null,
        },
      });
    }
    for (const a of p.appts ?? []) {
      await prisma.appointment.create({
        data: { patientId: patient.id, type: a.type, startsAt: hours(a.h), status: a.status },
      });
    }
    for (const msg of p.messages ?? []) {
      await prisma.message.create({
        data: { patientId: patient.id, channel: msg.channel, direction: msg.dir, body: msg.body, createdAt: hours(msg.h) },
      });
    }
    for (const t of p.tasks ?? []) {
      await prisma.task.create({
        data: { patientId: patient.id, assigneeId: coordinator.id, title: t.title, dueAt: days(t.d), source: t.source, done: t.done ?? false },
      });
    }
    if (p.risk) {
      await prisma.riskScore.create({
        data: { patientId: patient.id, score: p.risk.score, level: p.risk.level, reasons: JSON.stringify(p.risk.reasons), action: p.risk.action },
      });
    }
  }

  const count = await prisma.patient.count();
  console.log(`✅ 완료: 병원 1곳, 직원 3명, 환자 ${count}명 + 사이클/검사/주사/상담/할일/위험도`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
