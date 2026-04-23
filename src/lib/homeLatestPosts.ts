import {
  getPostsByTopic,
  type ContentTopicPostRecord,
} from "@/lib/contentTopicPostStore";
import { getPostsByBoardKind } from "@/lib/postStore";

/**
 * 메인 홈 “최신 글” 미리보기 — 제목·날짜·(선택)닉네임. 이메일·비밀번호는 절대 포함하지 않는다.
 */
export type HomeLatestPostPreview = {
  id: string;
  title: string;
  /** `YYYY-MM-DD` — 목록·게시판과 동일하게 앞 10자만 쓴다. */
  dateLabel: string;
  /** 부모이야기·발달에만 — 게시글에 저장된 닉네임(빈 값이면 `—`) */
  authorLabel?: string;
};

const previewLimit = 5;

function toPreview(p: { id: string; title: string; createdAt: string }): HomeLatestPostPreview {
  return {
    id: p.id,
    title: p.title,
    dateLabel: p.createdAt.slice(0, 10),
  };
}

/**
 * 콘텐츠 토픽 글(부모이야기·발달) — 홈에서도 목록/상세와 같이 `authorNickname` 을 짧게 보여 준다.
 */
function toPreviewWithAuthor(p: ContentTopicPostRecord): HomeLatestPostPreview {
  return {
    ...toPreview(p),
    authorLabel: p.authorNickname?.trim() ? p.authorNickname : "—",
  };
}

/**
 * 부모이야기·발달·꼬꼬마·정보 — 각각 최신 5개(콘텐츠 토픽 3종 + 꼬꼬마 커뮤니티 1종).
 * 스토어는 “최신이 앞” 순서(역순 정렬)로 이미 맞춰 두었으므로 `slice` 만 한다.
 */
export function getHomeLatestPostPreviews() {
  return {
    parentStories: getPostsByTopic("parentStories")
      .slice(0, previewLimit)
      .map(toPreviewWithAuthor),
    development: getPostsByTopic("development")
      .slice(0, previewLimit)
      .map(toPreviewWithAuthor),
    kokkoma: getPostsByBoardKind("kokkoma").slice(0, previewLimit).map(toPreview),
    info: getPostsByTopic("info").slice(0, previewLimit).map(toPreview),
  };
}
