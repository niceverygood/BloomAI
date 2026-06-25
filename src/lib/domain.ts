// 난임 도메인 라벨/색상 매핑 (한국어 UI)

import { differenceInYears } from "date-fns";

export const stageLabels: Record<string, string> = {
  consult: "초진 상담",
  testing: "검사 진행",
  planning: "시술 계획",
  in_cycle: "사이클 진행중",
  pregnant: "임신 확인",
  followup: "추적 관리",
  inactive: "비활성",
};

export const stageOrder = ["consult", "testing", "planning", "in_cycle", "pregnant", "followup"];

export const stageBadge: Record<string, string> = {
  consult: "bg-gold-soft text-gold",
  testing: "bg-sage-soft text-sage",
  planning: "bg-peach-deep text-coral-deep",
  in_cycle: "bg-coral-soft text-coral-deep",
  pregnant: "bg-sage-soft text-sage",
  followup: "bg-gold-soft text-gold",
  inactive: "bg-line text-muted",
};

export const cycleTypeLabels: Record<string, string> = {
  natural: "자연주기",
  ovulation_induction: "배란유도",
  iui: "인공수정(IUI)",
  ivf: "체외수정(IVF)",
  fet: "동결배아이식(FET)",
};

export const cycleStatusLabels: Record<string, string> = {
  stimulation: "난소 자극",
  monitoring: "난포 모니터링",
  trigger: "트리거샷",
  retrieval: "난자 채취",
  transfer: "배아 이식",
  luteal: "황체기 보강",
  beta_test: "임신 확인(β-hCG)",
  complete: "사이클 종료",
};

// 사이클 진행 단계 순서 (프로그레스 바용)
export const cycleStatusOrder = [
  "stimulation",
  "monitoring",
  "trigger",
  "retrieval",
  "transfer",
  "luteal",
  "beta_test",
];

export const markerLabels: Record<string, string> = {
  E2: "에스트라디올 (E2)",
  LH: "황체형성호르몬 (LH)",
  P4: "프로게스테론 (P4)",
  FSH: "난포자극호르몬 (FSH)",
  AMH: "항뮬러관호르몬 (AMH)",
  beta_hcg: "β-hCG",
  follicle: "선도난포 크기",
};

export const apptTypeLabels: Record<string, string> = {
  consult: "상담",
  ultrasound: "난포 초음파",
  blood_test: "혈액 검사",
  retrieval: "난자 채취",
  transfer: "배아 이식",
  beta_test: "임신 확인",
};

export const apptStatusLabels: Record<string, string> = {
  scheduled: "예정",
  done: "완료",
  canceled: "취소",
  noshow: "노쇼",
};

export const medStatusLabels: Record<string, string> = {
  scheduled: "예정",
  taken: "완료",
  missed: "누락",
};

export const routeLabels: Record<string, string> = {
  sc: "피하주사",
  im: "근육주사",
  oral: "경구",
  vaginal: "질정",
};

export const channelLabels: Record<string, string> = {
  alimtalk: "알림톡",
  sms: "문자",
  chatbot: "AI 챗봇",
};

export const roleLabels: Record<string, string> = {
  coordinator: "코디네이터",
  nurse: "간호사",
  doctor: "의사",
  admin: "관리자",
};

export const riskLevelLabels: Record<string, string> = {
  low: "낮음",
  medium: "주의",
  high: "높음",
};

export const riskBadge: Record<string, string> = {
  low: "bg-sage-soft text-sage",
  medium: "bg-gold-soft text-gold",
  high: "bg-coral-soft text-coral-deep",
};

export function age(birthDate: Date | null | undefined): string {
  if (!birthDate) return "-";
  return `만 ${differenceInYears(new Date(), birthDate)}세`;
}

export function parseReasons(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
