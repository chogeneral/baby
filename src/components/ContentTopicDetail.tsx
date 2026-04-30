import { notFound } from "next/navigation";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { contentTopicPageInfo } from "@/lib/contentTopic";
import styles from "@/app/contentPage.module.css";
import nestForm from "@/app/nestForm.module.css";
import { looksLikeHtmlPostBody, moveImagesToTopInPostHtml } from "@/lib/postHtmlUtils";
import { sanitizePostHtml } from "@/lib/postHtmlSanitize";
import { getCachedSeoContentTopicPost } from "@/lib/seo/cachedSeoData";
import { ContentTopicDetailClient } from "@/components/ContentTopicDetailClient";

type Props = { id: string; topic: ContentTopicKind };

export async function ContentTopicDetail({ id, topic }: Props) {
  const post = await getCachedSeoContentTopicPost(id);

  if (!post) {
    notFound();
  }

  const info = contentTopicPageInfo[topic];
  const showAuthorInMeta = topic === "부모이야기";
  const authorLabel = post.authorNickname?.trim() ? post.authorNickname : "—";

  return (
    <main className={styles.contentPage}>
      {info.detailTagLabel ? (
        <p className={nestForm.nestTagLg}>{info.detailTagLabel}</p>
      ) : null}
      <h1 className={styles.contentTitle}>{post.title}</h1>
      {topic === "부모이야기" || topic === "정보" ? (
        <p className={nestForm.nestLead} style={{ marginBottom: "0.75rem" }}>
          {info.subtext}
        </p>
      ) : null}

      <div className={styles.detailMeta}>
        {showAuthorInMeta ? (
          <>
            <span>글쓴이 {authorLabel}</span>
            <span aria-hidden>·</span>
          </>
        ) : null}
        <span>{post.createdAt.slice(0, 10)}</span>
        <span aria-hidden>·</span>
        <span>조회 {post.viewCount ?? 0}</span>
      </div>

      <div className={styles.detailContent}>
        {looksLikeHtmlPostBody(post.content) ? (
          <div
            className={nestForm.nestRichBody}
            dangerouslySetInnerHTML={{
              __html: sanitizePostHtml(moveImagesToTopInPostHtml(post.content)),
            }}
          />
        ) : (
          post.content.split("\n").map((line, i) => (
            <p key={i}>{line || " "}</p>
          ))
        )}
      </div>

      <ContentTopicDetailClient
        postId={post.id}
        topic={topic}
        postAuthorEmail={post.authorEmail}
        password={post.password}
        showAuthorInMeta={showAuthorInMeta}
      />
    </main>
  );
}
