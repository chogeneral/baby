"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "@/app/login/login.module.css";
import { formatKoreanPhoneInput, onlyDigits, isValidKoreanMobile } from "@/lib/formatKoreanPhone";

type Status = "idle" | "loading" | "sent";

export function FindIdForm() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [expiredError, setExpiredError] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "expired") {
      setExpiredError(true);
    }
  }, [searchParams]);

  function validate(): boolean {
    const digits = onlyDigits(phone);
    if (!digits) {
      setPhoneError("휴대폰 번호를 입력해 주세요.");
      return false;
    }
    if (!isValidKoreanMobile(digits)) {
      setPhoneError("올바른 한국 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: onlyDigits(phone) }),
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        setPhoneError(data.message ?? "오류가 발생했습니다. 다시 시도해 주세요.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setPhoneError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setStatus("idle");
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <h1 className={styles.loginTitle}>아이디 찾기</h1>
          <p className={styles.loginSubtitle}>
            가입 시 등록한 휴대폰 번호를 입력하면<br />
            이메일로 아이디 확인 링크를 보내드려요.
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
              가입하신 이메일로 인증 링크를 발송했습니다.<br />
              이메일을 확인하고 링크를 클릭해 주세요.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => { setStatus("idle"); setPhone(""); setPhoneError(""); setExpiredError(false); }}
            >
              다시 요청하기
            </button>
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="findIdPhone">
                휴대폰 번호
              </label>
              <input
                id="findIdPhone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                className={`${styles.formInput} ${phoneError ? styles.formInputInvalid : ""}`}
                value={phone}
                onChange={(e) => {
                  setPhone(formatKoreanPhoneInput(e.target.value));
                  if (phoneError) setPhoneError("");
                  if (expiredError) setExpiredError(false);
                }}
                placeholder="010-1234-5678"
              />
              
              <p className={styles.formError} role="alert">
                {phoneError}
              </p>
            </div>

            <button type="submit" className={styles.submitButton} disabled={status === "loading"}>
              {status === "loading" ? "발송 중…" : "인증 링크 받기"}
            </button>
          </form>
        )}

        <p className={styles.inlineTextLink}>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
