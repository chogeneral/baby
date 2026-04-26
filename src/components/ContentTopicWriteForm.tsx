"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import {
  canWriteContentTopicPost,
  contentTopicPageInfo,
  type ContentTopicKind,
} from "@/lib/contentTopic";
import { readLoginSession } from "@/lib/loginSession";
import { mergeTrailingSinglePhotoHtml, isMergedPostBodyEmpty } from "@/lib/boardSinglePhotoHtml";

type Props = {
  /** 어떤 콘텐츠 메뉴에 속하는 글인지 — API·저장소 필터와 동일한 키 */
  topic: ContentTopicKind;
};

/**
 * 발달 / 부모이야기 / 정보 공통 글쓰기 폼.
 * 로그인 세션의 이메일로 서버에 저장하고, 등록 후에는 해당 메뉴 목록 페이지로 돌아간다.
 */
export function ContentTopicWriteForm({ topic }: Props) {
  const router = useRouter();
  const info = contentTopicPageInfo[topic];
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const session = readLoginSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    /* 주제별 권한: 부모이야기=로그인 누구나, 정보=관리자만 — 권한 없으면 목록으로 */
    if (!canWriteContentTopicPost(topic, session.email)) {
      router.replace(info.backPath);
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 로그인 세션 이메일로 작성자 식별 */
    setAuthorEmail(session.email);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, info.backPath, topic]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (isMergedPostBodyEmpty(content, attachedPhotos)) {
      setError("내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/content-topic-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: mergeTrailingSinglePhotoHtml(content, attachedPhotos),
          authorEmail,
          topic,
          ...(password.trim() ? { password: password.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "글 작성에 실패했습니다.");
        return;
      }

      router.push(info.backPath);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authorEmail) return null;

  /**
   * 꼬꼬마 글쓰기의 nestNotice 와 같은 위치.
   * 정보: 안내·수정 비밀번호 등 운영 안내를 짧게 유지한다.
   * 키는 `ContentTopicKind`(DB `topic`)와 동일해야 `noticeByTopic[topic]` 조회가 안전하다.
   */
  const noticeByTopic: Record<ContentTopicKind, string> = {
    부모이야기: "완벽하지 않아도 괜찮아요. 우리 모두 처음이니까요. 당신의 솔직한 이야기를 들려주세요.",
    정보:
      "육아와 가족 생활에 도움이 되는 안내·자료·팁을 차분히 모아 두는 공간이에요.",
  };

  const notice = noticeByTopic[topic];

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>{info.title}</h1>

      {notice && (
        <p className={nestForm.nestNoticeSub} style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "#6b6560" }}>
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className={nestForm.nestForm}>
        <div>
          <label htmlFor="contentTopicTitle" className={nestForm.nestLabel}>
            제목
          </label>
          <input
            id="contentTopicTitle"
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        <div>
          <label htmlFor="contentTopicBody" className={nestForm.nestLabel}>
            내용
          </label>
          <BoardRichTextEditor
            id="contentTopicBody"
            value={content}
            onChange={setContent}
            placeholder="내용을 입력해 주세요"
          />
        </div>

        <BoardSinglePhotoSection
          sectionId="contentTopicPhoto"
          value={attachedPhotos}
          onChange={setAttachedPhotos}
        />

        <div>
          <label htmlFor="contentTopicPassword" className={nestForm.nestLabel}>
            비밀번호
          </label>
          <input
            id="contentTopicPassword"
            type="password"
            maxLength={50}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            className={nestForm.nestInput}
          />
        </div>

        {error ? <p className={nestForm.nestError}>{error}</p> : null}

        <div className={nestForm.nestActions}>
          <Link
            href={info.backPath}
            className={`${nestForm.nestBtnSecondary} ${nestForm.flex1}`}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${nestForm.nestBtnPrimary} ${nestForm.flex1}`}
          >
            {isSubmitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </main>
  );
}
