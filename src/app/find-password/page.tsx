import type { Metadata } from "next";
import { Suspense } from "react";
import { FindPasswordForm } from "./FindPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기 | 육아박사",
  robots: { index: false },
};

export default function FindPasswordPage() {
  return (
    <Suspense>
      <FindPasswordForm />
    </Suspense>
  );
}
