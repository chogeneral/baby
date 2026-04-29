// src/app/layout.tsx
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RightQuickMenu } from "@/components/RightQuickMenu";
import { GlobalScrollReveal } from "@/components/GlobalScrollReveal";
import { SiteHeaderInset } from "@/components/SiteHeaderInset";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

/* OG·Twitter 카드의 상대 경로(/og-image.png)를 절대 URL로 풀 때 쓰는 사이트 루트(배포 도메인) */
const metadataBase = new URL(getSiteUrl());

/**
 * 기본 meta description·OG·Twitter 문구를 한 가지로 맞춘다(자식 라우트가 `metadata.description` 을 덮어쓰면 그쪽이 우선).
 * — 검색 스니펫·카톡 미리보기에 동일한 요약이 나가도록 한다.
 */
const defaultSiteDescription =
  "완벽한 부모보다 행복한 부모를 꿈꾸는 육아박사. 신생아 발달 정보, 부모 교육, 우리 동네 육아 소식까지 한 번에 확인하세요.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "육아박사",
    template: "%s | 육아박사",
  },
  description: defaultSiteDescription,
  applicationName: "육아박사",
  /* 모바일 브라우저 UI 톤 — globals 배경과 맞춘 밝은 베이지 */
  themeColor: "#faf7f2",
  icons: {
    icon: "/brand-icon.png",
    apple: "/brand-icon.png",
  },
  openGraph: {
    title: "육아박사",
    description: defaultSiteDescription,
    siteName: "육아박사",
    /* 메인 `page.tsx`에서 `url` 보강(홈 canonical·og:url 일치) */
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "육아박사" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "육아박사",
    description: defaultSiteDescription,
    images: ["/og-image.png"],
  },
  /* 외부로만 나갈 때 Referer 를 줄여 개인정보·URL 꼬리 유출을 완화(검색 품질과 무관, 보안 보조) */
  referrer: "strict-origin-when-cross-origin",
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
        <SiteHeaderInset />
        <Navbar />
        <main className="grow">{children}</main>
        <RightQuickMenu />
        <Footer />
      </body>
    </html>
  );
}
