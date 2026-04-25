-- content_topic_posts.topic 을 한글(부모이야기, 정보)로 통일한다.
-- CHECK 가 영문만 허용하는 상태에서는 UPDATE 가 한글로 바꿀 수 없다.
-- ➜ 제약을 먼저 제거한 뒤 치환하고, 다시 한글 CHECK 를 건다(데이터 없으면 0행 갱신만 됨).

ALTER TABLE public.content_topic_posts
  DROP CONSTRAINT IF EXISTS content_topic_posts_topic_check;

UPDATE public.content_topic_posts
SET topic = '부모이야기'
WHERE topic = 'parentStories';

UPDATE public.content_topic_posts
SET topic = '정보'
WHERE topic = 'info';

ALTER TABLE public.content_topic_posts
  ADD CONSTRAINT content_topic_posts_topic_check
  CHECK (topic = ANY (ARRAY['부모이야기'::text, '정보'::text]));

COMMENT ON CONSTRAINT content_topic_posts_topic_check ON public.content_topic_posts IS
  '부모이야기·정보 메뉴 구분 — 앱 ContentTopicKind 와 동일한 한글 리터럴';
