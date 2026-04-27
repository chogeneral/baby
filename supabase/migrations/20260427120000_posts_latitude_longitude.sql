-- 지역 페이지 1km 반경 게시판: 글 작성 시점의 위·경도 저장(목록은 독자 위치 기준 1km 필터)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.posts.latitude IS '지역1km 게시글일 때 작성 위치 위도';
COMMENT ON COLUMN public.posts.longitude IS '지역1km 게시글일 때 작성 위치 경도';

CREATE INDEX IF NOT EXISTS idx_posts_category_region
  ON public.posts (category, created_at DESC)
  WHERE category = '지역1km';
