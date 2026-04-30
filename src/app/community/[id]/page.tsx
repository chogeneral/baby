import { notFound } from "next/navigation";
import nestForm from "@/app/nestForm.module.css";
import { displayCommunityNickname } from "@/lib/communityBoard";
import {
  communityRoomLabels,
  communityRoomPath,
  effectiveBoardKind,
  isKokkomaBoard,
} from "@/lib/communityRoom";
import { formatDate } from "@/lib/formatDate";
import { looksLikeHtmlPostBody, moveImagesToTopInPostHtml } from "@/lib/postHtmlUtils";
import { sanitizePostHtml } from "@/lib/postHtmlSanitize";
import { getCachedSeoCommunityPost } from "@/lib/seo/cachedSeoData";
import { PostDetailClient } from "./PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getCachedSeoCommunityPost(id);

  if (!post) {
    notFound();
  }

  const postRoom = effectiveBoardKind(post);
  const anonymousMode = isKokkomaBoard(postRoom);
  const listHref = anonymousMode
    ? "/community/kokkoma"
    : (communityRoomPath[postRoom] ?? "/community/baby-story");

  return (
    <main className={nestForm.nestPage}>
      <article className={nestForm.nestArticle}>
        <p className={nestForm.nestTagLg}>
          {communityRoomLabels[postRoom].roomName}
        </p>
        <h1 className={nestForm.nestArticleTitle}>{post.title}</h1>
        {postRoom === "regionNearby" ? (
          <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
            {communityRoomLabels.regionNearby.ageHint}
          </p>
        ) : !anonymousMode ? (
          <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
            우리 아이들의 이야기를 함께 나누고 공유해요
          </p>
        ) : (
          <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
            {communityRoomLabels.kokkoma.subtext}
          </p>
        )}
        <div className={nestForm.nestMeta}>
          {!anonymousMode && (
            <>
              <span>{displayCommunityNickname(post.authorNickname)}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{formatDate(post.createdAt)}</span>
        </div>
        {looksLikeHtmlPostBody(post.content) ? (
          <div
            className={nestForm.nestRichBody}
            dangerouslySetInnerHTML={{
              __html: sanitizePostHtml(moveImagesToTopInPostHtml(post.content)),
            }}
          />
        ) : (
          <p className={nestForm.nestBody}>{post.content}</p>
        )}
      </article>

      <PostDetailClient
        postId={post.id}
        postAuthorEmail={post.authorEmail}
        editPassword={post.editPassword}
        anonymousMode={anonymousMode}
        listHref={listHref}
      />
    </main>
  );
}
