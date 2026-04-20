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

export function appendPost(post: PostRecord): void {
  const posts = readAll();
  posts.push(post);
  writeAll(posts);
}

export function generatePostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
