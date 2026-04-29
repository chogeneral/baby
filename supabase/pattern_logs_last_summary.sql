-- ============================================================================
-- pattern_logs — 패턴 기록 “요약 바” 한 번에 조회 (마지막 기저귀·수유·잠)
-- ============================================================================
-- 사용: WITH p 안의 이메일·child_index 만 바꾼 뒤 Supabase SQL Editor 에서 실행.
-- * baby01_all_in_one.sql 주석과 동일 규칙 — 네비 “수유” 칩은 pumpFeed|milk 별도 조회.
-- 반환: last_diaper, last_feed_moyu_pump, last_feed_bunyu_milk, last_sleep (각각 json 객체 또는 null)
-- ============================================================================

WITH p AS (
  SELECT 'user@example.com'::text AS user_email,
         0::smallint AS child_index
)
SELECT
  (SELECT row_to_json(t)
   FROM (
     SELECT log_id, category_id, at_ms, diaper_type, memo
     FROM public.pattern_logs r, p
     WHERE r.user_email = p.user_email
       AND r.child_index = p.child_index
       AND r.category_id = 'diaper'
     ORDER BY r.at_ms DESC
     LIMIT 1
   ) t) AS last_diaper,
  (SELECT row_to_json(t)
   FROM (
     SELECT log_id, category_id, at_ms, breast, duration_min, memo
     FROM public.pattern_logs r, p
     WHERE r.user_email = p.user_email
       AND r.child_index = p.child_index
       AND r.category_id IN ('moyu', 'pumpFeed')
     ORDER BY r.at_ms DESC
     LIMIT 1
   ) t) AS last_feed_moyu_pump,
  (SELECT row_to_json(t)
   FROM (
     SELECT log_id, category_id, at_ms, ml_amount, memo
     FROM public.pattern_logs r, p
     WHERE r.user_email = p.user_email
       AND r.child_index = p.child_index
       AND r.category_id IN ('bunyu', 'milk')
     ORDER BY r.at_ms DESC
     LIMIT 1
   ) t) AS last_feed_bunyu_milk,
  (SELECT row_to_json(t)
   FROM (
     SELECT log_id, category_id, at_ms, sleep_type, duration_min, memo
     FROM public.pattern_logs r, p
     WHERE r.user_email = p.user_email
       AND r.child_index = p.child_index
       AND r.category_id = 'sleep'
     ORDER BY r.at_ms DESC
     LIMIT 1
   ) t) AS last_sleep;
