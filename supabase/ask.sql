-- 책여기 문장 찾기 (/ask) 의 기록 표와 하루 상한. lib/ask/log.ts 가 쓴다.
-- 대표가 Supabase 대시보드 SQL Editor 에 통째로 한 번 붙여 넣고 Run. 다시 붙여 넣어도 된다 (있으면 건너뛰거나 바꿔 씀).
-- 서버만 secret key (sb_secret_…, 역할 service_role) 로 쓴다. anon·authenticated 는 표도 함수도 못 쓴다:
-- RLS 를 켜고 정책은 하나도 만들지 않는다 + 권한 회수 (https://supabase.com/docs/guides/database/functions "Function privileges").

-- 요청마다 한 행. 칸은 lib/ask/types.ts LogRow 그대로. 문장 원문·이유 글·책 제목·IP·UA 칸은 없다.
create table if not exists public.ask_log (
  id bigint generated always as identity primary key,
  at timestamptz not null, -- 분 단위로 자른 시각
  prompt_version text not null,
  model text not null,
  outcome text not null, -- lib/ask/types.ts Outcome
  fail_step text,
  fail_kind text,
  status int,
  llm1_in int,
  llm1_out int,
  llm1_ms int,
  llm2_in int,
  llm2_out int,
  llm2_ms int,
  d4l_ms int,
  d4l_calls int not null,
  total_ms int not null,
  cost_usd numeric(12, 6) not null,
  input_len int not null,
  masked int not null,
  candidates int not null,
  filtered int not null,
  guard_dropped int not null,
  reasons_cut int not null,
  conditions jsonb,
  picks jsonb not null
);

-- 한국 날짜마다 LLM 을 부르게 허락한 수. 하루 한 행.
create table if not exists public.ask_day (
  day date primary key,
  n int not null
);

-- 오늘 (한국 시간) 수가 cap 미만이면 1 올리고 true, 아니면 false. 한 문장이라 여러 서버가 동시에 불러도 cap 을 넘지 않는다
-- (같은 날 행을 잠그고 올린다). 부르는 곳: POST /rest/v1/rpc/ask_take_slot {"cap": 100}
create or replace function public.ask_take_slot(cap int)
returns boolean
language sql
set search_path = ''
as $$
  with took as (
    insert into public.ask_day as d (day, n)
    select (now() at time zone 'Asia/Seoul')::date, 1
    where cap > 0
    on conflict (day) do update set n = d.n + 1
      where d.n < cap
    returning 1
  )
  select exists (select 1 from took);
$$;

alter table public.ask_log enable row level security;
alter table public.ask_day enable row level security;

revoke all on public.ask_log, public.ask_day from public, anon, authenticated;
revoke all on function public.ask_take_slot(int) from public, anon, authenticated;

-- secret key 가 쓰는 권한은 분명히 준다 (Supabase 기본 권한 설정이 달라도 되게)
grant insert on public.ask_log to service_role;
grant select, insert, update on public.ask_day to service_role;
grant execute on function public.ask_take_slot(int) to service_role;
