"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "@/app/login/login.module.css";

type Status = "idle" | "loading" | "sent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FindPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [expiredError, setExpiredError] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "expired") {
      setExpiredError(true);
    }
  }, [searchParams]);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("이메일을 입력해 주세요.");
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("올바른 이메일 형식이 아니에요.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setEmailError(data.message ?? "오류가 발생했습니다. 다시 시도해 주세요.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setEmailError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setStatus("idle");
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>비밀번호 찾기</h1>
          <p className={styles.loginSubtitle}>
            가입하신 이메일로 비밀번호 재설정 링크를 보내드려요.
          </p>
        </div>

        {expiredError && (
          <p className={styles.formError} style={{ textAlign: "center", marginTop: "1rem" }}>
            링크가 만료되었습니다. 다시 요청해 주세요.
          </p>
        )}

        {status === "sent" ? (
          <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
            <p style={{ fontSize: "1rem", color: "var(--colorCharcoal)", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
              비밀번호 재설정 링크를 발송했습니다.<br />
              이메일을 확인하고 링크를 클릭해 주세요.<br />
              <span style={{ fontSize: "0.875rem", color: "var(--colorMuted)" }}>링크는 1시간 후 만료됩니다.</span>
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => { setStatus("idle"); setEmail(""); setEmailError(""); setExpiredError(false); }}
            >
              다시 요청하기
            </button>
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="findPwEmail">
                이메일
              </label>
              <input
                id="findPwEmail"
                name="email"
                type="email"
                autoComplete="email"
                className={`${styles.formInput} ${emailError ? styles.formInputInvalid : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (expiredError) setExpiredError(false);
                }}
                placeholder="you@example.com"
              />
              <p className={styles.formError} role="alert">
                {emailError}
              </p>
            </div>

            <button type="submit" className={styles.submitButton} disabled={status === "loading"}>
              {status === "loading" ? "발송 중…" : "재설정 링크 받기"}
            </button>
          </form>
        )}

        <p className={styles.inlineTextLink}>
          <Link href="/login">로그인</Link>
          <Link href="/find-id">아이디 찾기</Link>
        </p>
      </div>
    </div>
  );
}
