import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * createClient 를 파일 최상단에서 바로 호출하면,
 * Vercel 빌드 시점에 NEXT_PUBLIC_* 가 비어 있을 때 모듈 로드만으로도
 * "supabaseUrl is required" 가 나온다.
 * 첫 사용 시점에만 클라이언트를 만들도록 지연 초기화한다.
 */
let client: SupabaseClient | null = null;

function getOrCreateClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 비어 있습니다. " +
        "Vercel → Project → Settings → Environment Variables 에 두 값을 넣고(Production/Preview), " +
        "저장 뒤 Redeploy 하세요. 이름 철자·앞뒤 공백을 확인하세요.",
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

/* 기존 `import { supabase } from "./supabase"` 호환: Proxy로 지연 위임 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getOrCreateClient();
    const value = Reflect.get(c, prop, receiver) as unknown;
    return typeof value === "function" ? (value as () => void).bind(c) : value;
  },
}) as SupabaseClient;
