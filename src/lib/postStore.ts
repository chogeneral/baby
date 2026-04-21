import fs from "fs";
import path from "path";
import {
  type CommunityRoomKind,
  inferBoardKindFromBirthYear,
} from "@/lib/communityRoom";

const DATA_PATH = path.join(process.cwd(), "data", "posts.json");

export type PostRecord = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  childBirthYear: number;
  createdAt: string;
  /** 없으면 childBirthYear로 추정(구 데이터 호환) */
  boardKind?: CommunityRoomKind;
  /** 영아방 말머리: 발달·식습관·언어·정서·건강 */
  prefix?: string;
  /** 사진첩 이미지 (base64 data URL, 1장) */
  photoDataUrl?: string;
  /** 조회수 */
  viewCount?: number;
};

/** 저장 형식이 달라도 목록·필터에서 동일한 방 기준을 쓴다 */
export function effectiveBoardKind(p: PostRecord): CommunityRoomKind {
  if (p.boardKind) return p.boardKind;
  return inferBoardKindFromBirthYear(p.childBirthYear);
}

function readAll(): PostRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as PostRecord[];
  } catch {
    return [];
  }
}

function writeAll(posts: PostRecord[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2), "utf-8");
}

export function getAllPosts(): PostRecord[] {
  return readAll().slice().reverse();
}

export function getPostsByBoardKind(kind: CommunityRoomKind): PostRecord[] {
  return readAll()
    .filter((p) => effectiveBoardKind(p) === kind)
    .slice()
    .reverse();
}

export function getPostById(id: string): PostRecord | undefined {
  return readAll().find((p) => p.id === id);
}

export function incrementViewCount(id: string): void {
  const posts = readAll();
  const post = posts.find((p) => p.id === id);
  if (post) {
    post.viewCount = (post.viewCount ?? 0) + 1;
    writeAll(posts);
  }
}

export function appendPost(post: PostRecord): void {
  const posts = readAll();
  posts.push(post);
  writeAll(posts);
}

export function generatePostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
