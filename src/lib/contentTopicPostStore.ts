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

export function appendPost(post: ContentTopicPostRecord): void {
  const rows = readAll();
  rows.push(post);
  writeAll(rows);
}

export function generateContentTopicPostId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
