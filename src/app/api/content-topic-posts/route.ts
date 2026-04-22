import { NextRequest, NextResponse } from "next/server";
import {
  appendPost,
  generateContentTopicPostId,
  getPostsByTopic,
  type ContentTopicPostRecord,
} from "@/lib/contentTopicPostStore";
import type { ContentTopicKind } from "@/lib/contentTopic";
import { findByEmail } from "@/lib/userStore";

function isContentTopicKind(value: string): value is ContentTopicKind {
  return (
    value === "development" ||
    value === "parentStories"
  );
}

export async function GET(req: NextRequest) {
  const topic = new URL(req.url).searchParams.get("topic");
  if (!topic || !isContentTopicKind(topic)) {
    return NextResponse.json([]);
  }
  return NextResponse.json(getPostsByTopic(topic));
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    title?: string;
    content?: string;
    authorEmail?: string;
    topic?: string;
    photoDataUrl?: string;
    password?: string;
  };

  const { title, content, authorEmail, topic: rawTopic, photoDataUrl, password } = body;

  if (!title?.trim() || !content?.trim() || !authorEmail) {
    return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  if (!rawTopic || !isContentTopicKind(rawTopic)) {
    return NextResponse.json({ message: "유효하지 않은 주제입니다." }, { status: 400 });
  }

  const user = findByEmail(authorEmail);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const post: ContentTopicPostRecord = {
    id: generateContentTopicPostId(),
    topic: rawTopic,
    title: title.trim(),
    content: content.trim(),
    authorEmail: user.email,
    authorNickname: user.nickname ?? "",
    createdAt: new Date().toISOString(),
    ...(photoDataUrl ? { photoDataUrl } : {}),
    ...(password?.trim() ? { password: password.trim() } : {}),
  };

  appendPost(post);
  return NextResponse.json(post, { status: 201 });
}
