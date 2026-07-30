// ─────────────────────────────────────────────────────────────
// Pickd 공고 시드 데이터 (신 스키마 v4)
// 위치 제안: src/data/postings.seed.ts
//
// ① 탭1 검색·등록·상세의 데이터 소스 (백엔드 도입 전: 정적 시드 → 이후 JSON fetch)
// ② 백엔드 API 응답 계약(contract): GET /postings 의 응답 형태가 이 타입과 동일해야 함
// ③ 실공고 원문 검증 2건 수록 — 한국가스안전공사(무필기·공무직 트랙), KOMSA(필기·정규직 트랙)
//    두 건이 스키마의 양극단을 커버하므로 UI 전 케이스 테스트 픽스처로 사용 가능
// ─────────────────────────────────────────────────────────────

import { calcDday } from "@/lib/dday";
// ── 타입 (탭1_기획개발 문서 2부·4부 스키마와 1:1) ──────────────

export type StageType =
  | "ANNOUNCE" | "APPLY" | "DOC_SCREENING" | "DOC_RESULT"
  | "WRITTEN_EXAM" | "WRITTEN_RESULT" | "PERSONALITY_TEST"
  | "EVIDENCE_SUBMIT" | "INTERVIEW" | "FINAL_RESULT" | "JOIN"
  | "PHYSICAL_TEST" | "PRACTICAL_TEST" | "APTITUDE_TEST" | "ETC";

/** NCS 직업기초능력 10개 영역 — 자소서 문항 평가항목 표준 어휘 */
export type NcsCompetency =
  | "의사소통" | "수리" | "문제해결" | "자기개발" | "자원관리"
  | "대인관계" | "정보" | "기술" | "조직이해" | "직업윤리";

/**
 * 공고 직무 분류 (필터 축) — 공공기관 실제 직렬 기준 18종.
 * 그룹: 관리·사무 / 기술 / 전문 / 현장. 잡알리오 NCS 대분류를 취준생이 쓰는
 * 직렬 어휘로 재매핑한 것이라 NCS 24 대분류와 1:1이 아니다.
 */
export type JobCategory =
  // 관리·사무
  | "사무·행정" | "경영·기획" | "회계·재무" | "인사·법무" | "홍보·대외"
  // 기술
  | "전산·IT" | "전기·통신" | "기계·설비" | "토목·건축" | "화공·환경"
  // 전문
  | "안전관리" | "검사·품질" | "보건·의료" | "연구·조사" | "교육·상담"
  // 현장
  | "운전·운송" | "시설·미화" | "기타";

export type OrgCategory = "공기업" | "준정부기관" | "기타공공기관" | "지방공기업" | "지방출자출연" | "기타";
export type ScreeningMethod = "적격심사" | "정량평가" | "정성평가" | "혼합";

export interface ScheduleEvent {
  stageType: StageType;
  /** 원문 표기 그대로 — 화면 노출은 항상 label 사용 */
  label: string;
  startDate: string;           // YYYY-MM-DD
  endDate: string;
  startTime?: string;          // HH:mm — 마감 시각이 있으면 반드시 기록
  endTime?: string;
  /** false = 공고문에 "추후 공지" — 화면에 '미정' 표기 + 확정 시 알림 대상 */
  confirmed: boolean;
  sortOrder: number;
}

export interface Position {
  id: string;
  jobGroup?: string;           // 직렬 (행정직 / 공무직 …)
  jobTitle: string;            // 채용분야 (일반행정 / 시설관리(전기) …)
  grade?: string;              // 6급 등
  employmentType: string;      // 정규직 / 공무직(무기전환) / 청년인턴(기간제)
  recruitType: "신입" | "경력" | "신입+경력";
  headcount: number;
  workLocation: string[];
  jobCategory: JobCategory;
  qualification: string;       // 응시자격 요약 (원문 축약)
  ageLimit?: string;
  screeningMethod: ScreeningMethod;      // v4 신규 — 서류전형 방식
  residencyRequirement?: string;         // v4 신규 — 거주요건 (없으면 undefined)
  writtenExam: boolean;
  writtenExamNote?: string;              // v4 신규 — 필기 과목 구성
  conversionNote?: string;               // v4 신규 — 인턴·수습·전환 정보
  duties?: string;                       // 담당업무 요약 (공고문 모집표 기준)
  competencies?: string[];               // 요구 역량 (직무기술서 필요지식·기술 요약)
  essayWeightNote?: string;              // 자소서 배점 비중
  salaryNote?: string;
}

export interface EssayQuestion {
  docType: "자기소개서" | "경력기술서";
  questionNo: number;
  questionText: string;
  charLimit: number;
  /** null = 전 직무 공통 / 배열 = 해당 positionId만 */
  targetPositionIds: string[] | null;
  evalCriteria?: NcsCompetency;          // v4: 직업기초능력 enum으로 표준화
}

export interface Preference {
  category: string;
  bonusRate: string;
  appliedStages: ("서류" | "필기" | "면접")[];
  duplicable: boolean;
  /** v4 보강 — 지역인재 항목만: 대상 지역 + 적용 방식 */
  region?: string;
  regionScheme?: "30%목표제" | "비수도권35%" | "광역자체목표" | "별도전형";
  note?: string;
}

export interface Attachment {
  docType: "공고문" | "입사지원서" | "직무기술서" | "기타";
  fileName: string;
  fileFormat: "pdf" | "hwp" | "zip" | "etc";
  url: string;
}

export interface Posting {
  id: string;
  slug: string;                          // 라우팅 키: /jobs/:slug
  orgName: string;
  orgCategory: OrgCategory;            // 조직 형태 (공기업/준정부기관/…)
  /** 기관이 무슨 일을 하는가 — 조직 형태(orgCategory)와 다른 축이다.
   *  잡알리오가 주지 않으므로 검수자가 기관 성격을 보고 넣는다. */
  industry: string;
  title: string;
  announceNo?: string;
  applyStart: string;                    // ISO datetime — 시각 포함
  applyEnd: string;
  applyUrl: string;
  sourceUrl: string;                     // 잡알리오 등 원문
  sourceType: "jobalio" | "busan_unified" | "gyeongnam_unified" | "user_pdf" | "manual";
  regions: string[];
  blindHiring: boolean;
  /** 통합채용 회차 — 같은 recruitRound 공고끼리는 1인 1기관 1분야 (등록 시 경고) */
  recruitRound?: string;
  reviewedAt: string;                    // 검수 기준일 — 상세 화면에 노출
  positions: Position[];
  scheduleEvents: ScheduleEvent[];
  essayQuestions: EssayQuestion[];       // 빈 배열 = 문항 미확보(정상 케이스)
  /** 문항 출처: 공고문에 없고 접수 사이트에만 있는 경우를 구분 */
  essaySource: "announcement_pdf" | "apply_site" | "not_found";
  preferences: Preference[];
  attachments: Attachment[];
}

// ── 시드 1: 한국가스안전공사 — 무필기·공무직/인턴·문항 有 트랙 ──
// 근거: 2026 하반기 공고문 원문 16p 전수 분석 (2026-07-26)

export const POSTINGS: Posting[] = [
  {
    id: "kgs-2026-h2",
    slug: "kgs-2026-h2-gongmujik",
    orgName: "한국가스안전공사",
    orgCategory: "준정부기관",
    industry: "에너지·안전",
    title: "2026년 하반기 공무직 및 청년인턴 채용",
    applyStart: "2026-07-30T14:00:00+09:00",
    applyEnd: "2026-08-07T12:00:00+09:00",
    applyUrl: "https://kgs1.saramin.co.kr",
    sourceUrl: "https://job.alio.go.kr/recruit.do", // 실제 공고 상세 URL로 교체
    sourceType: "jobalio",
    regions: ["충북", "충남", "경기", "경북", "강원"],
    blindHiring: true,
    reviewedAt: "2026-07-26",
    positions: [
      {
        id: "kgs-p1", jobGroup: "공무직", jobTitle: "시설관리(기계)",
        duties: "청사·기숙사 기계설비(냉난방·공조·보일러) 작동점검, 유지보수, 자재 재고관리",
        competencies: ["기계설비(FCU·EHP·공조기) 운영·점검 능력", "냉난방 배관·펌프 유지보수 기술", "기계 관련 기능사 이상 자격 우대"], employmentType: "공무직(수습 3개월 후 무기계약 전환)",
        recruitType: "신입+경력", headcount: 2, workLocation: ["가스안전교육원(충남 천안)", "수소제품시험평가센터(충북 음성)"],
        jobCategory: "기계·설비", qualification: "학력·연령 제한 없음(만 60세 미만), 교대·주간 근로형태 동의자",
        screeningMethod: "혼합", writtenExam: false,
        conversionNote: "수습 3개월 → 근무성적 평정 60점 이상 시 공무직(무기계약직) 전환",
        essayWeightNote: "서류 100점 중 자소서(정성) 40점", salaryNote: "월 약 225~243만원(수습)",
      },
      {
        id: "kgs-p2", jobGroup: "공무직", jobTitle: "시설관리(전기)",
        duties: "청사 전기/통신설비 유지보수 및 안전관리 — 수변전·발전기·태양광 시스템 운영, UPS·누설전류 점검",
        competencies: ["수변전·발전설비 기술 지식", "전기설비 도면 해석·배선작업 기술", "전기 관련 기능사 이상 자격 우대"], employmentType: "공무직(수습 3개월 후 무기계약 전환)",
        recruitType: "신입+경력", headcount: 2, workLocation: ["산업가스안전기술센터(충북 진천)", "가스안전교육원(충남 천안)"],
        jobCategory: "전기·통신", qualification: "학력·연령 제한 없음(만 60세 미만), 3교대 가능자",
        screeningMethod: "혼합", writtenExam: false,
        conversionNote: "수습 3개월 → 평정 60점 이상 시 무기계약 전환",
        essayWeightNote: "자소서(정성) 40점 + 자격 정량 60점", salaryNote: "월 약 243~310만원",
      },
      {
        id: "kgs-p3", jobGroup: "공무직", jobTitle: "미화",
        duties: "청사·교육원·생활관 전 구역 환경미화, 폐기물 처리·분리수거, 위험요소 사전진단",
        competencies: ["청소 장비·약품 운용 능력", "산업안전보건법에 따른 약품 관리 이해"], employmentType: "공무직(수습 3개월 후 무기계약 전환)",
        recruitType: "신입+경력", headcount: 4, workLocation: ["본사(충북 음성)", "가스안전교육원(충남 천안)"],
        jobCategory: "시설·미화", qualification: "학력 제한 없음, 만 65세 미만(고령자 친화 직종)",
        screeningMethod: "혼합", writtenExam: false,
        conversionNote: "수습 3개월 → 무기계약 전환", essayWeightNote: "자소서(정성) 80점 — 자소서 비중 최상",
        salaryNote: "월 약 225만원(수습)",
      },
      {
        id: "kgs-p4", jobGroup: "공무직", jobTitle: "운전(대형운전)",
        duties: "교육생 수송 버스 운행, 운행 전후 차량 점검, 운행일지 등 차량관리 행정",
        competencies: ["1종 대형면허·버스운전자격증", "안전운전·비상상황 대처 능력", "최근 5년 무사고 우대"], employmentType: "공무직(수습 3개월 후 무기계약 전환)",
        recruitType: "신입+경력", headcount: 1, workLocation: ["가스안전교육원(충남 천안)"],
        jobCategory: "운전·운송", qualification: "45인승 대형버스 운행 가능자(1종 대형면허)",
        screeningMethod: "혼합", writtenExam: false,
        conversionNote: "수습 3개월 → 무기계약 전환", essayWeightNote: "자소서+경력기술서(정성) 60점",
      },
      {
        id: "kgs-p5", jobGroup: "청년인턴", jobTitle: "LPG용기 사용가구 시설개선 점검/검수",
        duties: "LPG용기 사용가구 시설개선사업 현장 검수 지원, 수혜자 데이터 관리·전산 입력, 행정 사무보조",
        competencies: ["가스 법령(액화석유가스법·KGS Code) 기초 이해", "체크리스트 기반 현장 검수·기록 능력", "엑셀·한글 등 문서작성 활용 능력"], employmentType: "청년인턴(체험형·기간제 3개월)",
        recruitType: "신입", headcount: 7, workLocation: ["경기 수원·광주", "충남 천안", "경북 포항", "강원 강릉"],
        jobCategory: "안전관리", qualification: "만 15~34세(입사예정일 기준), 공사 체험형 인턴 무경험자",
        ageLimit: "만 15~34세", screeningMethod: "혼합", writtenExam: false,
        conversionNote: "2026.10.1~12.31 근무, 계약연장·정규 전환 없음", salaryNote: "월 약 198만원",
      },
    ],
    scheduleEvents: [
      { stageType: "ANNOUNCE", label: "공고기간", startDate: "2026-07-23", endDate: "2026-08-07", confirmed: true, sortOrder: 1 },
      { stageType: "APPLY", label: "지원서 접수", startDate: "2026-07-30", endDate: "2026-08-07", startTime: "14:00", endTime: "12:00", confirmed: true, sortOrder: 2 },
      { stageType: "DOC_SCREENING", label: "1차전형(서류평가)", startDate: "2026-08-10", endDate: "2026-08-24", confirmed: true, sortOrder: 3 },
      { stageType: "DOC_RESULT", label: "1차전형 합격 발표", startDate: "2026-08-25", endDate: "2026-08-25", confirmed: true, sortOrder: 4 },
      { stageType: "PERSONALITY_TEST", label: "온라인 인성검사(공무직만)", startDate: "2026-08-28", endDate: "2026-08-31", confirmed: true, sortOrder: 5 },
      { stageType: "EVIDENCE_SUBMIT", label: "증빙서류 제출", startDate: "2026-08-28", endDate: "2026-08-31", confirmed: true, sortOrder: 6 },
      { stageType: "INTERVIEW", label: "최종전형(면접평가)", startDate: "2026-09-07", endDate: "2026-09-08", confirmed: true, sortOrder: 7 },
      { stageType: "FINAL_RESULT", label: "최종 합격자 발표", startDate: "2026-09-18", endDate: "2026-09-18", confirmed: true, sortOrder: 8 },
      { stageType: "JOIN", label: "입사", startDate: "2026-10-01", endDate: "2026-10-01", confirmed: true, sortOrder: 9 },
    ],
    essayQuestions: [
      { docType: "자기소개서", questionNo: 1, charLimit: 500, targetPositionIds: null, evalCriteria: "직업윤리",
        questionText: "지원 직무와 관련하여 법정 기준 또는 내부규정 준수를 위해 위험요인을 발견하고 조치한 경험을 구체적으로 설명해 주십시오." },
      { docType: "자기소개서", questionNo: 2, charLimit: 500, targetPositionIds: null, evalCriteria: "문제해결",
        questionText: "예기치 못한 문제, 사고 등이 발생했던 경험을 바탕으로 당시 상황을 어떻게 파악·분석하고 어떤 조치를 했는지 구체적으로 설명해 주십시오." },
      { docType: "자기소개서", questionNo: 3, charLimit: 500, targetPositionIds: null, evalCriteria: "의사소통",
        questionText: "동료·협력사·외부고객 등과 협업 및 의사소통을 통해 성과를 이룬 경험을 구체적으로 설명해 주십시오." },
      { docType: "자기소개서", questionNo: 4, charLimit: 500, targetPositionIds: null, evalCriteria: "자기개발",
        questionText: "스스로 목표를 설정하고 이를 달성하기 위해 계획을 수립, 실행했던 경험을 구체적으로 기술해 주십시오." },
      { docType: "경력기술서", questionNo: 1, charLimit: 1000, targetPositionIds: ["kgs-p4"],
        questionText: "시간 역순으로 주요성과·담당업무·보유스킬을 포함하여 경력기술서를 작성해 주십시오." },
    ],
    essaySource: "announcement_pdf",
    preferences: [
      { category: "취업지원대상자(국가보훈)", bonusRate: "5~10%", appliedStages: ["서류", "면접"], duplicable: false },
      { category: "장애인", bonusRate: "10%", appliedStages: ["서류", "면접"], duplicable: false },
      { category: "저소득층", bonusRate: "5%", appliedStages: ["서류"], duplicable: false },
      { category: "한부모가정", bonusRate: "5%", appliedStages: ["서류"], duplicable: false },
      { category: "북한이탈주민", bonusRate: "5%", appliedStages: ["서류"], duplicable: false },
      { category: "다문화가족", bonusRate: "5%", appliedStages: ["서류"], duplicable: false },
      { category: "자립준비청년", bonusRate: "5%", appliedStages: ["서류"], duplicable: false },
    ],
    attachments: [
      { docType: "공고문", fileName: "[공고문] 2026년 하반기 공무직 및 청년인턴.pdf", fileFormat: "pdf", url: "/postings/kgs-2026-h2-notice.pdf" },
      { docType: "입사지원서", fileName: "[입사지원서] 2026년 하반기 공무직 및 청년인턴.pdf", fileFormat: "pdf", url: "#" },
      { docType: "직무기술서", fileName: "[직무기술서] 2026년 하반기 공무직 및 청년인턴.zip", fileFormat: "zip", url: "#" },
    ],
  },

  // ── 시드 2: KOMSA — 필기·정규직·직렬 2계층·문항 미확보 트랙 ──
  // 근거: 2026 제3차 정규직 공고문 원문 20p 분석 (2026-07-26)
  {
    id: "komsa-2026-3",
    slug: "komsa-2026-3rd-regular",
    orgName: "한국해양교통안전공단",
    orgCategory: "준정부기관",
    industry: "해양·교통",
    title: "2026년도 제3차 신규직원(정규직) 채용",
    announceNo: "공고 2026-83호",
    applyStart: "2026-07-22T00:00:00+09:00",
    applyEnd: "2026-08-07T15:00:00+09:00",   // ★ 15:00 마감 — datetime 필수 근거
    applyUrl: "https://komsa.ncsplus.co.kr",
    sourceUrl: "https://job.alio.go.kr/recruit.do",
    sourceType: "jobalio",
    regions: ["세종", "부산", "울산", "경남", "경북", "서울", "인천", "강원", "충남", "전북", "제주"],
    blindHiring: true,
    reviewedAt: "2026-07-26",
    positions: [
      { id: "komsa-p1", jobGroup: "행정직", jobTitle: "일반행정", grade: "6급", employmentType: "정규직",
        recruitType: "신입", headcount: 2, workLocation: ["본사(세종)"], jobCategory: "사무·행정",
        qualification: "제한 없음", screeningMethod: "정성평가",
        writtenExam: true, writtenExamNote: "NCS 직업공통능력 40% + 직무수행능력 60% (+인성검사 적/부)",
        conversionNote: "수습 후 정규 임용", salaryNote: "연봉 41,783~45,506천원" },
      { id: "komsa-p2", jobGroup: "행정직", jobTitle: "안전관리", grade: "6급", employmentType: "정규직",
        recruitType: "신입", headcount: 1, workLocation: ["본사(세종)"], jobCategory: "안전관리",
        qualification: "제한 없음", screeningMethod: "정성평가",
        writtenExam: true, writtenExamNote: "NCS 40% + 직무수행 60%" },
      { id: "komsa-p3", jobGroup: "행정직", jobTitle: "전산", grade: "6급", employmentType: "정규직",
        recruitType: "신입", headcount: 1, workLocation: ["본사(세종)"], jobCategory: "전산·IT",
        qualification: "제한 없음", screeningMethod: "정성평가",
        writtenExam: true, writtenExamNote: "NCS 40% + 직무수행 60%" },
      { id: "komsa-p4", jobGroup: "검사직", jobTitle: "선체검사원", grade: "6급", employmentType: "정규직",
        recruitType: "신입+경력", headcount: 7, workLocation: ["본사·지사"], jobCategory: "검사·품질",
        qualification: "해양계·수산계·조선 관련 학과 졸업 후 관련 분야 2년+ 경력, 또는 3급 항해사 이상+3년, 조선기술사 등 (택1)",
        screeningMethod: "적격심사", writtenExam: true, writtenExamNote: "NCS 30% + 직무수행 70% — 자격 충족 시 전원 필기 응시" },
      { id: "komsa-p5", jobGroup: "검사직", jobTitle: "기관검사원", grade: "6급", employmentType: "정규직",
        recruitType: "신입+경력", headcount: 5, workLocation: ["본사·지사"], jobCategory: "검사·품질",
        qualification: "기관·기계 관련 학과+경력 2년, 3급 기관사+3년, 기계기술사 등 (택1)",
        screeningMethod: "적격심사", writtenExam: true, writtenExamNote: "NCS 30% + 직무수행 70%" },
      { id: "komsa-p6", jobGroup: "운항관리직", jobTitle: "운항관리자", grade: "6급", employmentType: "정규직",
        recruitType: "신입+경력", headcount: 6, workLocation: ["본사·지사", "운항관리센터"], jobCategory: "운전·운송",
        qualification: "3급 이상 해기사(항해사·기관사·운항사) 취득 후 승선경력 3년 이상",
        screeningMethod: "적격심사", writtenExam: true, writtenExamNote: "NCS 30% + 직무수행 70%",
        conversionNote: "업무특성상 지역 순환근무(섬 근무 포함)·교대근무 가능" },
      { id: "komsa-p7", jobGroup: "연구조사직", jobTitle: "해사정책·연구", grade: "6급", employmentType: "정규직",
        recruitType: "신입+경력", headcount: 3, workLocation: ["본사(세종)"], jobCategory: "연구·조사",
        qualification: "관련분야(해양·수산·조선·선박·교통·경영·정책) 석사 이상, 또는 학사+관련 경력 2년",
        screeningMethod: "정성평가", writtenExam: true, writtenExamNote: "NCS 30% + 직무수행 70%" },
      { id: "komsa-p8", jobGroup: "연구조사직", jobTitle: "기상예보", grade: "6급", employmentType: "정규직",
        recruitType: "신입+경력", headcount: 1, workLocation: ["본사(세종)"], jobCategory: "연구·조사",
        qualification: "기상 관련 석사+기상예보사 면허, 또는 학사+기상예보업무 2년+면허",
        screeningMethod: "정성평가", writtenExam: true, writtenExamNote: "NCS 30% + 직무수행 70%" },
    ],
    scheduleEvents: [
      { stageType: "ANNOUNCE", label: "채용공고", startDate: "2026-07-22", endDate: "2026-08-07", endTime: "15:00", confirmed: true, sortOrder: 1 },
      { stageType: "APPLY", label: "지원서 접수", startDate: "2026-07-22", endDate: "2026-08-07", endTime: "15:00", confirmed: true, sortOrder: 2 },
      { stageType: "DOC_RESULT", label: "서류심사 합격자 발표", startDate: "2026-08-26", endDate: "2026-08-26", confirmed: true, sortOrder: 3 },
      { stageType: "WRITTEN_EXAM", label: "필기시험", startDate: "2026-09-05", endDate: "2026-09-05", confirmed: true, sortOrder: 4 },
      { stageType: "WRITTEN_RESULT", label: "필기시험 합격자 발표", startDate: "2026-09-09", endDate: "2026-09-09", confirmed: true, sortOrder: 5 },
      { stageType: "INTERVIEW", label: "면접시험", startDate: "2026-09-14", endDate: "2026-09-18", confirmed: true, sortOrder: 6 },
      { stageType: "FINAL_RESULT", label: "최종합격자 발표", startDate: "2026-10-01", endDate: "2026-10-01", confirmed: true, sortOrder: 7 },
      { stageType: "JOIN", label: "임용(예정)", startDate: "2026-10-15", endDate: "2026-10-15", confirmed: true, sortOrder: 8 },
    ],
    // ★ 문항 미확보가 "정상 케이스"인 실례 — 입사지원서가 온라인 접수 사이트에만 존재
    essayQuestions: [],
    essaySource: "apply_site",
    preferences: [
      { category: "취업지원대상자", bonusRate: "5~10%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "장애인", bonusRate: "10%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "이전지역인재", bonusRate: "3%", appliedStages: ["서류"], duplicable: false,
        region: "세종·대전·충북·충남", regionScheme: "30%목표제",
        note: "혁신도시법 제29조의2 — 대학원 제외 최종학력 기준 해당 지역 소재 학교 졸업(예정)자" },
      { category: "고졸자", bonusRate: "5%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "저소득층", bonusRate: "3%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "북한이탈주민", bonusRate: "3%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "다문화가족", bonusRate: "3%", appliedStages: ["서류", "필기", "면접"], duplicable: false },
      { category: "자립준비청년", bonusRate: "3%", appliedStages: ["서류"], duplicable: false },
      { category: "공단근무경력", bonusRate: "5%", appliedStages: ["서류"], duplicable: true },
      { category: "한국사능력검정시험(1·2급)", bonusRate: "2~3%", appliedStages: ["서류"], duplicable: true },
    ],
    attachments: [
      { docType: "공고문", fileName: "채용공고문(26년 제3차 정규직).pdf", fileFormat: "pdf", url: "/postings/komsa-2026-3rd-notice.pdf" },
      { docType: "직무기술서", fileName: "직무기술서.zip", fileFormat: "zip", url: "#" },
      { docType: "기타", fileName: "장애유형별 편의지원 내용 및 신청서.hwp", fileFormat: "hwp", url: "#" },
    ],
  },
// ── 시드 3: 근로복지공단 울산병원 — 수시·경력·무필기·일정 일부 미정 트랙 ──
  // 근거: 잡알리오 상세 페이지 원문 확인 (2026-07-26). 서류·면접·발표 날짜는 공고 미명시("합격자 개별 통보") → confirmed:false
  {
    id: "kcomwel-ulsan-2026",
    slug: "kcomwel-ulsan-2026-pharmacist",
    orgName: "근로복지공단",
    orgCategory: "준정부기관",
    industry: "보건·의료",
    title: "[울산병원] 의료직 2, 3급(약사) 채용 공고",
    applyStart: "2026-07-24T00:00:00+09:00",
    applyEnd: "2026-08-03T00:00:00+09:00",
    applyUrl: "https://www.comwel.or.kr/recruit/hp/main.do",
    sourceUrl: "https://job.alio.go.kr/recruit.do",
    sourceType: "jobalio",
    regions: ["울산"],
    blindHiring: true,
    reviewedAt: "2026-07-26",
    positions: [
      {
        id: "kcomwel-p1",
        jobGroup: "의료직",
        jobTitle: "약무직(약사) 2·3급",
        employmentType: "정규직",
        recruitType: "경력",
        headcount: 3,
        workLocation: ["근로복지공단 울산병원(울산)"],
        jobCategory: "보건·의료",
        qualification:
          "2급: 약사 면허 취득 후 7년 이상 해당 업무 경력 / 3급: 약사 면허 취득 후 3년 이상 해당 업무 경력 (마감일 기준)",
        screeningMethod: "적격심사",
        writtenExam: false,
        duties: "울산병원 약제 업무 (조제·복약지도·의약품 관리)",
        conversionNote: "임용일 기준 60세 미만(정년), 채용 즉시 근무 가능자",
      },
    ],
    scheduleEvents: [
      { stageType: "ANNOUNCE", label: "공고기간", startDate: "2026-07-24", endDate: "2026-08-03", confirmed: true, sortOrder: 1 },
      { stageType: "APPLY", label: "지원서 접수", startDate: "2026-07-24", endDate: "2026-08-03", confirmed: true, sortOrder: 2 },
      { stageType: "DOC_SCREENING", label: "1차 서류전형(자격기준 해당자 전원 합격)", startDate: "2026-08-04", endDate: "2026-08-04", confirmed: false, sortOrder: 3 },
      { stageType: "INTERVIEW", label: "2차 면접전형(개별 면접)", startDate: "2026-08-10", endDate: "2026-08-10", confirmed: false, sortOrder: 4 },
      { stageType: "FINAL_RESULT", label: "최종 합격자 발표", startDate: "2026-08-14", endDate: "2026-08-14", confirmed: false, sortOrder: 5 },
    ],
    essayQuestions: [],
    essaySource: "apply_site",
    preferences: [
      { category: "취업지원대상자(국가보훈)", bonusRate: "가점(선발예정 4명 이상 시)", appliedStages: ["서류", "면접"], duplicable: false,
        note: "4명 미만 모집단위는 동점자 발생 시 우선순위 부여" },
    ],
    attachments: [
      { docType: "공고문", fileName: "260724 [울산병원] 의료직(약사) 채용 공고문.pdf", fileFormat: "pdf", url: "#" },
      { docType: "입사지원서", fileName: "260724 [울산병원] 의료직(약사) 입사지원서.hwp", fileFormat: "hwp", url: "#" },
      { docType: "직무기술서", fileName: "260724 [울산병원] 의료직(약사) 직무기술서.pdf", fileFormat: "pdf", url: "#" },
    ],
  },
];

// ── 검색·조회 셀렉터 (QuickJobRegistration 자동완성이 사용) ──────

export function searchPostings(q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return { orgs: [], postings: [], positions: [] };
  const orgs = [...new Set(POSTINGS.filter(p => p.orgName.toLowerCase().includes(t)).map(p => p.orgName))];
  const postings = POSTINGS.filter(p => p.title.toLowerCase().includes(t));
  const positions = POSTINGS.flatMap(p =>
    p.positions.filter(pos => pos.jobTitle.toLowerCase().includes(t)).map(pos => ({ posting: p, position: pos })),
  );
  return { orgs, postings, positions };
}

/** 고용형태 4종 — 표·검색 필터가 함께 쓰는 정본.
 *  인턴은 기간제라 채용구분(신입/경력)보다 먼저 본다. "전체"는 신입·경력을 함께 뽑는 모집이다. */
export type EmployType = "인턴" | "신입" | "경력" | "전체";
export const EMPLOY_TYPES: EmployType[] = ["인턴", "신입", "경력", "전체"];
export function employTypeOf(pos: Position): EmployType {
  if (pos.employmentType.includes("인턴")) return "인턴";
  if (pos.recruitType === "신입+경력") return "전체";
  return pos.recruitType;
}

export const getPostingBySlug = (slug: string) => POSTINGS.find(p => p.slug === slug);
export const getPostingById = (id: string) => POSTINGS.find(p => p.id === id);

/** 마감 D-day — lib/dday.calcDday 위임(2026-07-29 통합).
 *  applyEnd는 시드 전 건이 풀 ISO(+09:00)라 두 구현의 계산 결과 동일(자정 절사 후 일수차).
 *  차이는 빈 문자열 가드(calcDday는 0 반환)뿐 — 시드에 빈 값 없음. */
export function calcPostingDday(applyEnd: string): number {
  return calcDday(applyEnd);
}
