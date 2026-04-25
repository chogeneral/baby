import { NextRequest, NextResponse } from "next/server";
import {
  appendPost,
  generateContentTopicPostId,
  getPostsByTopic,
  type ContentTopicPostRecord,
} from "@/lib/contentTopicPostStore";
import { getCommentsByPostId } from "@/lib/commentStore";
import { isContentTopicWriteAllowedEmail, normalizeContentTopicInput } from "@/lib/contentTopic";
import { findByEmail } from "@/lib/userStore";

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("topic");
  const topic = raw ? normalizeContentTopicInput(raw) : null;
  if (!topic) {
    return NextResponse.json([]);
  }
  const posts = await getPostsByTopic(topic);
  const withCounts = await Promise.all(
    posts.map(async (p) => ({
      ...p,
      commentCount: (await getCommentsByPostId(p.id)).length,
    })),
  );
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    topic?: string;
    password?: string;
  };

  const { title, content, authorEmail, topic: rawTopic, password } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const topic = rawTopic ? normalizeContentTopicInput(rawTopic) : null;
  if (!topic) {
    return NextResponse.json({ message: "유효하지 않은 주제입니다." }, { status: 400 });
  }

  const user = await findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isContentTopicWriteAllowedEmail(user.email)) {
    return NextResponse.json(
      { message: "글 등록 권한이 없습니다." },
      { status: 403 },
    );
  }

  const post: ContentTopicPostRecord = {
    id: generateContentTopicPostId(),
    topic,
    title: title.trim(),
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname ?? "",
    createdAt: new Date().toISOString(),
    ...(password?.trim() ? { password: password.trim() } : {}),
  };

  await appendPost(post);
  return NextResponse.json(post, { status: 201 });
}
