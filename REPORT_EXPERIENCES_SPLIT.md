# REPORT_EXPERIENCES_SPLIT.md

Experiences.tsx 분리 작업 보고서 — 2026-06-27

## 개요

원본 `src/pages/Experiences.tsx` (3112줄)를 7개의 파일로 분리했다.
모든 단계에서 빌드 통과 확인 후 커밋. 동작·인터페이스·localStorage 구조 변경 없음.

---

## 단계별 작업 내역

### 1단계 — presets.ts 분리
- **커밋**: `4205572`
- **옮긴 것**: `ItemType`, `Status`, `FieldType`, `FieldDef`, `Item` 타입, `SHARED_EXP_KEY`, `NARRATIVE_TYPES`, `SPEC_TYPES`, `ALL_TYPES`, `KEYWORD_OPTIONS`, `Preset` 타입, `withTail`, `EXTRA_COMMON`, `PRESETS`, `makeFromPreset`
- **생성 파일**: `src/pages/experiences/presets.ts` (414줄)
- **Experiences.tsx 변화**: 타입·상수 블록 ~414줄 → `export { ... } from './experiences/presets'` 재export로 대체

### 2단계 — mockData.ts 분리
- **커밋**: `71f53ed`
- **옮긴 것**: `INITIAL_EXPERIENCES` 초기 시드 배열 (makeFromPreset 호출 8개)
- **생성 파일**: `src/pages/experiences/mockData.ts` (86줄)
- **Experiences.tsx 변화**: ~84줄 → 재export 1줄

### 3단계 — DetailEditor.tsx 분리
- **커밋**: `25bb553`
- **옮긴 것**: `SentenceCard` 타입, `DetailEditor` 컴포넌트 (~462줄), 그리고 DetailEditor가 의존하는 `FieldRow`, `FieldAdder`, `KeywordEditor`, `TAG_HINTS`, `tagSentence`, `AnnotatedView`, `SentenceCardView`, `CopyGenerator` 를 DetailEditor.tsx에 번들
  - 5·7단계에서 fieldWidgets.tsx, CopyGenerator.tsx로 추가 추출 예정 구조
- **생성 파일**: `src/pages/experiences/DetailEditor.tsx` (1027줄, 이후 단계에서 축소)
- **Experiences.tsx 변화**: ~976줄 → `import { DetailEditor } from './experiences/DetailEditor'` 1줄

### 4단계 — RepExperienceViews.tsx 분리
- **커밋**: `bbe5507`
- **옮긴 것**: `RepExperienceGrid`, `RepExperienceCard`, `RepSection`, `InfoRow` (4개 컴포넌트, 서로 강하게 의존)
- **생성 파일**: `src/pages/experiences/RepExperienceViews.tsx` (271줄)
- **Experiences.tsx 변화**: ~266줄 → import 1줄

### 5단계 — fieldWidgets.tsx 분리 + DetailEditor imports 정리
- **커밋**: `d7dadb1`
- **옮긴 것**: `SentenceCard` 타입 (DetailEditor.tsx → fieldWidgets.tsx로 이동), `FieldRow`, `FieldAdder`, `KeywordEditor`, `TAG_HINTS`, `tagSentence`, `AnnotatedView`, `SentenceCardView`
- **생성 파일**: `src/pages/experiences/fieldWidgets.tsx` (428줄)
- **DetailEditor.tsx 변화**: 해당 컴포넌트들 제거, `import { ..., FieldRow, FieldAdder, ... } from './fieldWidgets'` 추가. 불필요해진 lucide 아이콘 (Plus, MoreHorizontal, EyeOff, Trash2, Pencil, Upload)·UI 컴포넌트 (Input, DropdownMenuSub 계열) import 정리

### 6단계 — tableWidgets.tsx 분리
- **커밋**: `4995861`
- **옮긴 것**: `ResizableHead`, `ColFilterShape` 타입, `HeaderFilter`, `ManageIndicator`
- **생성 파일**: `src/pages/experiences/tableWidgets.tsx` (192줄)
- **Experiences.tsx 변화**: ~176줄 → import 1줄

### 7단계 — CopyGenerator.tsx 분리 + DetailEditor imports 정리
- **커밋**: `988c8cd`
- **옮긴 것**: `CopyGenerator` 컴포넌트를 DetailEditor.tsx에서 CopyGenerator.tsx로 추출
- **생성 파일**: `src/pages/experiences/CopyGenerator.tsx` (110줄)
- **DetailEditor.tsx 변화**: CopyGenerator 제거, `import { CopyGenerator } from './CopyGenerator'` 추가. `Copy` 아이콘 import도 제거 (DetailEditor 본체에서 미사용)

---

## 줄 수 변화

| 파일 | 분리 전 | 분리 후 |
|------|---------|---------|
| `src/pages/Experiences.tsx` | 3112줄 | **1217줄** |
| `experiences/presets.ts` | — | 414줄 |
| `experiences/mockData.ts` | — | 86줄 |
| `experiences/DetailEditor.tsx` | — | 504줄 |
| `experiences/RepExperienceViews.tsx` | — | 271줄 |
| `experiences/fieldWidgets.tsx` | — | 428줄 |
| `experiences/tableWidgets.tsx` | — | 192줄 |
| `experiences/CopyGenerator.tsx` | — | 110줄 |
| **합계** | **3112줄** | **3222줄** (import/export 오버헤드 +110줄) |

메인 파일 3112줄 → **1217줄** (61% 감소).

---

## 되돌린 단계

없음. 7단계 모두 빌드 통과 후 커밋 완료.

---

## 구조 결정 메모 (추후 리팩토링 참고)

- **3단계에서 번들 전략**: DetailEditor가 의존하는 위젯들(FieldRow 등)을 먼저 DetailEditor.tsx에 같이 묶은 뒤, 5·7단계에서 순차적으로 추출. 이렇게 하지 않으면 Experiences.tsx ↔ DetailEditor.tsx 간 순환 참조가 발생한다.
- **5단계에서 SentenceCard 타입 이동**: SentenceCard를 사용하는 SentenceCardView가 fieldWidgets.tsx로 이동했으므로, 타입도 함께 이동. DetailEditor는 `type SentenceCard`를 fieldWidgets에서 re-import한다.
- **FieldAdder의 `unhideField` prop**: 시그니처에만 있고 내부에서 호출되지 않는 dead prop이지만, 진행 규칙("시그니처를 절대 바꾸지 않는다")에 따라 그대로 유지.
- **8단계 (선택)**: 메인 Experiences() 본체 내 다이얼로그 5개 분리는 이번 작업에서 미진행. state 공유(props drilling 증가) 우려로 별도 작업으로 분리 권장.
