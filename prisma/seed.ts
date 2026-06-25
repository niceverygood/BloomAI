import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- 시간 헬퍼 ----------
const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * 86400000);
const hours = (n: number) => new Date(now.getTime() + n * 3600000);
function todayAt(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function futureDayAt(addDays: number, h: number, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  return d;
}

// ---------- 랜덤 헬퍼 ----------
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const chance = (p: number) => Math.random() < p;
const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- 풀 ----------
const PATIENT_NAMES = [
  "정수민", "오하늘", "강유진", "윤서아", "임채원", "한지우", "송예린", "배소율",
  "김다은", "이지안", "박서윤", "최하린", "정유나", "조예진", "신민서", "권아름",
  "황지연", "안소희", "남궁혜원", "서수빈", "문가은", "양채은", "백지수", "고은별",
  "유하영", "전소연", "홍지민", "노아라", "심예원", "구본희", "차서영", "주민경",
  "하윤지", "엄지원", "선우정", "표하늘",
];
const PARTNER_NAMES = [
  "한도윤", "김태현", "조성민", "백준영", "신우진", "문성호", "노현우", "권도현",
  "이재欱", "박지훈", "정민석", "최우식", "강현수", "윤성재", "임도현", "조하준",
];
const DIAGNOSES = [
  "원인불명 난임", "다낭성난소증후군(PCOS)", "난소 예비능 저하(DOR)", "난관 요인",
  "자궁내막증", "남성 요인", "배란 장애", "반복 착상 실패", "고령 난임",
];
const CYCLE_TYPES = ["natural", "ovulation_induction", "iui", "ivf", "fet"];
const CYCLE_STATUSES = ["stimulation", "monitoring", "trigger", "retrieval", "transfer", "luteal", "beta_test"];

const STAGES: string[] = [
  ...Array(4).fill("consult"),
  ...Array(4).fill("testing"),
  ...Array(3).fill("planning"),
  ...Array(12).fill("in_cycle"),
  ...Array(3).fill("pregnant"),
  ...Array(4).fill("followup"),
  ...Array(2).fill("inactive"),
];

const STIM_MEDS = [
  { name: "Gonal-F", dose: "225 IU", route: "sc" },
  { name: "Menopur", dose: "150 IU", route: "sc" },
  { name: "Cetrotide", dose: "0.25 mg", route: "sc" },
  { name: "Puregon", dose: "200 IU", route: "sc" },
];
const SUPPORT_MEDS = [
  { name: "프로게스테론 질정", dose: "200 mg", route: "vaginal" },
  { name: "에스트라디올", dose: "2 mg", route: "oral" },
  { name: "오비드렐(트리거)", dose: "250 mcg", route: "sc" },
];

const AVATAR_COLORS = ["#FF6B81", "#4FA98E", "#F2A23C", "#7C5CBF", "#3B82F6"];

function consultSummary(opts: { anxious?: boolean; topic: string }) {
  const anxious = opts.anxious ?? false;
  return JSON.stringify({
    chiefComplaint: opts.topic,
    summary:
      "현재 시술 단계 및 향후 일정에 대해 상담함. 자가주사 투여와 다음 내원 일정을 안내했고 경과를 함께 점검함. (시드 데이터)",
    emotional: anxious
      ? "반복되는 과정에 대한 불안과 피로를 표현함. 정서적 지지가 필요해 보임."
      : "전반적으로 안정적이며 치료 계획에 협조적임.",
    decisions: ["현재 치료 계획 유지", "다음 검사 결과 확인 후 단계 결정"],
    followUpActions: anxious
      ? ["정서 케어 — 안심 메시지 발송", "다음 내원 일정 알림톡 발송"]
      : ["다음 내원 일정 알림톡 발송"],
    nextAppointment: "2-3일 내 난포 초음파",
    riskFlag: anxious ? "watch" : "none",
    mock: true,
  });
}

async function main() {
  console.log("🌸 BloomAI 시드(고도화) 생성 중...");

  // 정리
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

  const tenant = await prisma.tenant.create({
    data: { name: "블룸 난임센터", slug: "bloom-fertility", plan: "professional" },
  });

  const pwHash = await bcrypt.hash("bloom1234", 10);
  const staffDefs = [
    { name: "김서연", email: "coord@bloom.kr", role: "coordinator" },
    { name: "이수진", email: "coord2@bloom.kr", role: "coordinator" },
    { name: "박지호", email: "nurse@bloom.kr", role: "nurse" },
    { name: "최유나", email: "nurse2@bloom.kr", role: "nurse" },
    { name: "이민정", email: "doctor@bloom.kr", role: "doctor" },
    { name: "정우성", email: "admin@bloom.kr", role: "admin" },
  ];
  const staff = [];
  for (let i = 0; i < staffDefs.length; i++) {
    const s = staffDefs[i];
    staff.push(
      await prisma.user.create({
        data: { tenantId: tenant.id, name: s.name, email: s.email, role: s.role, passwordHash: pwHash, avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
      })
    );
  }
  const coordinators = staff.filter((s) => s.role === "coordinator" || s.role === "nurse");

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

  // 오늘 예약 시간대 (대시보드 '오늘의 일정' 채우기용)
  const todaySlots = [9, 9.5, 10, 10.5, 11, 13.5, 14, 14.5, 15.5, 16, 16.5, 17].map((h) => ({
    h: Math.floor(h),
    m: h % 1 === 0 ? 0 : 30,
  }));
  let slotIdx = 0;

  let aptToday = 0;
  let highRisk = 0;

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const name = PATIENT_NAMES[i];
    const coord = pick(coordinators);
    const amh = round1(randInt(3, 80) / 10); // 0.3 ~ 8.0

    const lastContactDays =
      stage === "followup" || stage === "inactive" ? -randInt(14, 40) : -randInt(0, 6);

    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        name,
        birthDate: new Date(`${randInt(1984, 1996)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`),
        phone: `010-${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
        partnerName: pick(PARTNER_NAMES),
        stage,
        diagnosis: pick(DIAGNOSES),
        amh,
        coordinatorId: coord.id,
        lastContactAt: days(lastContactDays),
      },
    });

    // ---- 사이클 ----
    let cycleId: string | undefined;
    const hasCycle = ["in_cycle", "pregnant", "followup"].includes(stage);
    if (hasCycle) {
      const type = stage === "pregnant" ? "ivf" : pick(CYCLE_TYPES);
      const status =
        stage === "pregnant" ? "beta_test" : stage === "followup" ? "complete" : pick(CYCLE_STATUSES);
      const cycle = await prisma.treatmentCycle.create({
        data: {
          patientId: patient.id,
          type,
          status,
          cycleNumber: randInt(1, 3),
          startedAt: days(-randInt(8, 20)),
          outcome: stage === "followup" ? "failed" : stage === "pregnant" ? "ongoing" : "ongoing",
        },
      });
      cycleId = cycle.id;
    }

    // ---- 검사 결과 (시계열) ----
    if (stage === "in_cycle" || stage === "testing") {
      await prisma.labResult.create({ data: { patientId: patient.id, marker: "AMH", value: amh, unit: "ng/mL", takenAt: days(-randInt(10, 20)) } });
      if (stage === "in_cycle") {
        let e2 = randInt(180, 320);
        let fol = randInt(10, 13);
        for (let d = -4; d <= 0; d += 2) {
          await prisma.labResult.create({ data: { patientId: patient.id, cycleId, marker: "E2", value: e2, unit: "pg/mL", takenAt: days(d) } });
          await prisma.labResult.create({ data: { patientId: patient.id, cycleId, marker: "follicle", value: fol, unit: "mm", takenAt: days(d) } });
          e2 = Math.round(e2 * randInt(17, 22) / 10);
          fol += randInt(2, 3);
        }
        await prisma.labResult.create({ data: { patientId: patient.id, cycleId, marker: "LH", value: round1(randInt(20, 80) / 10), unit: "mIU/mL", takenAt: days(0) } });
      }
    }
    if (stage === "pregnant") {
      await prisma.labResult.create({ data: { patientId: patient.id, cycleId, marker: "beta_hcg", value: randInt(120, 180), unit: "mIU/mL", takenAt: days(-5) } });
      await prisma.labResult.create({ data: { patientId: patient.id, cycleId, marker: "beta_hcg", value: randInt(350, 600), unit: "mIU/mL", takenAt: days(-3) } });
    }

    // ---- 약물/주사 ----
    if (stage === "in_cycle") {
      const med = pick(STIM_MEDS);
      // 오늘 저녁 예정
      await prisma.medication.create({ data: { patientId: patient.id, cycleId, name: med.name, dose: med.dose, route: med.route, scheduledAt: todayAt(20, 0), status: "scheduled" } });
      // 어제 (완료 또는 누락)
      const missed = chance(0.25);
      await prisma.medication.create({ data: { patientId: patient.id, cycleId, name: med.name, dose: med.dose, route: med.route, scheduledAt: hours(-randInt(16, 20)), status: missed ? "missed" : "taken", takenAt: missed ? null : hours(-18) } });
      if (chance(0.4)) {
        const sup = pick(SUPPORT_MEDS);
        await prisma.medication.create({ data: { patientId: patient.id, cycleId, name: sup.name, dose: sup.dose, route: sup.route, scheduledAt: todayAt(8, 0), status: "scheduled" } });
      }
    }

    // ---- 예약 ----
    if (["in_cycle", "testing", "consult", "planning"].includes(stage)) {
      // 일부는 오늘, 나머지는 향후
      if (aptToday < todaySlots.length && chance(0.55)) {
        const slot = todaySlots[slotIdx++ % todaySlots.length];
        aptToday++;
        const type = stage === "consult" ? "consult" : stage === "in_cycle" ? "ultrasound" : "blood_test";
        await prisma.appointment.create({ data: { patientId: patient.id, type, startsAt: todayAt(slot.h, slot.m), status: "scheduled" } });
      } else {
        await prisma.appointment.create({ data: { patientId: patient.id, type: stage === "in_cycle" ? "ultrasound" : "consult", startsAt: futureDayAt(randInt(1, 4), randInt(9, 16), pick([0, 30])), status: "scheduled" } });
      }
    }
    if (stage === "pregnant") {
      await prisma.appointment.create({ data: { patientId: patient.id, type: "ultrasound", startsAt: futureDayAt(randInt(2, 6), 10, 0), status: "scheduled" } });
    }

    // ---- 상담 기록 (AI 요약) ----
    if (chance(0.45)) {
      const anxious = chance(0.4);
      await prisma.consultation.create({
        data: {
          patientId: patient.id,
          authorId: coord.id,
          transcript: "환자와 현재 사이클 진행 상황 및 다음 단계에 대해 상담함. (시드 녹취)",
          summary: consultSummary({ anxious, topic: anxious ? "시술 진행에 대한 불안 및 일정 문의" : "현재 사이클 진행 상황 상담" }),
          aiModel: "데모(시드)",
          createdAt: days(-randInt(0, 5)),
        },
      });
    }

    // ---- 메시지 ----
    if (chance(0.55)) {
      await prisma.message.create({ data: { patientId: patient.id, channel: "alimtalk", direction: "outbound", body: "[블룸] 다음 내원 일정 안내드립니다. 확인 부탁드려요.", createdAt: hours(-randInt(20, 40)) } });
      if (chance(0.5)) {
        await prisma.message.create({ data: { patientId: patient.id, channel: "chatbot", direction: "inbound", body: pick(["오늘 주사 시간을 놓쳤는데 어떻게 하나요?", "이번엔 잘 될까요... 너무 불안해요.", "검사 결과는 언제 나오나요?", "주사 맞고 배가 더부룩한데 괜찮나요?"]), createdAt: hours(-randInt(2, 10)) } });
      }
    }

    // ---- 위험 스코어 ----
    let score: number, level: string, reasons: string[], action: string;
    if (stage === "followup" || stage === "inactive") {
      score = randInt(62, 85); level = "high";
      reasons = ["사이클 실패 후 장기 무응답", "재방문 예약 없음"];
      action = "이탈 위험 — 재상담 제안 + 정서 케어 콜 우선";
      highRisk++;
    } else if (chance(0.25)) {
      score = randInt(42, 60); level = "medium";
      reasons = pick([["최근 주사 1회 누락", "순응도 점검 필요"], ["반복 이식 — 정서 지지 필요"], ["응답 지연 패턴"]]);
      action = "주의 — 모니터링 및 케어 콜 검토";
    } else {
      score = randInt(8, 35); level = "low";
      reasons = ["일정 순응 양호"];
      action = "유지 — 정기 모니터링";
    }
    await prisma.riskScore.create({ data: { patientId: patient.id, score, level, reasons: JSON.stringify(reasons), action } });

    // ---- 할일 (AI/수동) ----
    if (stage === "in_cycle" && chance(0.5)) {
      await prisma.task.create({ data: { patientId: patient.id, assigneeId: coord.id, title: pick(["트리거샷 시점 의사 확인 필요", "난포 초음파 결과 검토", "자가주사 가이드 영상 발송"]), source: "ai", dueAt: days(0) } });
    }
    if (level === "high") {
      await prisma.task.create({ data: { patientId: patient.id, assigneeId: coord.id, title: "⚠ 이탈 위험 — 재상담 제안 콜 (우선순위 높음)", source: "ai", dueAt: days(0) } });
    }
    if (level === "medium" && chance(0.7)) {
      await prisma.task.create({ data: { patientId: patient.id, assigneeId: coord.id, title: "순응도/정서 케어 콜", source: "ai", dueAt: days(1) } });
    }
  }

  const [pc, apc, mc, cc, tc, rc] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.medication.count(),
    prisma.consultation.count(),
    prisma.task.count(),
    prisma.riskScore.count(),
  ]);
  console.log(`✅ 완료: 병원 1 · 직원 ${staff.length} · 환자 ${pc}`);
  console.log(`   예약 ${apc}(오늘 ${aptToday}) · 주사 ${mc} · 상담 ${cc} · 할일 ${tc} · 위험도 ${rc}(고위험 ${highRisk})`);
  console.log(`   로그인: coord@bloom.kr / bloom1234 (외 nurse@, doctor@, admin@)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
