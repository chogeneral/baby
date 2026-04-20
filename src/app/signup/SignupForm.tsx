"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatKoreanPhoneInput,
  isValidKoreanMobile,
  onlyDigits,
} from "@/lib/formatKoreanPhone";
import { saveLoginSession } from "@/lib/loginSession";
import styles from "../login/login.module.css";

type FieldErrors = {
  email?: string;
  nickname?: string;
  phone?: string;
  password?: string;
  childCount?: string;
  childBirthYears?: string[];
};

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [childCount, setChildCount] = useState("");
  const [childBirthYears, setChildBirthYears] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  /** 서버(400 등) 오류는 특정 필드 문제가 아닐 수 있어 이메일 칸에만 넣지 않는다 */
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChildCountChange(value: string) {
    setChildCount(value);
    if (fieldErrors.childCount) setFieldErrors((p) => ({ ...p, childCount: undefined }));
    const count = Number.parseInt(value, 10);
    if (!Number.isNaN(count) && count > 0) {
      setChildBirthYears((prev) => {
        const next = [...prev];
        next.length = count;
        for (let i = 0; i < count; i++) {
          if (next[i] === undefined) next[i] = "";
        }
        return next;
      });
    } else {
      setChildBirthYears([]);
    }
  }

  function handleChildBirthYearChange(index: number, value: string) {
    setChildBirthYears((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (fieldErrors.childBirthYears?.[index]) {
      setFieldErrors((p) => {
        const years = [...(p.childBirthYears ?? [])];
        years[index] = undefined as unknown as string;
        return { ...p, childBirthYears: years };
      });
    }
  }

  /**
   * 회원가입 검증: 로그인 폼과 동일한 규칙을 맞춰 두면 나중에 API 스키마를 하나로 묶기 쉽다.
   */
  function validate(): boolean {
    const next: FieldErrors = {};

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      next.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.email = "올바른 이메일 형식이 아니에요.";
    }

    const nicknameTrimmed = nickname.trim();
    if (!nicknameTrimmed) {
      next.nickname = "닉네임을 입력해 주세요.";
    } else if (nicknameTrimmed.length < 2) {
      next.nickname = "닉네임은 2자 이상 입력해 주세요.";
    } else if (nicknameTrimmed.length > 20) {
      next.nickname = "닉네임은 20자 이하로 입력해 주세요.";
    }

    const phoneDigits = onlyDigits(phone);
    if (!phoneDigits) {
      next.phone = "휴대폰 번호를 입력해 주세요.";
    } else if (!isValidKoreanMobile(phoneDigits)) {
      next.phone = "휴대폰 번호 형식을 확인해 주세요. (예: 01012345678)";
    }

    if (!password) {
      next.password = "비밀번호를 입력해 주세요.";
    } else if (password.length < 8) {
      next.password = "비밀번호는 8자 이상으로 설정해 주세요.";
    }

    const countNum = Number.parseInt(childCount, 10);
    if (!childCount) {
      next.childCount = "자녀 수를 선택해 주세요.";
    } else if (Number.isNaN(countNum) || countNum < 1 || countNum > 5) {
      next.childCount = "자녀 수는 1명~5명 사이로 선택해 주세요.";
    }

    if (!next.childCount && countNum > 0) {
      const currentYear = new Date().getFullYear();
      const yearErrors: string[] = new Array(countNum).fill("");
      let hasYearError = false;
      for (let i = 0; i < countNum; i++) {
        const y = childBirthYears[i] ?? "";
        const yearNum = Number.parseInt(y, 10);
        if (!y.trim()) {
          yearErrors[i] = `${i + 1}번째 아이의 출생 연도를 선택해 주세요.`;
          hasYearError = true;
        } else if (Number.isNaN(yearNum) || yearNum < 1990 || yearNum > currentYear) {
          yearErrors[i] = `출생 연도는 1990년부터 ${currentYear}년 사이로 선택해 주세요.`;
          hasYearError = true;
        }
      }
      if (hasYearError) next.childBirthYears = yearErrors;
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nickname: nickname.trim(),
          phone: onlyDigits(phone),
          password,
          childCount: Number.parseInt(childCount, 10),
          childBirthYears: childBirthYears.map((y) => Number.parseInt(y, 10)),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        if (res.status === 409) {
          setFieldErrors({ email: data.message ?? "이미 사용 중인 이메일입니다." });
        } else {
          setFieldErrors({});
          setSubmitError(data.message ?? "회원가입에 실패했습니다.");
        }
        return;
      }

      saveLoginSession({
        email: email.trim(),
        nickname: nickname.trim(),
        phoneDigits: onlyDigits(phone),
        childCount: Number.parseInt(childCount, 10),
        childBirthYears: childBirthYears.map((y) => Number.parseInt(y, 10)),
      });
      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} ${styles.signupCard}`}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>회원가입</h1>
          <p className={styles.loginSubtitle}>육아도사에 가입하고 맞춤 정보를 받아보세요.</p>
        </div>

        <form className={styles.signupForm} onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className={styles.formError} role="alert">
              {submitError}
            </p>
          ) : null}

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signupEmail">
              이메일
            </label>
            <input
              id="signupEmail"
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
            <label className={styles.formLabel} htmlFor="signupNickname">
              닉네임
            </label>
            <input
              id="signupNickname"
              name="nickname"
              type="text"
              autoComplete="nickname"
              maxLength={24}
              className={`${styles.formInput} ${fieldErrors.nickname ? styles.formInputInvalid : ""}`}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (fieldErrors.nickname) setFieldErrors((p) => ({ ...p, nickname: undefined }));
              }}
              placeholder="활동에 쓸 이름 (2~20자)"
            />
            <p className={styles.formHint}>다른 부모님에게 보이는 이름이에요.</p>
            <p className={styles.formError} role="alert">
              {fieldErrors.nickname ?? ""}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signupPhone">
              휴대폰 번호
            </label>
            <input
              id="signupPhone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className={`${styles.formInput} ${fieldErrors.phone ? styles.formInputInvalid : ""}`}
              value={phone}
              onChange={(e) => {
                setPhone(formatKoreanPhoneInput(e.target.value));
                if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="010-1234-5678"
            />
            <p className={styles.formHint}>숫자만 입력해도 되고, 입력하면 하이픈이 자동으로 들어가요.</p>
            <p className={styles.formError} role="alert">
              {fieldErrors.phone ?? ""}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="signupPassword">
              비밀번호
            </label>
            <input
              id="signupPassword"
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
            <label className={styles.formLabel} htmlFor="signupChildCount">
              자녀 수
            </label>
            <select
              id="signupChildCount"
              name="childCount"
              className={`${styles.formInput} ${fieldErrors.childCount ? styles.formInputInvalid : ""}`}
              value={childCount}
              onChange={(e) => handleChildCountChange(e.target.value)}
            >
              <option value="">자녀 수 선택</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n}명
                </option>
              ))}
            </select>
            <p className={styles.formError} role="alert">
              {fieldErrors.childCount ?? ""}
            </p>
          </div>

          {childBirthYears.map((year, index) => {
            const currentYear = new Date().getFullYear();
            const years: number[] = [];
            for (let y = currentYear; y >= 1990; y -= 1) years.push(y);
            const yearError = fieldErrors.childBirthYears?.[index];
            return (
              <div key={index} className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor={`signupChildBirthYear_${index}`}>
                  {index + 1}번째 아이 출생 연도
                </label>
                <select
                  id={`signupChildBirthYear_${index}`}
                  name={`childBirthYear_${index}`}
                  className={`${styles.formInput} ${yearError ? styles.formInputInvalid : ""}`}
                  value={year}
                  onChange={(e) => handleChildBirthYearChange(index, e.target.value)}
                >
                  <option value="">연도 선택</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}년
                    </option>
                  ))}
                </select>
                <p className={styles.formError} role="alert">
                  {yearError ?? ""}
                </p>
              </div>
            );
          })}

          <div className={styles.formGridFull}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "처리 중…" : "가입하기"}
            </button>
          </div>
        </form>

        <p className={styles.inlineTextLink}>
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>

        <Link className={styles.homeLink} href="/">
          ← 홈으로
        </Link>
      </div>
    </div>
  );
}
