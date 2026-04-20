import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "comments.json");

export type CommentRecord = {
  id: string;
  postId: string;
  content: string;
  authorEmail: string;
  authorNickname: string;
  createdAt: string;
};

function readAll(): CommentRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as CommentRecord[];
  } catch {
    return [];
  }
}

function writeAll(comments: CommentRecord[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(comments, null, 2), "utf-8");
}

export function getCommentsByPostId(postId: string): CommentRecord[] {
  return readAll().filter((c) => c.postId === postId);
}

export function appendComment(comment: CommentRecord): void {
  const comments = readAll();
  comments.push(comment);
  writeAll(comments);
}

export function generateCommentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
