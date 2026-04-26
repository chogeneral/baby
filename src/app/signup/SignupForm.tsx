"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatKoreanPhoneInput,
  isValidKoreanMobile,
  onlyDigits,
} from "@/lib/formatKoreanPhone";
import { isIsoDateInRange } from "@/lib/birthDateParts";
import { saveLoginSession } from "@/lib/loginSession";
import styles from "../login/login.module.css";

type ChildRow = {
  /** 아이를 부르는 이름(호칭) */
  name: string;
  /** HTML5 date 값 YYYY-MM-DD */
  birthDate: string;
};

type FieldErrors = {
  email?: string;
  nickname?: string;
  phone?: string;
  password?: string;
  childCount?: string;
  childNameErrors?: string[];
  childDateErrors?: string[];
};

/**
 * 가입 시 자녀 수·자녀별 이름·생일(브라우저 datepicker)을 받는다.
 * 생일은 `input type="date"` 로 열리는 OS·브라우저 기본 달력 UI 를 사용한다.
 */
export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [childCount, setChildCount] = useState("");
  const [childRows, setChildRows] = useState<ChildRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { minDate, maxDate } = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return { minDate: "1990-01-01", maxDate: `${y}-${m}-${d}` };
  }, []);

  function handleChildCountChange(value: string) {
    setChildCount(value);
    if (fieldErrors.childCount) setFieldErrors((p) => ({ ...p, childCount: undefined }));
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n < 1 || n > 5) {
      setChildRows([]);
      return;
    }
    setChildRows((prev) => {
      const next: ChildRow[] = prev.slice(0, n);
      while (next.length < n) {
        next.push({ name: "", birthDate: "" });
      }
      return next;
    });
  }

  function handleChildRowChange(index: number, field: keyof ChildRow, value: string) {
    setChildRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (field === "name" && fieldErrors.childNameErrors?.[index]) {
      setFieldErrors((p) => {
        const err = [...(p.childNameErrors ?? [])];
        err[index] = "";
        return { ...p, childNameErrors: err };
      });
    }
    if (field === "birthDate" && fieldErrors.childDateErrors?.[index]) {
      setFieldErrors((p) => {
        const err = [...(p.childDateErrors ?? [])];
        err[index] = "";
        return { ...p, childDateErrors: err };
      });
    }
  }

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
    if (!childCount.trim()) {
      next.childCount = "자녀 수를 입력해 주세요. (1~5)";
    } else if (Number.isNaN(countNum) || countNum < 1 || countNum > 5) {
      next.childCount = "자녀 수는 1~5 사이 숫자로 입력해 주세요.";
    }

    if (!next.childCount && countNum > 0) {
      const nameErrs: string[] = new Array(countNum).fill("");
      const dateErrs: string[] = new Array(countNum).fill("");

      for (let i = 0; i < countNum; i++) {
        const r = childRows[i] ?? { name: "", birthDate: "" };
        const nm = r.name.trim();
        if (!nm) {
          nameErrs[i] = "이름을 입력해 주세요.";
        } else if (nm.length > 24) {
          nameErrs[i] = "이름은 24자 이하로 입력해 주세요.";
        }

        if (!r.birthDate) {
          dateErrs[i] = "생일을 선택해 주세요.";
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(r.birthDate)) {
          dateErrs[i] = "생일을 다시 선택해 주세요.";
        } else if (!isIsoDateInRange(r.birthDate, "1990-01-01", maxDate)) {
          dateErrs[i] = "생일은 1990-01-01 ~ 오늘 사이여야 합니다.";
        }
      }

      if (nameErrs.some(Boolean)) next.childNameErrors = nameErrs;
      if (dateErrs.some(Boolean)) next.childDateErrors = dateErrs;
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");
    const countNum = Number.parseInt(childCount, 10);
    const rows = childRows.slice(0, countNum);
    const childBirthDates = rows.map((r) => r.birthDate);
    const childNames = rows.map((r) => r.name.trim());
    const childBirthYears = childBirthDates.map((d) => Number.parseInt(d.slice(0, 4), 10));

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nickname: nickname.trim(),
          phone: onlyDigits(phone),
          password,
          childCount: countNum,
          childNames,
          childBirthDates,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
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
        childCount: countNum,
        childBirthYears,
        childBirthDates,
        primaryChildIndex: 0,
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
          <p className={styles.loginSubtitle}>육아박사에 가입하고 맞춤 정보를 받아보세요.</p>
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
            <input
              id="signupChildCount"
              name="childCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={5}
              step={1}
              className={`${styles.formInput} ${fieldErrors.childCount ? styles.formInputInvalid : ""}`}
              value={childCount}
              onChange={(e) => handleChildCountChange(e.target.value)}
              placeholder="1 ~ 5"
            />
            <p className={styles.formHint}>1명부터 5명까지 숫자로 입력해 주세요.</p>
            <p className={styles.formError} role="alert">
              {fieldErrors.childCount ?? ""}
            </p>
          </div>

          {childRows.map((row, index) => {
            const nameErr = fieldErrors.childNameErrors?.[index];
            const dateErr = fieldErrors.childDateErrors?.[index];
            const hasChildErr = Boolean(nameErr || dateErr);
            return (
              <div key={index} className={styles.formGroup}>
                <p className={styles.formLabel}>{index + 1}번째 아이</p>
                <input
                  type="text"
                  id={`childName_${index}`}
                  name={`childName_${index}`}
                  autoComplete="off"
                  className={`${styles.formInput} ${nameErr ? styles.formInputInvalid : ""}`}
                  value={row.name}
                  onChange={(e) => handleChildRowChange(index, "name", e.target.value)}
                  placeholder="아이 이름(호칭)"
                  maxLength={24}
                  aria-label={`${index + 1}번째 아이 이름`}
                />
                <p className={styles.formError} role="alert">
                  {nameErr ?? ""}
                </p>

                <label className={styles.formLabel} htmlFor={`childBirthDate_${index}`} style={{ marginTop: "0.5rem" }}>
                  생일
                </label>
                <p className={styles.formHint} style={{ margin: 0 }}>
                  달력에서 선택하면 됩니다. (최대 오늘까지)
                </p>
                <input
                  id={`childBirthDate_${index}`}
                  name={`childBirthDate_${index}`}
                  type="date"
                  min={minDate}
                  max={maxDate}
                  className={`${styles.formInput} ${styles.formInputDate} ${dateErr ? styles.formInputInvalid : ""}`}
                  value={row.birthDate}
                  onChange={(e) => handleChildRowChange(index, "birthDate", e.target.value)}
                  aria-invalid={hasChildErr}
                  aria-label={`${index + 1}번째 아이 생일`}
                />
                <p className={styles.formError} role="alert">
                  {dateErr ?? ""}
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
          <Link href="/login">로그인</Link>
        </p>

      </div>
    </div>
  );
}
