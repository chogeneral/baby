-- ============================================================================
-- 패턴 기록 — public.pattern_logs (앱 localStorage PatternLogEntry 대응)
-- ============================================================================
-- id: Supabase 행 식별(uuid) / log_id: 앱 문자열 id·UPSERT 키(유일)
-- at_ms: 클라이언트 Date.now() 와 동일(ephemeral 표시용 경과 시간 계산)
-- 요약 바 category_id: diaper | (moyu,pumpFeed) | (bunyu,milk) | sleep
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pattern_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  log_id text NOT NULL,
  category_id text NOT NULL,
  label text NOT NULL,
  at_ms bigint NOT NULL,
  child_index smallint NOT NULL DEFAULT 0 CHECK (child_index >= 0 AND child_index <= 4),
  memo text,
  breast text CHECK (breast IS NULL OR breast IN ('left', 'right', 'both')),
  duration_min numeric,
  ml_amount numeric,
  weaning_type text,
  diaper_type text CHECK (diaper_type IS NULL OR diaper_type IN ('pee', 'poo', 'both')),
  sleep_type text CHECK (sleep_type IS NULL OR sleep_type IN ('night', 'nap')),
  pump_ml_left numeric,
  pump_ml_right numeric,
  hospital_type text CHECK (hospital_type IS NULL OR hospital_type IN ('checkup', 'illness')),
  hospital_name text,
  hospital_doctor text,
  hospital_note text,
  temp_c numeric,
  med_name text,
  snack_name text,
  snack_amount numeric,
  snack_unit text CHECK (snack_unit IS NULL OR snack_unit IN ('ml', 'g')),
  play_name text,
  play_reaction text CHECK (
    play_reaction IS NULL OR play_reaction IN ('like', 'less-interest')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pattern_logs_log_id_key UNIQUE (log_id)
);

COMMENT ON TABLE public.pattern_logs IS
  '패턴 기록 — 앱 patternRecordLogStorage.PatternLogEntry(logId→log_id, atMs→at_ms, 이메일→user_email)';
COMMENT ON COLUMN public.pattern_logs.log_id IS '앱에서 쓰는 문자열 logId — 저장·수정 시 충돌 방지용 유일 키';
COMMENT ON COLUMN public.pattern_logs.category_id IS
  '앱 categoryId 영문 키 — 헤더 칩: diaper|weaning|sleep|moyu|bunyu|pumpFeed|milk 등; 요약 바: diaper / (moyu,pumpFeed) / (bunyu,milk) / sleep';
  ON public.pattern_logs (user_email, child_index, at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_logs_user_child_cat_at
  ON public.pattern_logs (user_email, child_index, category_id, at_ms DESC);

ALTER TABLE public.pattern_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pattern_logs_all_anon" ON public.pattern_logs;
CREATE POLICY "pattern_logs_all_anon"
  ON public.pattern_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
