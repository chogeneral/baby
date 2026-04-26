import type { Metadata } from "next";
import { Suspense } from "react";
import { FindIdForm } from "./FindIdForm";

export const metadata: Metadata = {
  title: "아이디 찾기 | 육아박사",
  robots: { index: false },
};

export default function FindIdPage() {
  return (
    <Suspense>
      <FindIdForm />
    </Suspense>
  );
}
