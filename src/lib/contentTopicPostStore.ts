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
  photoDataUrl?: string;
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
  photoDataUrl?: string | null;
};

export function updatePost(
  id: string,
  password: string,
  fields: UpdatePostFields,
): "ok" | "not_found" | "wrong_password" {
  const rows = readAll();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return "not_found";
  if (rows[idx].password !== password) return "wrong_password";

  rows[idx] = {
    ...rows[idx],
    title: fields.title.trim(),
    content: fields.content.trim(),
    ...(fields.photoDataUrl !== undefined
      ? fields.photoDataUrl === null
        ? { photoDataUrl: undefined }
        : { photoDataUrl: fields.photoDataUrl }
      : {}),
  };
  writeAll(rows);
  return "ok";
}

export function generateContentTopicPostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
