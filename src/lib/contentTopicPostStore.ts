import fs from "fs";
import path from "path";
import type { ContentTopicKind } from "@/lib/contentTopic";

const DATA_PATH = path.join(process.cwd(), "data", "contentTopicPosts.json");

export type ContentTopicPostRecord = {
  id: string;
  topic: ContentTopicKind;
  title: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
  viewCount?: number;
  password?: string;
};

function readAll(): ContentTopicPostRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as ContentTopicPostRecord[];
  } catch {
    return [];
  }
}

function writeAll(rows: ContentTopicPostRecord[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(rows, null, 2), "utf-8");
}

export function getPostsByTopic(topic: ContentTopicKind): ContentTopicPostRecord[] {
  return readAll()
    .filter((p) => p.topic === topic)
    .slice()
    .reverse();
}

export function getPostById(id: string): ContentTopicPostRecord | undefined {
  return readAll().find((p) => p.id === id);
}

export function incrementViewCount(id: string): void {
  const rows = readAll();
  const post = rows.find((p) => p.id === id);
  if (post) {
    post.viewCount = (post.viewCount ?? 0) + 1;
    writeAll(rows);
  }
}

export function appendPost(post: ContentTopicPostRecord): void {
  const rows = readAll();
  rows.push(post);
  writeAll(rows);
}

export type UpdatePostFields = {
  title: string;
  content: string;
};

/**
 * 작성자 이메일이 같으면 항상 수정 가능.
 * 비밀번호가 있는 글은 비작성자가 올바른 비밀번호를 보내도 수정 가능(기존 동작 유지).
 */
export function updateContentTopicPost(
  id: string,
  fields: UpdatePostFields,
  auth: { authorEmail?: string; password?: string },
): "ok" | "not_found" | "wrong_password" | "forbidden" {
  const rows = readAll();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return "not_found";
  const post = rows[idx];

  const isAuthor =
    !!auth.authorEmail && post.authorEmail === auth.authorEmail;
  const passwordMatches =
    !!post.password &&
    !!auth.password &&
    post.password === auth.password;

  if (!isAuthor && !passwordMatches) {
    if (post.password) return "wrong_password";
    return "forbidden";
  }

  rows[idx] = {
    ...rows[idx],
    title: fields.title.trim(),
    content: fields.content.trim(),
  };
  delete (rows[idx] as ContentTopicPostRecord & { photoDataUrl?: string }).photoDataUrl;
  writeAll(rows);
  return "ok";
}

export function deleteContentTopicPost(
  id: string,
  auth: { authorEmail?: string; password?: string },
): "ok" | "not_found" | "forbidden" | "wrong_password" {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return "not_found";

  const post = rows[idx];
  const isAuthor = !!auth.authorEmail && post.authorEmail === auth.authorEmail;
  const passwordMatches = !!post.password && !!auth.password && post.password === auth.password;

  if (!isAuthor && !passwordMatches) {
    if (post.password) return "wrong_password";
    return "forbidden";
  }

  rows.splice(idx, 1);
  writeAll(rows);
  return "ok";
}

export function generateContentTopicPostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
