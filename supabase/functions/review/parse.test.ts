// node --experimental-strip-types parse.test.ts
import { parseAnswers } from "./parse.ts";
import assert from "node:assert/strict";
const items = [
  { posting_uid: "line:3051", empty: ["employment_types"] },
  { posting_uid: "line:2424", empty: ["employment_types", "career_levels"] },
  { posting_uid: "toss:1", empty: ["job_categories"] },
];
let r = parseAnswers("1 정규직, 2 미분류, 3 숨김", items);
assert.deepEqual(r.errors, []);
assert.deepEqual(r.actions.map((a) => [a.posting_uid, a.field, a.value]), [
  ["line:3051", "employment_types", ["FULL_TIME"]], ["line:2424", "employment_types", []], ["toss:1", "hidden", true]]);
r = parseAnswers("1번 정규직,계약직\n2번 --- 경력 신입", items);
assert.deepEqual(r.actions.map((a) => a.value), [["FULL_TIME", "CONTRACT"], ["NEW"]]);
assert.equal(r.actions[1].field, "career_levels");
r = parseAnswers("3 기타", items);                       // 기타: 비어 있는 항목(직군)으로
assert.deepEqual([r.actions[0].field, r.actions[0].value], ["job_categories", ["기타"]]);
r = parseAnswers("1 기타", items);                       // 기타: 비어 있는 항목(고용형태)으로
assert.deepEqual([r.actions[0].field, r.actions[0].value], ["employment_types", ["ETC"]]);
r = parseAnswers("2 경력", items);                       // 경력: 값 종류로 경력 항목
assert.equal(r.actions[0].field, "career_levels");
r = parseAnswers("5 정규직, 1 알바, 정규직", items);
assert.equal(r.actions.length, 0);
assert.equal(r.errors.length, 2);   // "정규직"은 앞 조각(1 알바)에 붙어 한 건의 오류
console.log("parse tests ok");
