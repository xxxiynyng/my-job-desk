// CSV 내보내기 유틸 (탭1·탭2 공용) — 백엔드 없이 브라우저에서 바로 다운로드.
// Excel 한글 깨짐 방지를 위해 UTF-8 BOM 추가. 값에 , " 개행이 있으면 큰따옴표로 감싼다.

function escapeCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** headers: 컬럼 제목 배열, rows: 각 행의 셀 값 배열 */
export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [headers.map(escapeCell).join(","), ...rows.map((r) => r.map(escapeCell).join(","))];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
