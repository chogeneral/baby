import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "문의하기 | 육아박사",
  description: "육아박사 서비스 문의 — 제목과 내용을 입력해 주세요.",
};

export default function ContactPage() {
  return <ContactForm />;
}
