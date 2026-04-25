"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import nestForm from "@/app/nestForm.module.css";
import { BoardRichTextEditor } from "@/components/BoardRichTextEditor";
import { BoardSinglePhotoSection } from "@/components/BoardSinglePhotoSection";
import {
  contentTopicPageInfo,
  isContentTopicWriteAllowedEmail,
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
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
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
    /* 허용된 관리자 이메일만 글쓰기 페이지에 머무를 수 있게 — 그 외는 목록으로 돌려보냄 */
    if (!isContentTopicWriteAllowedEmail(session.email)) {
      router.replace(info.backPath);
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- 로그인 세션 이메일로 작성자 식별 */
    setAuthorEmail(session.email);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, info.backPath]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (isMergedPostBodyEmpty(content, attachedPhoto)) {
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
          content: mergeTrailingSinglePhotoHtml(content, attachedPhoto),
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
   * 꼬꼬마 글쓰기의 nestNotice 와 같은 위치·역할이다.
   * 메뉴마다 기대하는 톤이 달라 주제별로 한 줄씩만 나눠 두었다(공통 문장을 합치면 안내가 길어진다).
   */
  const noticeByTopic: Record<ContentTopicKind, string> = {
    parentStories:
      "부모로서의 솔직한 이야기를 나누는 공간이에요. 등록한 글은 닉네임과 함께 목록에 표시돼요. 수정 비밀번호를 설정해 두면 나중에 글을 고칠 수 있어요.",
    info:
      "육아·가족에 도움이 되는 안내와 자료를 정리해 두는 공간이에요. 등록한 글은 닉네임과 함께 목록에 표시돼요. 수정 비밀번호를 설정해 두면 나중에 글을 고칠 수 있어요.",
  };

  return (
    <main className={nestForm.nestPage}>
      <h1 className={nestForm.nestTitle}>{info.title}</h1>

      <p className={nestForm.nestLead} style={{ marginBottom: "1.25rem" }}>
        글 등록 안내
      </p>

      <div className={nestForm.nestNotice}>
        <p className={nestForm.nestNoticeSub} style={{ margin: 0 }}>
          {noticeByTopic[topic]}
        </p>
      </div>

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
          value={attachedPhoto}
          onChange={setAttachedPhoto}
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
