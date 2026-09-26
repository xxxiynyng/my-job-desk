-- 정시 실행(2026-09-26): GitHub 예약은 공용 대기열이라 4~5시간씩 밀렸다(9/24·25). Supabase pg_cron이
-- 매일 09:00 UTC(= 18:00 KST)에 GitHub Actions 'daily-collect'를 workflow_dispatch로 직접 실행한다.
-- 비밀값은 Vault에만: github_dispatch_token(Actions 쓰기 권한만 있는 토큰), discord_alert_webhook(#수집-경고).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function jobs.dispatch_daily() returns bigint
language plpgsql security definer set search_path = jobs, extensions, pg_catalog as $$
declare v_token text := (select decrypted_secret from vault.decrypted_secrets where name = 'github_dispatch_token');
begin
  if v_token is null then raise exception 'github_dispatch_token 이 Vault에 없음'; end if;
  return net.http_post(
    url := 'https://api.github.com/repos/xxxiynyng/pickd-collector/actions/workflows/daily.yml/dispatches',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Accept', 'application/vnd.github+json',
                                  'X-GitHub-Api-Version', '2022-11-28', 'User-Agent', 'pickd-scheduler',
                                  'Content-Type', 'application/json'),
    body := '{"ref":"main"}'::jsonb);
end $$;

-- 감시: 18:40 KST까지 오늘 수집 실행이 DB에 하나도 없으면 #수집-경고로 알린다(토큰 만료·GitHub 장애 대비)
create or replace function jobs.check_daily_ran() returns void
language plpgsql security definer set search_path = jobs, extensions, pg_catalog as $$
declare v_hook text := (select decrypted_secret from vault.decrypted_secrets where name = 'discord_alert_webhook');
begin
  if exists (select 1 from jobs.runs where started_at >= date_trunc('day', now()) + interval '9 hours') then return; end if;
  if v_hook is null then return; end if;
  perform net.http_post(url := v_hook, headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('content', '🚨 Pickd 수집이 18:40까지 시작되지 않았어요. GitHub Actions(daily-collect)와 Supabase 예약(cron.job_run_details)을 확인해 주세요.'));
end $$;

revoke all on function jobs.dispatch_daily(), jobs.check_daily_ran() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname in ('pickd-daily-collect', 'pickd-daily-check');
select cron.schedule('pickd-daily-collect', '0 9 * * *', 'select jobs.dispatch_daily()');   -- 18:00 KST
select cron.schedule('pickd-daily-check', '40 9 * * *', 'select jobs.check_daily_ran()');   -- 18:40 KST
