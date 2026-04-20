/**
 * 브라우저 sessionStorage에만 보관하는 임시 로그인 상태다.
 * - 탭을 닫으면 자동으로 사라져서 데모·로컬 테스트에 적합하다.
 * - 비밀번호는 보안상 절대 저장하지 않는다.
 * - 나중에 NextAuth·서버 세션·JWT로 바꿀 때 이 모듈만 교체하면 된다.
 */

const storageKey = "baby01LoginSession";

export type LoginSessionPayload = {
  email: string;
  loggedInAt: string;
  /** 회원가입 등으로 채워질 수 있음. 로그인만 한 경우 없을 수 있다 */
  nickname?: string;
  phoneDigits?: string;
  childCount?: number;
  childBirthYears?: number[];
};

export function saveLoginSession(
  payload: Omit<LoginSessionPayload, "loggedInAt">,
): void {
  if (typeof window === "undefined") return;
  const full: LoginSessionPayload = {
    ...payload,
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(storageKey, JSON.stringify(full));
}

export function readLoginSession(): LoginSessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LoginSessionPayload;
    if (!parsed?.email || typeof parsed.email !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLoginSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey);
}
