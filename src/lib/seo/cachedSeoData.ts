import { cache } from "react";
import { getPostById } from "@/lib/contentTopicPostStore";
import { getCommunityPostByIdForSeo } from "@/lib/postStore";

/**
 * `generateMetadata` + 레이아웃의 JSON-LD 가 같은 요청에서 두 번 Supabase 를 치지 않게 `react` cache 로 묶는다.
 */
export const getCachedSeoCommunityPost = cache((id: string) =>
  getCommunityPostByIdForSeo(id),
);

export const getCachedSeoContentTopicPost = cache((id: string) => getPostById(id));
