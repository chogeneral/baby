"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/app/login/login.module.css";

type FieldErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token") ?? "";
    if (!t) {
      setFieldErrors({ general: "올바르지 않은 접근입니다. 비밀번호 찾기를 다시 시도해 주세요." });
    }
    setToken(t);
  }, [searchParams]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!password) {
      next.password = "새 비밀번호를 입력해 주세요.";
    } else if (password.length < 8) {
      next.password = "비밀번호는 8자 이상으로 입력해 주세요.";
    }
    if (!confirm) {
      next.confirm = "비밀번호 확인을 입력해 주세요.";
    } else if (password !== confirm) {
      next.confirm = "비밀번호가 일치하지 않습니다.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/find-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setFieldErrors({ general: data.message ?? "오류가 발생했습니다. 다시 시도해 주세요." });
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setFieldErrors({ general: "네트워크 오류가 발생했습니다. 다시 시도해 주세요." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>새 비밀번호 설정</h1>
          <p className={styles.loginSubtitle}>
            사용할 새 비밀번호를 입력해 주세요.
          </p>
        </div>

        {done ? (
          <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
            <p style={{ fontSize: "1rem", color: "var(--colorCharcoal)", lineHeight: 1.6, margin: "0 0 0.5rem" }}>
              비밀번호가 변경되었습니다.
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--colorMuted)", margin: 0 }}>
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
            {fieldErrors.general && (
              <p className={styles.formError} style={{ textAlign: "center" }} role="alert">
                {fieldErrors.general}
              </p>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="newPassword">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                className={`${styles.formInput} ${fieldErrors.password ? styles.formInputInvalid : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="8자 이상"
              />
              <p className={styles.formError} role="alert">
                {fieldErrors.password ?? ""}
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="confirmPassword">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirm"
                type="password"
                autoComplete="new-password"
                className={`${styles.formInput} ${fieldErrors.confirm ? styles.formInputInvalid : ""}`}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: undefined }));
                }}
                placeholder="비밀번호를 다시 입력해 주세요"
              />
              <p className={styles.formError} role="alert">
                {fieldErrors.confirm ?? ""}
              </p>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        )}

        <p className={styles.inlineTextLink}>
          <Link href="/login">로그인</Link>
          <Link href="/find-password">비밀번호 찾기</Link>
        </p>
      </div>
    </div>
  );
}
