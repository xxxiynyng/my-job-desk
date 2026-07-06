// 기본정보 필드 정의 — 단일 출처(SSOT).
// BasicInfoPanel(뷰·편집)이 이 정의를 사용한다.
// 값 저장 키: specs.info.values.v2 (Record<InfoKey, string>)

export type InfoKey =
  | "name" | "hanjaName" | "engName" | "birth"
  | "email" | "phone" | "address"
  | "school" | "major" | "grade"
  | "military" | "veteran" | "disability" | "national" | "driverLicense"
  | "portfolioUrl" | "github" | "linkedin" | "blog"
  | "enrollYear" | "gradYear" | "gpa" | "majorGpa" | "minor" | "transfer"
  | "dayNight" | "campus"
  | "gender" | "nationality"
  | "hsSchool" | "hsLocation" | "hsEnroll" | "hsGrad" | "hsGradStatus";

export const INFO_FIELDS: { key: InfoKey; label: string }[] = [
  { key: "name",             label: "이름"                },
  { key: "hanjaName",        label: "한자 이름"            },
  { key: "engName",          label: "영문 이름"            },
  { key: "birth",            label: "생년월일"             },
  { key: "email",            label: "이메일"               },
  { key: "phone",            label: "전화번호"             },
  { key: "address",          label: "주소"                 },
  { key: "school",           label: "학교"                 },
  { key: "major",            label: "전공"                 },
  { key: "grade",            label: "학년 / 졸업 여부"      },
  { key: "military",         label: "병역 사항"            },
  { key: "veteran",          label: "보훈 사항"            },
  { key: "disability",       label: "장애 사항"            },
  { key: "national",         label: "국가유공자 관련"       },
  { key: "driverLicense",    label: "운전면허"             },
  { key: "portfolioUrl",     label: "포트폴리오 URL"       },
  { key: "github",           label: "GitHub"               },
  { key: "linkedin",         label: "LinkedIn"             },
  { key: "blog",             label: "블로그/노션"           },
  { key: "enrollYear",       label: "입학 연도"            },
  { key: "gradYear",         label: "졸업(예정) 연도"      },
  { key: "gpa",              label: "전체 학점 (GPA)"       },
  { key: "majorGpa",         label: "전공 학점"             },
  { key: "dayNight",         label: "주간 / 야간"           },
  { key: "campus",           label: "본교 / 분교"           },
  { key: "minor",            label: "부전공"               },
  { key: "transfer",         label: "편입 여부"            },
  { key: "gender",           label: "성별"                 },
  { key: "nationality",      label: "국적"                 },
  { key: "hsSchool",         label: "고등학교"             },
  { key: "hsLocation",       label: "고등학교 소재지"       },
  { key: "hsEnroll",         label: "고등학교 입학년월"     },
  { key: "hsGrad",           label: "고등학교 졸업년월"     },
  { key: "hsGradStatus",     label: "고등학교 졸업여부"     },
];

export const INFO_DEFAULTS: Record<InfoKey, string> = {
  name: "장윤영", hanjaName: "張潤瑛", engName: "Yoon Jang",
  birth: "2001.03.15", email: "yoon.jang@example.com", phone: "010-0000-0000",
  address: "부산광역시 해운대구 센텀로 17", school: "부산대학교", major: "경영학과",
  grade: "4학년 재학", military: "해당 없음", veteran: "해당 없음",
  disability: "해당 없음", national: "해당 없음", driverLicense: "2종 보통",
  portfolioUrl: "", github: "", linkedin: "", blog: "",
  enrollYear: "", gradYear: "", gpa: "", majorGpa: "", minor: "", transfer: "해당 없음",
  dayNight: "주간", campus: "본교",
  gender: "선택 안 함", nationality: "대한민국",
  hsSchool: "", hsLocation: "", hsEnroll: "", hsGrad: "", hsGradStatus: "해당 없음",
};

export const LS_INFO_VALUES = "specs.info.values.v2";
export const LS_INFO_VISIBLE = "specs.info.visibleKeys.v4";

/** 표시 필드 기본 세트 — 사용자가 visibleKeys를 저장하기 전 기본값 */
export const DEFAULT_VISIBLE: InfoKey[] = [
  "name", "engName", "birth", "email", "phone", "address",
  "school", "major", "grade", "military", "driverLicense",
];

/**
 * 코어 필드 — 표시(visible) 여부와 무관하게 완성도 분모에 항상 포함하는 항상 필요한 집합.
 * 완성도 = 채워진 분모 필드 / (코어 ∪ 표시 필드).
 */
export const CORE_KEYS: InfoKey[] = ["name", "email", "phone", "school", "major"];

/** 기본정보 값이 바뀔 때 같은 문서 내 컴포넌트에 즉시 알리는 커스텀 이벤트명 */
export const INFO_VALUES_EVENT = "pickd:infoValues";
