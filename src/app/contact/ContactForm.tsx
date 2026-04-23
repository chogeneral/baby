"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/login/login.module.css";

type FieldErrors = {
  email?: string;
  title?: string;
  content?: string;
};

function checkTitle(value: string): string | undefined {
  if (!value.trim()) return "제목을 입력해 주세요.";
  if (value.trim().length < 2) return "제목은 2자 이상 입력해 주세요.";
  return undefined;
}

function checkEmail(value: string): string | undefined {
  if (!value.trim()) return "이메일을 입력해 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "올바른 이메일 형식이 아니에요.";
  return undefined;
}

function checkContent(value: string): string | undefined {
  if (!value.trim()) return "내용을 입력해 주세요.";
  if (value.trim().length < 10) return "내용은 10자 이상 입력해 주세요.";
  return undefined;
}

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {
      title: checkTitle(title),
      email: checkEmail(email),
      content: checkContent(content),
    };
    setFieldErrors(next);
    return !next.title && !next.email && !next.content;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, email, content }),
      });

      if (!res.ok) {
        let message = "전송에 실패했습니다. 다시 시도해 주세요.";
        try {
          const data = await res.json() as { message?: string };
          message = data.message ?? message;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        setFieldErrors({ content: message });
        return;
      }

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <h1 className={styles.loginTitle}>문의 완료</h1>
            <p className={styles.loginSubtitle}>
              문의해 주셔서 감사합니다.
              <br />
              빠른 시일 내에 답변 드릴게요.
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} ${styles.signupCard}`}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>문의하기</h1>
          <p className={styles.loginSubtitle}>
            홈페이지 운영에 필요한 것이 있거나 궁금한 점이 있으시면 문의해주세요.
          </p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="contactTitle">
              제목
            </label>
            <input
              id="contactTitle"
              name="title"
              type="text"
              className={`${styles.formInput} ${fieldErrors.title ? styles.formInputInvalid : ""}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: checkTitle(e.target.value) }));
              }}
              onBlur={(e) => setFieldErrors((p) => ({ ...p, title: checkTitle(e.target.value) }))}
              placeholder="문의 제목을 입력해 주세요"
              maxLength={100}
            />
            <p className={styles.formError} role="alert">
              {fieldErrors.title ?? ""}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="contactEmail">
              이메일
            </label>
            <input
              id="contactEmail"
              name="email"
              type="email"
              autoComplete="email"
              className={`${styles.formInput} ${fieldErrors.email ? styles.formInputInvalid : ""}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: checkEmail(e.target.value) }));
              }}
              onBlur={(e) => setFieldErrors((p) => ({ ...p, email: checkEmail(e.target.value) }))}
              placeholder="답변받으실 이메일 주소"
            />
            <p className={styles.formError} role="alert">
              {fieldErrors.email ?? ""}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="contactContent">
              내용
            </label>
            <textarea
              id="contactContent"
              name="content"
              rows={7}
              className={`${styles.formInput} ${fieldErrors.content ? styles.formInputInvalid : ""}`}
              style={{ resize: "vertical", minHeight: "10rem" }}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (fieldErrors.content) setFieldErrors((p) => ({ ...p, content: checkContent(e.target.value) }));
              }}
              onBlur={(e) => setFieldErrors((p) => ({ ...p, content: checkContent(e.target.value) }))}
              placeholder="문의 내용을 입력해 주세요 (10자 이상)"
              maxLength={2000}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p className={styles.formError} role="alert">
                {fieldErrors.content ?? ""}
              </p>
              <p className={styles.formHint}>{content.length} / 2000</p>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "제출 중…" : "문의 제출"}
          </button>
        </form>
      </div>
    </div>
  );
}
