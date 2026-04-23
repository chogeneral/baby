import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RightQuickMenu } from "@/components/RightQuickMenu";
import { GlobalScrollReveal } from "@/components/GlobalScrollReveal";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "육아박사",
    template: "%s | 육아박사",
  },
  description: "육아 정보와 성장 기록을 돕는 밝고 따뜻한 육아 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <GlobalScrollReveal />
        <Navbar />
        {children}
        <RightQuickMenu />
        <Footer />
      </body>
    </html>
  );
}
