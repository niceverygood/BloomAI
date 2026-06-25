# BloomAI — 난임 전문 AI CRM

난임 클리닉을 위한 올인원 AI CRM. **직원 콘솔(웹)** + AI 자동화 MVP.
> 상담 자동 기록·요약 · 시술 사이클 관리 · 환자 360 · 이탈 위험 인사이트 · 메시지 허브

## 빠른 시작

```bash
cd /Users/seungsoohan/Projects/BloomAI
npm install
npm run setup   # prisma generate + DB 생성 + 시드 데이터
npm run dev
```

→ 브라우저에서 **http://localhost:3000** 접속 (자동으로 `/dashboard` 이동)

### AI 실연동(선택)
기본은 키 없이 **데모(목업) 요약**으로 동작합니다. 실제 Claude로 돌리려면:

```bash
cd /Users/seungsoohan/Projects/BloomAI
# .env 파일에서 ANTHROPIC_API_KEY="sk-ant-..." 설정 후
npm run dev
```

## 기술 스택
- **Next.js 14 (App Router)** + TypeScript + Tailwind CSS
- **Prisma** ORM — 개발: SQLite(즉시 실행) / 프로덕션: PostgreSQL + RLS 권장
- **Claude API** (`@anthropic-ai/sdk`) — 상담 요약 (키 없으면 데모 폴백)

## 구현된 기능 (Phase 1)
| 화면 | 내용 |
|---|---|
| 대시보드 | KPI, 오늘의 일정, AI 할일 큐, 이탈 위험 인사이트 |
| 환자 파이프라인 | 단계별 필터, 사이클·위험도 한눈에 |
| 환자 360 | 사이클 진행도, 검사 추이 차트, 주사 일정, 상담기록, 메시지 |
| **AI 상담요약** | 녹취 → 구조화 노트 + 후속 할일 자동 등록 (플래그십) |
| 메시지 허브 | 알림톡/문자/챗봇 통합 + 에스컬레이션 큐 |
| 설정 | 병원·팀·프로토콜·AI 연동 상태 |

## 데이터 모델
`prisma/schema.prisma` 참고 — Tenant(병원) 기준 멀티테넌트. 핵심 엔티티:
Patient · TreatmentCycle · LabResult · Medication · Appointment · Consultation · Message · Task · RiskScore · Protocol

## 프로덕션 전환 체크리스트 (다음 단계)
- [ ] DB를 **PostgreSQL + Row Level Security**로 전환 (테넌트 격리 강제)
- [ ] 인증(직원 RBAC / 환자) — 현재 `lib/tenant.ts`는 데모용 스텁
- [ ] 카카오 알림톡 / SMS 실연동
- [ ] 한국어 STT(음성→텍스트) 파이프라인
- [ ] 환자용 모바일 앱(React Native)
- [ ] AI 챗봇(RAG) · 일정 자동화 · 이탈 예측 모델 고도화
- [ ] 의료데이터 규제(개인정보보호법·의료법) · 동의·감사로그 · 암호화

자세한 제품 기획은 [`docs/제품기획서.md`](docs/제품기획서.md) 참고.
