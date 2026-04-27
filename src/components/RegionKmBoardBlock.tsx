"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RegionCoords } from "@/components/RegionLiveMap";
import contentPageStyles from "@/app/contentPage.module.css";
import regionBoardStyles from "@/components/regionBoard.module.css";
import { readLoginSession } from "@/lib/loginSession";
import { firstDataImageSrcFromPostHtml } from "@/lib/postHtmlUtils";
import { PostListPhotoBadge } from "@/components/PostListPhotoBadge";
import { PostStackListMobile } from "@/components/PostStackListMobile";
import { regionBoardRadiusM } from "@/lib/regionBoardConstants";

const PAGE_SIZE = 10;

type ListPost = {
  id: string;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  /** 지역 유형(고민·육아용품거래 등) — `posts.prefix` */
  prefix?: string;
  commentCount?: number;
  viewCount?: number;
  distanceM?: number;
};

/**
 * 지역 메인 — **목록 전용** (제목 문구 없음, `aria-label` 만). 아기이야기와 같은 표·모바일 스택·하단 ← 목록 / 글쓰기.
 * `GET /api/region/board` 는 지도에서 잡힌 좌표 기준 1km 글만 돌려준다.
 */
export function RegionKmBoardBlock({ coords }: { coords: RegionCoords | null }) {
  const [posts, setPosts] = useState<ListPost[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!readLoginSession());
  }, []);

  const coordsKey = coords
    ? `${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`
    : null;

  useEffect(() => {
    if (!coordsKey || !coords) {
      setPosts([]);
      setListError(null);
      return;
    }

    const t = window.setTimeout(() => {
      setListLoading(true);
      setListError(null);
      fetch(
        `/api/region/board?lat=${encodeURIComponent(String(coords.lat))}&lng=${encodeURIComponent(String(coords.lng))}&radiusM=${regionBoardRadiusM}`,
      )
        .then(async (r) => {
          const j = (await r.json()) as { posts?: ListPost[]; message?: string };
          if (!r.ok) throw new Error(j.message ?? "목록을 불러오지 못했습니다.");
          setPosts(Array.isArray(j.posts) ? j.posts : []);
        })
        .catch((e: unknown) => {
          setListError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
          setPosts([]);
        })
        .finally(() => {
          setListLoading(false);
        });
    }, 500);

    return () => clearTimeout(t);
  }, [coordsKey, coords]);

  useEffect(() => {
    setPage(1);
  }, [coordsKey]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stackEntries = pagePosts.map((post) => {
    const hasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
    const titleWithType = post.prefix ? `[${post.prefix}] ${post.title}` : post.title;
    return {
      id: post.id,
      href: `/community/${post.id}`,
      title: titleWithType,
      createdAt: post.createdAt,
      hasPhoto,
      authorName: post.authorNickname?.trim() || "—",
    };
  });

  const hasCoords = !!coords;
  const showEmptyMessage =
    hasCoords && !listLoading && !listError && posts.length === 0;
  const showLocationHint =
    !hasCoords && !listLoading;

  return (
    <section
      className={regionBoardStyles.regionBoardSection}
      aria-label="지역 반경 1km 게시글 목록"
    >
      <div
        className={`${contentPageStyles.postTableOnlyDesktop} ${regionBoardStyles.regionBoardCard}`}
      >
        <table className={regionBoardStyles.regionBoardTable}>
          <colgroup>
            <col style={{ width: "3.5rem" }} />
            <col style={{ minWidth: "4rem" }} />
            <col style={{ width: "5.25rem" }} />
            <col style={{ width: "6.5rem" }} />
            <col style={{ width: "3.5rem" }} />
            <col style={{ width: "2.75rem" }} />
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={regionBoardStyles.regionBoardThNo} scope="col">
                번호
              </th>
              <th className={regionBoardStyles.regionBoardThTitle} scope="col">
                제목
              </th>
              <th className={regionBoardStyles.regionBoardThMeta} scope="col">
                글쓴이
              </th>
              <th className={regionBoardStyles.regionBoardThMeta} scope="col">
                날짜
              </th>
              <th className={regionBoardStyles.regionBoardThMeta} scope="col">
                댓글
              </th>
              <th className={regionBoardStyles.regionBoardThMeta} scope="col">
                사진
              </th>
              <th className={regionBoardStyles.regionBoardThMeta} scope="col">
                조회
              </th>
            </tr>
          </thead>
          <tbody>
            {listLoading && hasCoords ? (
              <tr>
                <td colSpan={7} className={regionBoardStyles.regionBoardEmptyCell}>
                  불러오는 중…
                </td>
              </tr>
            ) : null}
            {!listLoading && hasCoords && listError ? (
              <tr>
                <td colSpan={7} className={regionBoardStyles.regionBoardEmptyCell}>
                  {listError}
                </td>
              </tr>
            ) : null}
            {!listLoading && hasCoords && !listError
              ? pagePosts.map((post, i) => {
                  const rowHasPhoto = !!firstDataImageSrcFromPostHtml(post.content ?? "");
                  return (
                    <tr key={post.id}>
                      <td className={regionBoardStyles.regionBoardTdNo}>
                        {posts.length - ((page - 1) * PAGE_SIZE + i)}
                      </td>
                      <td className={regionBoardStyles.regionBoardTdTitle}>
                        <Link
                          href={`/community/${post.id}`}
                          className={regionBoardStyles.regionBoardTitleLink}
                        >
                          {post.prefix ? `[${post.prefix}] ${post.title}` : post.title}
                        </Link>
                      </td>
                      <td className={regionBoardStyles.regionBoardTdCenter}>
                        {post.authorNickname?.trim() || "—"}
                      </td>
                      <td className={regionBoardStyles.regionBoardTdCenter}>
                        {post.createdAt.slice(0, 10)}
                      </td>
                      <td className={regionBoardStyles.regionBoardTdCenter}>{post.commentCount ?? 0}</td>
                      <td className={regionBoardStyles.regionBoardTdCenter}>
                        <PostListPhotoBadge hasPhoto={rowHasPhoto} />
                      </td>
                      <td className={regionBoardStyles.regionBoardTdCenter}>{post.viewCount ?? 0}</td>
                    </tr>
                  );
                })
              : null}
            {showEmptyMessage ? (
              <tr>
                <td colSpan={7} className={regionBoardStyles.regionBoardEmptyCell}>
                  아직 작성된 글이 없어요.
                </td>
              </tr>
            ) : null}
            {showLocationHint && !listError ? (
              <tr>
                <td colSpan={7} className={regionBoardStyles.regionBoardEmptyCell}>
                  위치 권한을 허용하고 아래 지도에서 내 위치가 잡히면 목록이 표시돼요.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className={`${regionBoardStyles.regionBoardMobileCard} ${regionBoardStyles.regionBoardStackPlain}`}>
        <PostStackListMobile
          entries={stackEntries}
          isLoading={listLoading && hasCoords}
          emptyMessage={
            listError
              ? "목록을 불러오지 못했습니다. 위를 확인해 주세요."
              : !hasCoords
                ? "위치 권한을 켜고 지도에서 내 위치를 잡으면 목록이 보여요."
                : "아직 작성된 글이 없어요."
          }
        />
      </div>

      {totalPages > 1 && hasCoords && !listLoading && (
        <div className={contentPageStyles.pagination}>
          <button
            type="button"
            className={contentPageStyles.pageBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`${contentPageStyles.pageBtn} ${p === page ? contentPageStyles.pageBtnActive : ""}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={contentPageStyles.pageBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
      )}

      <div className={contentPageStyles.detailActions}>
        <Link href="/" className={contentPageStyles.detailBtnSecondary}>
          ← 목록
        </Link>
        {isLoggedIn ? (
          <Link href="/region/write" className={contentPageStyles.contentWriteLink}>
            글쓰기
          </Link>
        ) : (
          <Link href="/login" className={contentPageStyles.contentWriteLink}>
            글쓰기
          </Link>
        )}
      </div>
    </section>
  );
}
