"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveLoginSession } from "@/lib/loginSession";
import styles from "./login.module.css";

type FieldErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 로그인은 이메일·비밀번호만 검증한다.
   * 닉네임·휴대폰·출생연도는 회원가입·마이페이지에서 다루고, 세션에는 이메일만 넣는다.
   */
  function validate(): boolean {
    const next: FieldErrors = {};

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      next.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.email = "올바른 이메일 형식이 아니에요.";
    }

    if (!password) {
      next.password = "비밀번호를 입력해 주세요.";
    } else if (password.length < 8) {
      next.password = "비밀번호는 8자 이상으로 입력해 주세요.";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setFieldErrors({ password: data.message ?? "로그인에 실패했습니다." });
        return;
      }

      const data = await res.json() as {
        email: string;
        nickname?: string;
        childCount?: number;
        childBirthYears?: number[];
      };
      saveLoginSession({
        email: data.email,
        nickname: data.nickname,
        childCount: data.childCount,
        childBirthYears: data.childBirthYears,
      });
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>로그인</h1>
          <p className={styles.loginSubtitle}>육아도사와 함께 아이 성장을 기록해 보세요.</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="loginEmail">
              이메일
            </label>
            <input
              id="loginEmail"
              name="email"
              type="email"
              autoComplete="email"
              className={`${styles.formInput} ${fieldErrors.email ? styles.formInputInvalid : ""}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@example.com"
            />
            <p className={styles.formError} role="alert">
              {fieldErrors.email ?? ""}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="loginPassword">
              비밀번호
            </label>
            <input
              id="loginPassword"
              name="password"
              type="password"
              autoComplete="current-password"
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

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "확인 중…" : "로그인"}
          </button>
        </form>

        <p className={styles.inlineTextLink}>
          아직 계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>

        <Link className={styles.homeLink} href="/">
          ← 홈으로
        </Link>
      </div>
    </div>
  );
}
