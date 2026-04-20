import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인 | 육아도사",
  description: "육아도사 로그인 — 이메일, 비밀번호",
};

/** 로그인 라우트: 폼은 클라이언트 컴포넌트로 분리해 입력·검증 상태를 다룬다 */
export default function LoginPage() {
  return <LoginForm />;
}
