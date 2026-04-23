import fs from "fs";
import path from "path";
import {
  type CommunityRoomKind,
  effectiveBoardKind,
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
  /** 조회수 */
  viewCount?: number;
  /**
   * 연령방(영아·토들러·유아) 전용 — 설정 시 수정 화면·API에서 같은 값을 다시 보내야 한다.
   * 꼬꼬마 게시판 글에는 두지 않는다.
   */
  editPassword?: string;
};

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

/**
 * 작성자 이메일이 일치하고, 저장된 수정 비밀번호가 있으면 요청의 비밀번호까지 일치해야 갱신한다.
 */
export function updateCommunityPost(
  id: string,
  editorEmail: string,
  fields: { title: string; content: string; prefix?: string },
  opts?: { editPassword?: string },
): "ok" | "not_found" | "forbidden" | "wrong_password" {
  const posts = readAll();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return "not_found";
  if (posts[idx].authorEmail !== editorEmail) return "forbidden";

  const storedPw = posts[idx].editPassword;
  if (storedPw != null && storedPw.length > 0) {
    if (!opts?.editPassword || opts.editPassword !== storedPw) {
      return "wrong_password";
    }
  }

  const next: PostRecord = {
    ...posts[idx],
    title: fields.title.trim(),
    content: fields.content.trim(),
  };
  const kind = effectiveBoardKind(next);
  if (kind !== "kokkoma" && fields.prefix !== undefined) {
    next.prefix = fields.prefix;
  }
  posts[idx] = next;
  writeAll(posts);
  return "ok";
}

export function generatePostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
