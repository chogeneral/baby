-- ============================================================================
-- pattern_logs 가 앱(Next 패턴 기록 API)과 안 맞을 때 보정용 (SQL Editor 에서 1회 실행)
-- ============================================================================
-- 증상: Table Editor 에 행이 안 쌓임 — 흔한 원인:
--   1) 테이블에 child_id 만 있고 child_index 가 없음(앱은 child_index 만 insert)
--   2) RLS 켜졌는데 정책이 없어 anon 차단
-- ============================================================================

-- 앱·patternLogStore 가 쓰는 컬럼: child_index (0~4). 없으면 추가한다.
-- (기존 테이블에 child_id 만 있는 경우 insert 가 실패하거나 조용히 누락될 수 있음)
ALTER TABLE public.pattern_logs
  ADD COLUMN IF NOT EXISTS child_index smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.pattern_logs.child_index IS '앱 PatternLogEntry.childIndex — 아이 탭 인덱스(0~4)';

-- RLS 가 있고 정책이 없으면 insert 가 전부 막힌다. 개발·현재 앱(anon) 기준 전개 정책.
ALTER TABLE public.pattern_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pattern_logs_all_anon" ON public.pattern_logs;
CREATE POLICY "pattern_logs_all_anon"
  ON public.pattern_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 인덱스(없을 때만)
CREATE INDEX IF NOT EXISTS idx_pattern_logs_user_child_at
  ON public.pattern_logs (user_email, child_index, at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_logs_user_child_cat_at
  ON public.pattern_logs (user_email, child_index, category_id, at_ms DESC);
