// 디스코드 /검수 답장 해석(외부 의존 없음 — Node로도 테스트 가능).
// 입력 예: "1 정규직, 2 미분류, 3 숨김, 4 경력 신입"  → [{no:1, field:"employment_types", value:["FULL_TIME"]}, ...]
export type Item = { posting_uid: string; empty: string[] };           // 검수 목록 한 건과 비어 있는 항목(DB 필드명)
export type Action = { no: number; posting_uid: string; field: string; value: unknown; label: string };
export type ParseResult = { actions: Action[]; errors: string[] };

const EMP: Record<string, string> = { "정규직": "FULL_TIME", "인턴": "INTERN", "계약직": "CONTRACT", "단기계약직": "CONTRACT_SHORT", "기타": "ETC" };
const CAREER: Record<string, string> = { "경력": "EXP", "신입": "NEW", "경력무관": "ANY" };
const JOBS = ["개발", "기획", "디자인", "비즈니스", "마케팅", "경영지원", "기타"];
const FIELD_NAMES: Record<string, string> = { "고용형태": "employment_types", "경력": "career_levels", "직군": "job_categories", "근무지": "locations" };
const FIELD_LABEL: Record<string, string> = { employment_types: "고용형태", career_levels: "경력", job_categories: "직군", locations: "근무지" };
const EMPTY_WORDS = ["미분류", "없음", "모름"];

function mapValues(field: string, words: string[]): unknown[] | null {
  if (field === "employment_types") return words.every((w) => w in EMP) ? words.map((w) => EMP[w]) : null;
  if (field === "career_levels") return words.every((w) => w in CAREER) ? words.map((w) => CAREER[w]) : null;
  if (field === "job_categories") return words.every((w) => JOBS.includes(w)) ? words : null;
  return words;                                                         // 근무지는 적은 그대로
}

function guessField(words: string[], item: Item): string | null {
  // 항목 이름이 없으면: 값 종류로 판단하고, 애매하면(예: "기타") 비어 있는 첫 항목
  const fits = ["employment_types", "career_levels", "job_categories"].filter((f) => mapValues(f, words) !== null);
  if (fits.length === 1) return fits[0];
  const firstEmpty = item.empty[0];
  if (firstEmpty && (fits.includes(firstEmpty) || fits.length === 0 && firstEmpty === "locations")) return firstEmpty;
  return fits.length ? fits[0] : null;
}

export function parseAnswers(text: string, items: Item[]): ParseResult {
  const actions: Action[] = [], errors: string[] = [];
  const chunks = text.split(/[\n,;]|\s{2,}/).map((s) => s.trim()).filter(Boolean);
  // "1 정규직,계약직"처럼 쉼표로 값을 이은 경우를 위해, 번호로 시작하지 않는 조각은 앞 조각에 붙인다
  const merged: string[] = [];
  for (const c of chunks) {
    if (/^\d+\s*(번|\.|\))?/.test(c) || merged.length === 0) merged.push(c);
    else merged[merged.length - 1] += " " + c;
  }
  for (const raw of merged) {
    const m = raw.match(/^(\d+)\s*(?:번|\.|\)|:)?\s*(?:[-—–:]+\s*)?(.*)$/);
    if (!m) { errors.push(`"${raw}": 번호로 시작해 주세요 (예: 1 정규직)`); continue; }
    const no = Number(m[1]);
    const item = items[no - 1];
    if (!item) { errors.push(`${no}번: 검수 목록에 없는 번호예요 (1~${items.length})`); continue; }
    let words = m[2].split(/[\s/·]+/).filter(Boolean);
    if (words.length === 0) { errors.push(`${no}번: 값이 없어요`); continue; }
    if (words[0] === "숨김" || words[0] === "숨기기") { actions.push({ no, posting_uid: item.posting_uid, field: "hidden", value: true, label: "숨김" }); continue; }
    let field: string | null = null;
    if (words[0] in FIELD_NAMES && words.length > 1) { field = FIELD_NAMES[words[0]]; words = words.slice(1); }
    if (words.length === 1 && EMPTY_WORDS.includes(words[0])) {
      field = field ?? item.empty[0] ?? "employment_types";
      actions.push({ no, posting_uid: item.posting_uid, field, value: [], label: `${FIELD_LABEL[field] ?? field} 미분류 확정` });
      continue;
    }
    field = field ?? guessField(words, item);
    const value = field ? mapValues(field, words) : null;
    if (!field || value === null) { errors.push(`${no}번: "${words.join(" ")}"을(를) 알아보지 못했어요`); continue; }
    actions.push({ no, posting_uid: item.posting_uid, field, value, label: `${FIELD_LABEL[field]} ${words.join(", ")}` });
  }
  return { actions, errors };
}
