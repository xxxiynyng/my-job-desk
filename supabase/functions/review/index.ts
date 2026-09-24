// 디스코드 슬래시 명령 /검수 → 검수값 저장(R-44, 2026-09-24).
// 배포: supabase functions deploy review --no-verify-jwt  (디스코드는 Supabase JWT를 보내지 않으므로 서명으로 검증한다)
// 비밀값: DISCORD_PUBLIC_KEY(서명 검증). SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동으로 넣어 준다.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseAnswers, type Item } from "./parse.ts";

const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function hex(s: string): Uint8Array { return new Uint8Array(s.match(/.{2}/g)!.map((b) => parseInt(b, 16))); }

async function verified(req: Request, body: string): Promise<boolean> {
  const sig = req.headers.get("x-signature-ed25519"), ts = req.headers.get("x-signature-timestamp");
  if (!sig || !ts) return false;
  const key = await crypto.subtle.importKey("raw", hex(PUBLIC_KEY), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify("Ed25519", key, hex(sig), new TextEncoder().encode(ts + body));
}

const reply = (content: string) =>
  Response.json({ type: 4, data: { content: content.slice(0, 1900), allowed_mentions: { parse: [] } } });

// 18시 디스코드 검수 목록과 같은 순서(posting_uid 오름차순) — 번호가 항상 같은 공고를 가리킨다
async function pendingItems(): Promise<Item[]> {
  const { data, error } = await db.from("v_postings_list")
    .select("posting_uid, employment_types, career_levels, job_categories, locations")
    .eq("needs_review", true).order("posting_uid");
  if (error) throw error;
  const fields = ["employment_types", "career_levels", "job_categories", "locations"];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    posting_uid: r.posting_uid as string,
    empty: fields.filter((f) => !(r[f] as unknown[] | null)?.length),
  }));
}

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await verified(req, body))) return new Response("invalid request signature", { status: 401 });
  const msg = JSON.parse(body);
  if (msg.type === 1) return Response.json({ type: 1 });                  // 디스코드 연결 확인(PING)
  if (msg.type !== 2 || msg.data?.name !== "검수") return reply("알 수 없는 명령이에요.");

  const text: string = msg.data.options?.find((o: { name: string }) => o.name === "답")?.value ?? "";
  const items = await pendingItems();
  if (items.length === 0) return reply("지금 검수 대기 공고가 없어요.");
  const { actions, errors } = parseAnswers(text, items);
  const done: string[] = [];
  for (const a of actions) {
    const { error } = await db.rpc("admin_set_override", {
      p_posting_uid: a.posting_uid, p_field: a.field, p_value: a.value,
      p_note: Array.isArray(a.value) && a.value.length === 0 ? "미분류 확정(디스코드)" : "디스코드 검수",
    });
    if (error) errors.push(`${a.no}번 저장 실패: ${error.message}`);
    else done.push(`✅ ${a.no}번 \`${a.posting_uid}\` ${a.label}`);
  }
  const help = errors.length ? "\n형식 예: `1 정규직, 2 미분류, 3 숨김, 4 경력 신입`" : "";
  return reply([...done, ...errors.map((e) => `⚠️ ${e}`)].join("\n") + help || "저장할 내용이 없어요.");
});
