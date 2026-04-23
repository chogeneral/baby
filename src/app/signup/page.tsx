import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "육아박사 회원가입 — 이메일, 닉네임, 휴대폰, 비밀번호, 아이 출생 연도",
};

/** 회원가입 라우트: 로그인과 동일한 카드 스타일을 쓰고 필드만 다르게 구성한다 */
export default function SignupPage() {
  return <SignupForm />;
}
