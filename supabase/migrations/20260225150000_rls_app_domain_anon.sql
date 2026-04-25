-- ============================================================================
-- app_users, content_topic_*, baby_records RLS(anon) — API anon 키로 읽기/쓰기 허용
-- 운영 전 반드시 정책을 좁힌다.
-- ============================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topic_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topic_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_users_all_anon" ON public.app_users;
CREATE POLICY "app_users_all_anon" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "content_topic_posts_all_anon" ON public.content_topic_posts;
CREATE POLICY "content_topic_posts_all_anon" ON public.content_topic_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "content_topic_comments_all_anon" ON public.content_topic_comments;
CREATE POLICY "content_topic_comments_all_anon" ON public.content_topic_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "baby_records_all_anon" ON public.baby_records;
CREATE POLICY "baby_records_all_anon" ON public.baby_records FOR ALL USING (true) WITH CHECK (true);
