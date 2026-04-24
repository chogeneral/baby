// src/app/layout.tsx
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RightQuickMenu } from "@/components/RightQuickMenu";
import { GlobalScrollReveal } from "@/components/GlobalScrollReveal";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

/* OG·Twitter 카드의 상대 경로(/og-image.png)를 절대 URL로 풀 때 쓰는 사이트 루트(배포 도메인) */
const metadataBase = new URL(getSiteUrl());

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "육아박사",
    template: "%s | 육아박사",
  },
  description: "육아 정보와 성장 기록을 돕는 밝고 따뜻한 육아 커뮤니티",
  icons: {
    icon: "/brand-icon.png",
    apple: "/brand-icon.png",
  },
  openGraph: {
    title: "육아박사",
    description: "행복한 부모를 위한 내일의 응원",
    siteName: "육아박사",
    /* 메인 `page.tsx`와 동일한 공유 이미지로 통일(1200×630 권장) */
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "육아박사" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "육아박사",
    description: "행복한 부모를 위한 내일의 응원",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {/* 기존 컴포넌트들 유지 */}
        <GlobalScrollReveal />
        <Navbar />
        <main className="grow">{children}</main>
        <RightQuickMenu />
        <Footer />
      </body>
    </html>
  );
}
