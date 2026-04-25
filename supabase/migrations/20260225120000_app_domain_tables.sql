-- ============================================================================
-- 육아박사(baby01) — Supabase 공용 스키마 (SQL Editor / CLI 에서 1회 실행)
-- ============================================================================
-- 목적: 회원(users.json) · 부모이야기·정보(contentTopicPosts.json) ·
--      댓글(comments.json) · 아이기록(babyRecords.json) 을 DB 로 옮길 때
--      테이블·인덱스·참조를 한 곳에 정의한다.
--
-- [이미 사용 중] 커뮤니티(아기이야기·꼬꼬마) postStore / communityCommentStore:
--   - public.posts   (필드: category, nickname, … — 앱과 컬럼명 맞춤은 아래 별도 마이그레이션)
--   - public.comments
--   → 20260225140000_align_community_posts_comments.sql 를 같이 실행하는 것을 권장(덮어쓰지 않음, ALTER 보완).
-- 커뮤니티 posts/comments 정의·보강은 20260225140000_align_community_posts_comments.sql 을 쓴다.
--
-- [신규] JSON 스토어 대체:
--   - public.app_users
--   - public.content_topic_posts   (topic CHECK·한글: 20260225160000_content_topic_korean.sql)
--   - public.content_topic_comments
--   - public.baby_records
--
-- RLS: 앱이 서비스 롤/anon 으로 열 API 를 쓰는 경우가 많아, 본 마이그레이션은
--      테이블 생성만 수행한다. 운영 시에는 Supabase RLS + 정책을 별도 설계.
-- ============================================================================

-- ---- 회원 (기존 data/users.json → app_users) ----
CREATE TABLE IF NOT EXISTS public.app_users (
  email text PRIMARY KEY,
  nickname text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  child_birth_year integer,
  child_count integer,
  child_birth_years integer[],
  child_birth_dates text[],
  child_names text[],
  primary_child_index integer DEFAULT 0
);

COMMENT ON TABLE public.app_users IS '로컬 users.json 을 옮기는 대상 — 자녀 배열은 PostgreSQL 배열/NULL 허용';

CREATE INDEX IF NOT EXISTS idx_app_users_created ON public.app_users (created_at DESC);

-- ---- 부모이야기·정보 글 (기존 data/contentTopicPosts.json) ----
-- topic CHECK(부모이야기|정보)·구 영문 값 UPDATE 는 20260225160000_content_topic_korean.sql
CREATE TABLE IF NOT EXISTS public.content_topic_posts (
  id text PRIMARY KEY,
  topic text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  author_email text NOT NULL,
  author_nickname text NOT NULL DEFAULT '',
  view_count integer NOT NULL DEFAULT 0,
  -- 글에 설정된 수정/삭제용 비밀번호(없을 수 있음) — TypeScript: password
  password text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.content_topic_posts IS '부모이야기·정보 게시글 — id 는 앱 contentTopicPostStore 의 문자열 id';

CREATE INDEX IF NOT EXISTS idx_content_topic_posts_topic_created
  ON public.content_topic_posts (topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_topic_posts_author
  ON public.content_topic_posts (author_email);

-- ---- 부모이야기·정보 댓글 (기존 data/comments.json, postId = content_topic post id) ----
CREATE TABLE IF NOT EXISTS public.content_topic_comments (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES public.content_topic_posts (id) ON DELETE CASCADE,
  content text NOT NULL,
  author_email text NOT NULL,
  author_nickname text NOT NULL DEFAULT '',
  -- 대댓글: 부모 댓글 id(문자열) — null 이면 최상위
  parent_id text REFERENCES public.content_topic_comments (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.content_topic_comments IS
  '부모이야기·정보 댓글. 커뮤니티 댓글은 public.comments(post_id=정수)에 별도.';

CREATE INDEX IF NOT EXISTS idx_content_topic_comments_post_created
  ON public.content_topic_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_topic_comments_parent
  ON public.content_topic_comments (parent_id)
  WHERE parent_id IS NOT NULL;

-- ---- 아이기록 (기존 data/babyRecords.json) ----
CREATE TABLE IF NOT EXISTS public.baby_records (
  id text PRIMARY KEY,
  author_email text NOT NULL,
  recorded_at timestamptz NOT NULL,
  child_index integer NOT NULL DEFAULT 0,
  weight_kg numeric,
  height_cm numeric,
  head_circumference_cm numeric,
  daily_note text NOT NULL DEFAULT ''
);

COMMENT ON TABLE public.baby_records IS '가정용 성장/일일 기록 — id 는 앱 babyRecordStore 와 동일한 문자열';

CREATE INDEX IF NOT EXISTS idx_baby_records_author_recorded
  ON public.baby_records (author_email, recorded_at DESC);

-- 커뮤니티 posts/comments 는 20260225140000_align_community_posts_comments.sql 에서 정의·보강한다.
