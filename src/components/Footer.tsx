import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="w-full border-t border-[#2d2926]/[0.06] bg-[#faf9f6] mt-auto"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-serif text-lg font-semibold tracking-tight text-[#2d2926]">
              육아박사
            </span>
            <p className="text-xs text-[#6b6560] leading-relaxed max-w-xs">
              육아 정보와 성장 기록을 함께하는 따뜻한 커뮤니티
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/parent-stories"
              className="text-xs text-[#6b6560] hover:text-[#2d2926] transition-colors duration-200"
            >
              부모이야기
            </Link>
            <Link
              href="/development"
              className="text-xs text-[#6b6560] hover:text-[#2d2926] transition-colors duration-200"
            >
              발달
            </Link>
            <Link
              href="/community/kokkoma"
              className="text-xs text-[#6b6560] hover:text-[#2d2926] transition-colors duration-200"
            >
              꼬꼬마
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-[#6b6560]/70">
          © {new Date().getFullYear()} 육아박사. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
