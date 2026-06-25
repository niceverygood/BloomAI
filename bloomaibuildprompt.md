# 블룸ai (BloomAI) — Claude Code 빌드 프롬프트

> 이 문서를 새 프로젝트의 Claude Code에 그대로 붙여넣어 사용하세요.
> 기존 `maria-reservation`(일산마리아병원 재진 예약 시스템)에 구현된 **모든 기능**을
> 범용 멀티테넌트 난임 전문 CRM으로 재구성하기 위한 사양입니다.

---

## 0. 프로젝트 정체성

- **제품명**: 블룸ai (BloomAI)
- **한 줄 설명**: 난임 병원을 위한 범용(멀티테넌트) 환자관리·예약 CRM. "결실을 향한 여정을 함께."
- **핵심 차별점**: 기존 마리아 예약 시스템의 검증된 예약 엔진을 기반으로, ① 멀티테넌시(여러 병원/지점), ② 난임 특화 도메인(시술 주기·상담·환자 여정), ③ AI 보조 기능을 더한다.
- **언어/지역**: 한국어 우선(`lang="ko"`), 타임존 `Asia/Seoul`, 통화/날짜 한국 포맷.

---

## 1. 기술 스택 (마리아와 동일 기반 + 최신화)

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript (strict) |
| DB | PostgreSQL (Supabase/PgBouncer 호환) + Prisma 5 |
| 스타일 | Tailwind CSS 4 + Pretendard 폰트 |
| 인증 | JWT(쿠키 기반) — 환자/관리자 분리 토큰, bcrypt 해시 |
| 환자 로그인 | 카카오 OAuth + Firebase 전화번호 인증(SMS OTP) |
| 알림 | 카카오 알림톡(Solapi) + SMS 폴백(Aligo) |
| 실시간 | WebSocket 서버(별도 프로세스) |
| 배포 | Vercel (서울 리전 icn1) + Vercel Cron |
| 분석 | Vercel Analytics |

**프로젝트 규칙**
- Prisma 싱글톤 클라이언트(`lib/db.ts`), `connection_limit=1` PgBouncer 대응.
- 모든 비밀키는 환경변수로만. **코드/설정 파일에 평문 시크릿 절대 금지**(마리아 레포의 실수 반복 금지).
- 라우트 그룹으로 영역 분리: `app/(patient)`, `app/(admin)`, `app/api/*`.
- 서브도메인 기반 라우팅 미들웨어(관리자 `admin.*` ↔ 환자 도메인 분리).

---

## 2. 멀티테넌시 (마리아 대비 신규 — 범용성 핵심)

마리아는 단일 병원("일산마리아병원")이 하드코딩되어 있다. 블룸ai는 처음부터 멀티테넌트로 설계한다.

- `Tenant`(병원/그룹)와 `Clinic`(지점) 모델 추가. 모든 핵심 엔터티(Doctor/Patient/Appointment/Schedule…)는 `clinicId`(또는 `tenantId`)를 가진다.
- 지점명·로고·연락처·약관·알림 발신정보·도메인을 **테넌트 설정**으로 관리(하드코딩 금지).
- 모든 쿼리는 테넌트 스코프로 필터링(데이터 격리). 관리자 토큰에 `tenantId`/`clinicId` 포함.
- 알림톡 템플릿 코드, 발신번호, 채널 ID도 테넌트별 설정값으로.

---

## 3. 인증 & 권한 (마리아 기능 그대로)

- **관리자/직원 인증**: 이메일 + 비밀번호(bcrypt, 12 rounds), JWT(`admin_token`, 24h, httpOnly).
- **역할(Role)**: `ADMIN`(슈퍼), `STAFF`(관리자), `DOCTOR`(의사), `VIEWER`(조회 전용).
  - `VIEWER`는 미들웨어에서 GET 외 모든 `/api/admin/*` 쓰기 요청을 403 차단.
  - 권한 헬퍼: `requireAuth`, `requireAdmin`(ADMIN/STAFF), `requireSuperAdmin`(ADMIN), 의사 본인 스코프.
- **환자 인증**: 카카오 OAuth 로그인 → 최초 1회 프로필 완성(이름/생년월일/전화/차트번호) → Firebase 전화번호 인증. JWT(`patient-token`, 7d, httpOnly).
- **도메인 라우팅 미들웨어**: `admin.*` 서브도메인은 관리자 페이지만, 그 외 도메인은 환자 페이지만 접근 허용. 개발환경은 스킵.

---

## 4. 데이터 모델 (마리아 17개 모델 전부 + 난임 확장)

### 4-A. 마리아에서 그대로 가져올 모델
- **Doctor**: 이름, 진료과(department), 직급(position), 소개(bio), 이미지, 활성여부, 정렬순서, **슬롯당 최대 환자 수(maxPatientsPerSlot)**, **예약 안내문구(reservationNotice)**, (선택)로그인 이메일/비밀번호.
- **Patient**: 이름, 생년월일, 전화, 차트번호, 카카오ID/이메일/프로필. (이름+생년월일+전화 인덱스)
- **Appointment**(예약): doctorId, patientId, date(YYYY-MM-DD), time(HH:MM), **status**, 메모, 예약시각.
  - 상태: `PENDING`(대기) → `BOOKED`(확정) → `COMPLETED`(완료) / `CANCELLED`(취소) / `REJECTED`(거절) / `NO_SHOW`(노쇼).
  - **변경 1회 제한**: changeCount, lastChangedAt, originalDate/Time.
  - **취소 출처 구분**: cancelledFrom(PENDING/BOOKED).
  - **EMR 연동**: emrSynced, emrSyncedAt, emrSyncedBy.
  - UUID 기반 외부 확인 링크 지원.
- **ScheduleTemplate**: 의사·요일별 기본 스케줄(시작/종료/슬롯간격分/일일최대), `effectiveFrom`(적용 시작일로 버전 관리), **slotSettings**(JSON: defaultCapacity + 시간대별 customSlots {type, capacity}).
- **ScheduleException**: 특정일/기간 휴진(OFF) 또는 커스텀(CUSTOM, 부분시간 차단).
- **DoctorBlockedTime**: 요일/특정일 단위 예약불가 시간(점심·시술·회의 등).
- **TimeSlotConfig**: 의사·요일·시간별 slotType(AVAILABLE/PROCEDURE/OFF) + 정원.
- **DailySlotSummary**: 매일 자정 향후 4주치 슬롯 사전계산 캐시(totalSlots/available/booked/isOff).
- **ReservationOpenSetting**: 자동 오픈 활성화/요일/시간/유지 주 수.
- **WeeklyReservationOpen**: 주 단위 예약 오픈 관리(weekStart~End, isOpen, MANUAL/AUTO).
- **ReservationNotice**: 예약 페이지 기간한정 공지(content, startDate~endDate, isActive).
- **AdminUser / AdminNotification**: 관리자 계정 + 관리자 인앱 알림(NEW_APPOINTMENT/CANCELLED/STATUS_CHANGED…).
- **PatientNotification**: 환자 인앱 알림(CONFIRMED/CANCELLED/REJECTED + 예약정보).
- **ScheduleChangeRequest**: 의사→관리자 변경요청 승인 흐름(RESCHEDULE/CANCEL/OFF_DAY, PENDING/APPROVED/REJECTED, 처리자/사유).
- **NotificationLog**: 발송 이력(type/channel/수신자/템플릿/내용/status SENT·FAILED).
- **NotificationSetting**: key-value 알림 환경설정.

> 모든 모델에 `clinicId`/`tenantId`를 추가하고 적절한 복합 인덱스를 유지한다(마리아의 인덱스 설계를 참고).

### 4-B. 난임 특화 신규 모델 (블룸ai 추가)
- **Couple/Partner**: 환자-배우자 연결, 배우자 기본정보.
- **TreatmentCycle**(시술 주기): 유형(IVF/IUI/자연주기/배아이식 등), 주기 회차, 시작일, 단계(stimulation/retrieval/transfer/beta 등), 상태, 담당의.
- **ConsultationRecord**(상담/진료 기록): 날짜, 작성자, 내용, 다음 액션, 첨부.
- **TestResult / LabResult**(검사 결과): 항목(호르몬 수치 등), 값, 단위, 날짜.
- **PatientJourney/Timeline**: 환자 여정 타임라인(상담→검사→시술→결과) 이벤트 집계.
- **Tag/Segment**: 환자 분류(난임 원인, 단계, 캠페인 타깃)로 CRM 세그먼트화.

---

## 5. 환자용(Patient) 기능 — 마리아 전부 구현

1. **예약 플로우**(멀티스텝): `mode`(날짜우선/의사우선 선택) → `calendar`(월 캘린더, 날짜별 가능 슬롯 수·공휴일 표시) → `doctor`(의사 선택, 가능 슬롯 수) → `time`(시간 슬롯, 잔여 인원·정원 표시, 예약 안내문구) → `info`(환자정보 입력/확인) → `complete`(완료).
2. **의사 목록**: 진료과·직급·소개, 날짜별 예약 가능 수.
3. **캘린더 컴포넌트**: 미니/월간, 공휴일(`lib/holidays`) 반영, 날짜별 슬롯 카운트 프리패치.
4. **마이페이지**: 내 예약 목록, 프로필 수정, 지난 예약 이력(history).
5. **예약 취소/변경**: 변경 1회 제한, 취소 사유, UUID 링크로 비로그인 확인/취소 가능.
6. **알림**: 알림 벨 + 알림 목록(확정/취소/거절), 실시간 업데이트.
7. **정적/안내 페이지**: 이용안내(guide), 병원정보(info), 공지(notice), 이용약관(terms), 개인정보처리방침(privacy-policy).
8. **클라이언트 캐시**: 의사/슬롯 데이터 TTL 캐시로 빠른 UX(마리아의 globalCache 패턴 참고).

---

## 6. 관리자(Admin) 기능 — 마리아 전부 구현

1. **대시보드**: 통계(전체/대기/확정/완료/취소/거절/노쇼), 기간 필터(일/주/월/커스텀), 오늘 예약, 실시간 갱신, 초기데이터 일괄 로드.
2. **예약 관리**: 목록/검색/필터, **수동 예약 생성**, 승인(approve)/거절(reject), 상태 변경, **EMR 동기화 표시/처리**, 날짜별 카운트.
3. **의사 관리**: CRUD(이름·진료과·직급·소개·이미지·정렬·정원·예약안내문구·로그인정보), 의사별 예약 조회, **차단 시간(blocked-times) 관리**.
4. **스케줄 관리**:
   - **스케줄 매니저**(통합 편집 UI),
   - **스케줄 템플릿**(요일별 기본 + 슬롯별 정원/타입 JSON 편집, effectiveFrom 버전),
   - **스케줄 예외**(휴진/커스텀),
   - **스케줄 설정**(schedule-config).
5. **예약 오픈 관리**: 주 단위 수동 오픈/마감, **자동 오픈 설정**(요일·시간·유지 주 수), 미리보기(preview), 자동체크.
6. **변경 요청 관리**: 의사가 올린 일정변경/취소/휴진 요청 승인·거절(사유 포함).
7. **환자 관리**: 목록/검색, 상세, 수정.
8. **알림 관리**: 알림 설정, 발송 로그, **테스트 발송**(알림톡 디버그 포함).
9. **변경 내역**: 일자별 변경(daily-changes), 오늘 변경(today-changes).
10. **로그**: 운영 로그 조회.
11. **공지 관리**: 예약 페이지 공지 등록/수정(기간·활성).
12. **내 예약(의사용)**: DOCTOR 역할이 본인 예약/스케줄 확인.

---

## 7. 예약/스케줄 엔진 (마리아 핵심 로직 — 반드시 동등 이상)

`lib/reservation/slotCalculator.ts`의 로직을 동등하게 구현:

- 특정 의사·날짜의 **가능 슬롯 계산**: 요일 템플릿(effectiveFrom 최신 우선) → 슬롯 생성(간격) → slotSettings(defaultCapacity+customSlots) 적용 → 예외일(OFF/CUSTOM) 반영 → 차단시간 반영 → 기존 예약수(PENDING/BOOKED) 차감 → **정원(maxPatients) 대비 잔여 계산**.
- **시간 제약**: 과거 날짜/지난 시간 제외, **최소 사전예약 시간**(예: 30분) 적용, **Asia/Seoul 타임존** 정확히 처리.
- **슬롯 타입**: AVAILABLE / PROCEDURE / OFF / LUNCH.
- `isSlotAvailable`(변경 시 자기 자신 제외), `getAvailableDates`(기간 내 가능일).
- **사전계산**: 매일 자정 4주치 `DailySlotSummary` 생성(precompute) → 조회 시 즉시 응답.
- **주간 오픈 게이트**: WeeklyReservationOpen이 닫힌 주는 예약 불가.

---

## 8. 알림 시스템 (마리아 전부)

- **카카오 알림톡(Solapi)** 채널, 유형: `CONFIRM`(확정), `CANCEL`(취소), `REMINDER_1DAY`(전날), `REMINDER_TODAY`(당일), `STATUS_CHANGE`, `RESCHEDULE`(변경), `REJECTED`(거절).
- **SMS 폴백(Aligo)**, 발송 실패 시 대체.
- **배치 발송**(BATCH_SIZE 10, 딜레이로 rate limit 회피, `Promise.allSettled`).
- **모든 발송은 NotificationLog 기록**(status/error/sentAt).
- **인앱 알림**: PatientNotification / AdminNotification 동시 생성.
- 템플릿 코드·발신번호·채널 ID·지점명은 **테넌트 설정값**으로(하드코딩 금지).

---

## 9. 실시간(WebSocket)

- 별도 WS 서버(`realtime/server`, Docker 배포 가능)로 관리자 대시보드·환자 화면 실시간 갱신.
- 이벤트: 신규 예약/상태 변경/취소 → 관리자 즉시 반영, 환자 본인 예약 변경 → 환자 화면 반영.
- 클라이언트: 컨텍스트(`RealtimeContext`, `PatientRealtimeContext`) + 재연결 로직.

---

## 10. Cron 작업 (Vercel Cron)

| 경로 | 주기 | 역할 |
|------|------|------|
| `/api/cron/reminder-1day` | 매시 | 1일 전 리마인더 발송 |
| `/api/cron/reminder-24h-dynamic` | 15분마다 | 동적 24h 리마인더 |
| `/api/cron/precompute-slots` | 매일 자정 | 4주치 슬롯 사전계산 |
| `/api/.../reservation-open/auto-check` | 매분 | 자동 예약 오픈 체크 |

---

## 11. 난임 특화 + AI 기능 (블룸ai 신규)

- **시술 주기 관리**: IVF/IUI 등 주기 생성·단계 추적·결과 기록, 예약과 연동(주기 일정에 맞춘 예약 추천).
- **환자 여정 타임라인**: 상담→검사→시술→결과를 한 화면에.
- **상담/검사 기록**: 진료 노트, 호르몬 수치 추이 그래프.
- **AI 보조**(이름에 맞춤, 단계적 도입):
  - 예약/리마인더 문구 자동 생성,
  - 상담 요약/다음 액션 제안,
  - 노쇼 위험 예측·세그먼트 타깃 알림,
  - 환자 문의 챗봇(FAQ/예약 안내).
  - **AI는 Claude API 사용**(최신 모델 권장). 의료 의사결정은 보조만, 최종 판단은 의료진.

---

## 12. 빌드 순서 (Claude Code 권장 진행)

1. 프로젝트 스캐폴드(Next.js 16 + TS + Tailwind 4 + Prisma) 및 폴더 구조/라우트 그룹.
2. Prisma 스키마(멀티테넌트 + 마리아 17모델 + 난임 확장) 작성 → 마이그레이션.
3. 인증(관리자/환자 JWT, 역할, 미들웨어, 도메인 라우팅).
4. 예약/스케줄 엔진(slotCalculator 동등 구현) + 사전계산.
5. 환자 예약 플로우 → 마이페이지 → 알림.
6. 관리자 대시보드 → 예약/의사/스케줄/예약오픈/환자/알림/공지/로그.
7. 알림(알림톡+SMS) + Cron + 실시간.
8. 난임 도메인(시술주기·상담·검사·여정).
9. AI 보조 기능.
10. 테넌트 설정/온보딩 + 시드 데이터 + 배포(Vercel + WS 서버).

---

## 13. 반드시 지킬 원칙

- 마리아의 **기능은 100% 보존**하되, **하드코딩(병원명·발신번호·템플릿·시크릿)은 전부 설정/환경변수로 일반화**한다.
- 시크릿은 코드/`.mcp.json`/노트에 **절대 평문 저장 금지**(마리아 레포의 노출 사례 반복 금지).
- 모든 쿼리는 **테넌트 스코프 격리**.
- 타임존·공휴일·정원·변경제한·EMR연동 등 **세부 비즈니스 규칙을 빠뜨리지 말 것**.
- 한국어 UX, 모바일 우선, 접근성 고려.

---

### (참고) 기존 마리아 코드에서 확인된 핵심 파일
- 슬롯 엔진: `lib/reservation/slotCalculator.ts`
- 인증: `lib/auth.ts`, `lib/patientAuth.ts`, `middleware.ts`
- 알림: `lib/notification/{solapiAlimtalk,reminderService,kakaoAlimtalk}.ts`, `lib/aligo.ts`
- 상태/유틸: `lib/utils.ts`(상태 라벨/스타일), `lib/dateUtils.ts`, `lib/holidays.ts`, `lib/phoneFormat.ts`, `lib/masking.ts`
- 실시간: `realtime/server.ts`, `lib/ws/*`, `contexts/*Realtime*`
- 사전계산: `lib/slots/precompute.ts`, `lib/cache/slotCache.ts`
- 관리자/환자 페이지: `app/(admin)/admin/*`, `app/(patient)/*`
- API: `app/api/{admin,patient,doctor,auth,cron}/*` (총 74개 route)
