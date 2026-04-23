import Image from "next/image";
import Link from "next/link";

/**
 * 전역 푸터 — 본문·서브페이지와 구분은 상단 보더만 두고 배경은 흰색으로 통일한다.
 * `id` 는 `RightQuickMenu` 가 `querySelector("footer")` 가 아닌 **이 푸터만** `getBoundingClientRect` 하도록 고정해,
 * (향후) 본문에 `<footer>` 가 더 생겨도 퀵 메뉴 `bottom` 계산이 잘못 잡히지 않게 한다.
 */
export function Footer() {
  return (
    <footer
      id="globalSiteFooter"
      className="w-full border-t border-[#2d2926]/[0.06] bg-white mt-auto"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            {/*
              헤더와 동일한 /logo.svg 를 쓰되 푸터는 본문보다 작게 보이도록 높이를 h-12(헤더 h-16 대비 한 단계 낮춤)로 둔다.
              w-auto로 가로는 viewBox 비율을 그대로 따른다.
            */}
            <Link
              href="/"
              className="inline-flex w-fit items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c57b67]/40"
              aria-label="육아박사 홈"
            >
              <Image
                src="/logo.svg"
                alt="육아박사"
                width={600}
                height={150}
                className="h-12 w-auto"
              />
            </Link>
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
