/**
 * 이메일 앞 2자만 노출, 나머지 로컬 파트는 * 처리
 * 예) test@gmail.com → te**@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return email;

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  const visibleLen = Math.min(2, local.length);
  const masked = local.slice(0, visibleLen) + "*".repeat(local.length - visibleLen);

  return masked + domain;
}

/**
 * 전화번호 중간 자리를 * 처리 (하이픈 포함·미포함 모두 지원)
 * 예) 010-1234-5678 → 010-****-5678
 *     01012345678   → 010-****-5678
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");

  if (d.length === 11) {
    return `${d.slice(0, 3)}-${"*".repeat(4)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `${d.slice(0, 3)}-${"*".repeat(3)}-${d.slice(6)}`;
  }

  return phone;
}
