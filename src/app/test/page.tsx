"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// 1. 데이터 타입을 명확하게 정의합니다 (Any 에러 해결)
interface GuestbookPost {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export default function GuestbookPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  // 2. 정의한 타입을 상태에 적용합니다
  const [posts, setPosts] = useState<GuestbookPost[]>([]);

  // 데이터 불러오기 함수
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching:", error);
    } else {
      setPosts((data as GuestbookPost[]) || []);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 데이터 저장하기 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !message) return alert("이름과 메시지를 입력해주세요!");

    const { error } = await supabase
      .from("guestbook")
      .insert([{ name, message }]);

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      setName("");
      setMessage("");
      await fetchPosts(); // 저장 후 다시 불러오기
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
      >
        📖 방명록 테스트
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            color: "#000",
          }}
        />
        <textarea
          placeholder="메시지"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            height: "100px",
            color: "#000",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          등록하기
        </button>
      </form>

      <hr style={{ marginBottom: "20px" }} />

      <ul>
        {posts.map((post) => (
          <li
            key={post.id}
            style={{
              marginBottom: "15px",
              padding: "15px",
              border: "1px solid #eee",
              borderRadius: "8px",
            }}
          >
            <div style={{ marginBottom: "5px" }}>
              <strong style={{ fontSize: "16px" }}>{post.name}</strong>
            </div>
            <p style={{ margin: "0", color: "#333" }}>{post.message}</p>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "10px" }}>
              {new Date(post.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
