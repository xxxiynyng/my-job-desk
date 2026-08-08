// ─────────────────────────────────────────────────────────────
// 컬럼 너비 자동 맞춤 (탭1·탭2 공용)
//
// 컬럼 경계의 세로선을 더블클릭하면 그 컬럼을 "내용에 딱 맞는 너비"로 맞춘다.
// 드래그로 늘렸다 줄였다 하다 보면 컬럼마다 너비가 제각각이 되어, 어떤 칸은
// 글자가 잘리고("프론트…") 어떤 칸은 오른쪽이 텅 빈다. 그걸 한 번에 정리하는 장치다.
//
// 측정 방식 — 화면에 렌더된 셀을 그대로 복제해서 잰다.
//   글자만 재면 배지·칩·아이콘이 든 칸(현재 상태·D-day·일정)이 틀린다. 그래서
//   헤더 셀과 지금 보이는 행의 셀을 통째로 복제해, 너비 제약이 없는 임시 표에 넣고
//   브라우저가 계산한 폭을 읽는다. 패딩·아이콘·자간이 전부 반영된 값이 나온다.
//   복제본은 화면 밖에 잠깐 붙었다 바로 지워지므로 깜빡임이 없다.
//
// 잘린 글자 처리 — 원본 셀에는 truncate(넘치면 …)가 걸려 있어 그대로 재면 잘린 폭이
//   나온다. 복제본에서만 그 제약을 풀어 "잘리지 않았을 때의 폭"을 얻는다.
//
// 범위 — 지금 화면에 렌더된 행만 본다. 접혀 있는 행까지 재면 사용자가 보지도 않는
//   한 줄 때문에 컬럼이 과하게 넓어진다. "보이는 것에 맞춘다"가 기대와 맞다.
// ─────────────────────────────────────────────────────────────

/** 잰 값에 더할 여유 — 서브픽셀 반올림으로 마지막 글자가 잘리는 것을 막는다 */
const SAFETY_PX = 2;

/** 복제본에서 풀어야 하는 잘림 제약 (truncate = overflow-hidden + ellipsis + nowrap) */
const CLIP_SELECTOR = ".truncate, .overflow-hidden, .text-ellipsis";

function releaseClipping(el: HTMLElement) {
  el.style.overflow = "visible";
  el.style.textOverflow = "clip";
  el.style.maxWidth = "none";
  el.style.width = "auto";
}

/**
 * 컬럼 하나가 "내용에 맞으려면" 몇 px이어야 하는지 잰다.
 * @param wrap 테이블 래퍼 — 폰트·CSS 변수를 그대로 물려받으려고 여기 붙여서 잰다
 * @param colKey 헤더 셀의 data-col 값
 * @returns 필요한 px. 해당 컬럼을 못 찾으면 null
 */
export function measureColumnFitWidth(wrap: HTMLElement | null, colKey: string): number | null {
  if (!wrap) return null;
  const th = wrap.querySelector<HTMLElement>(`thead th[data-col="${CSS.escape(colKey)}"]`);
  if (!th) return null;

  // 헤더에서 몇 번째 칸인지 — 본문에서 같은 자리의 td를 찾는 기준
  const headRow = th.parentElement as HTMLTableRowElement | null;
  if (!headRow) return null;
  const index = Array.prototype.indexOf.call(headRow.cells, th);
  if (index < 0) return null;

  const cells: HTMLElement[] = [th];
  wrap.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row) => {
    // 빈 상태 안내처럼 colSpan으로 한 칸만 쓰는 행은 건너뛴다
    if (row.cells.length !== headRow.cells.length) return;
    const cell = row.cells[index];
    if (cell instanceof HTMLElement) cells.push(cell);
  });

  // 너비 제약이 없는 임시 표 — table-layout:auto 라 각 칸이 내용만큼 벌어진다
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;width:max-content;z-index:-1;";
  const table = document.createElement("table");
  table.style.cssText = "table-layout:auto;width:max-content;border-collapse:collapse;";
  const tbody = document.createElement("tbody");

  for (const cell of cells) {
    const tr = document.createElement("tr");
    const clone = cell.cloneNode(true) as HTMLElement;
    clone.style.width = "auto";
    clone.style.maxWidth = "none";
    clone.style.minWidth = "0";
    clone.style.position = "static"; // sticky 고정 컬럼의 좌표가 측정에 끼어들지 않게
    if (clone.matches(CLIP_SELECTOR)) releaseClipping(clone);
    clone.querySelectorAll<HTMLElement>(CLIP_SELECTOR).forEach(releaseClipping);
    tr.appendChild(clone);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  host.appendChild(table);
  wrap.appendChild(host);
  let widest = 0;
  for (const row of Array.from(tbody.rows)) {
    const cell = row.cells[0];
    if (cell instanceof HTMLElement) widest = Math.max(widest, cell.getBoundingClientRect().width);
  }
  wrap.removeChild(host);

  return widest > 0 ? Math.ceil(widest) + SAFETY_PX : null;
}
