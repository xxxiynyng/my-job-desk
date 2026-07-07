// 경험·스펙 내보내기 생성기 (2026-07-07)
// 형식: Excel(.xlsx, SheetJS) · Word(.docx, docx) · PDF(브라우저 인쇄→PDF 저장, 한글 폰트 임베딩 불필요)
// 입력은 이미 문자열화된 headers/rows — Item 타입에 의존하지 않아 재사용 가능.

import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } from "docx";

export type ExportFormat = "excel" | "word" | "pdf";

// 내보내기 가능한 필드 카탈로그 (항목명은 항상 포함 — required)
export type ExportFieldKey = "type" | "name" | "org" | "period" | "keywords" | "importance" | "updated" | "detail";

export const EXPORT_FIELDS: { key: ExportFieldKey; label: string; required?: boolean }[] = [
  { key: "type", label: "유형" },
  { key: "name", label: "항목명", required: true },
  { key: "org", label: "기관/소속" },
  { key: "period", label: "기간" },
  { key: "keywords", label: "주요 키워드" },
  { key: "importance", label: "중요도" },
  { key: "updated", label: "최근 수정" },
  { key: "detail", label: "상세 내용" },
];

export type ExportTable = { headers: string[]; rows: string[][] };

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Excel ──────────────────────────────────────────────
export function exportExcel(filename: string, { headers, rows }: ExportTable) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // 열 너비 대략치(글자 수 기반)
  ws["!cols"] = headers.map((h, c) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => (r[c] ?? "").length));
    return { wch: Math.min(60, Math.max(10, maxLen + 2)) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "경험");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── Word ───────────────────────────────────────────────
export async function exportWord(filename: string, { headers, rows }: ExportTable) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { fill: "F1F5F9" },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
        }),
    ),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (cell) =>
            new TableCell({
              children: (cell || "").split("\n").map(
                (line) => new Paragraph({ children: [new TextRun({ text: line, size: 20 })] }),
              ),
            }),
        ),
      }),
  );
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: "경험·스펙", bold: true, size: 28 })],
          }),
          new Paragraph({ children: [new TextRun({ text: `${rows.length}개 항목`, size: 18, color: "888888" })] }),
          new Paragraph({ children: [] }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, `${filename}.docx`);
}

// ── PDF (브라우저 인쇄 → PDF로 저장) ──────────────────────
export function exportPdf(filename: string, { headers, rows }: ExportTable) {
  const esc = (s: string) =>
    (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const thead = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
  const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(filename)}</title>
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #1a1a1a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #888; margin: 0 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #d0d0d0; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  tr { break-inside: avoid; }
</style></head><body>
  <h1>경험·스펙</h1><p class="sub">${rows.length}개 항목</p>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("popup-blocked");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function runExport(format: ExportFormat, filename: string, table: ExportTable): Promise<void> | void {
  if (format === "excel") return exportExcel(filename, table);
  if (format === "word") return exportWord(filename, table);
  return exportPdf(filename, table);
}
