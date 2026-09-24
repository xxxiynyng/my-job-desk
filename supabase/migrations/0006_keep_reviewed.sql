-- 검수 완료 유지(2026-09-24): 사람이 검수한 공고(review_status='reviewed')는 다음 수집에서 needs_review가 다시 켜지지 않는다.
-- 검수 기록(수정·미분류 확정)은 모두 classification_overrides + posting_events('reviewed')에 남는다(한 곳).
create or replace function jobs._keep_reviewed() returns trigger language plpgsql as $$
begin
  if new.review_status = 'reviewed' then
    new.needs_review := false;
  end if;
  return new;
end $$;
drop trigger if exists keep_reviewed on jobs.postings;
create trigger keep_reviewed before update on jobs.postings
  for each row execute function jobs._keep_reviewed();
