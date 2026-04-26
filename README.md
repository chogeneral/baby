This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Vercel 배포 (baby01)

1. [Vercel](https://vercel.com) 로그인 → **Add New** → **Project** → GitHub의 이 저장소 **Import** (CLI: `npx vercel@latest login` 후 저장소 루트에서 `npm run deploy:vercel`)
2. **Framework Preset**: Next.js, Root Directory: 저장소 루트(기본) → **Deploy**  
   (첫 배포 직전에 환경 변수를 넣으면 런타임 오류를 줄일 수 있습니다.)
3. **Settings → Environment Variables**에 [`.env.example`](./.env.example)의 키를 그대로 복사해, Production(필요 시 Preview)용 값을 채웁니다.
4. **Supabase** 대시보드: Authentication·URL 허용 목록에 Vercel 프로덕션 URL(및 프리뷰가 필요하면 `*.vercel.app` 패턴)을 **Site URL / Redirect URLs**에 등록합니다.
5. **카카오 개발자** 콘솔: 사용 중인 앱의 **웹 도메인·플랫폼**에 배포 URL을 넣고, REST/JS 키가 해당 앱의 것인지 확인합니다.
6. **커스텀 도메인**을 Vercel **Domains**에 연결한 뒤, `NEXT_PUBLIC_BASE_URL`과 `NEXT_PUBLIC_SITE_URL`을 새 도메인(`https://...`)으로 맞추고 **Redeploy** 합니다.

로컬에서 프로덕션 빌드 확인: `npm run build`

자세한 Next.js 배포: [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
