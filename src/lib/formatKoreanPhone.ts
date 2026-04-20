/**
 * 휴대폰 번호 표시용 하이픈 자동 삽입
 * - 010은 가장 흔한 11자리(3-4-4) 규칙을 쓴다.
 * - 그 외 011·016 등은 11자리면 3-4-4, 10자리 이하면 3-3-4로 맞춘다.
 * - 검증·저장은 숫자만 쓰므로(onlyDigits) 여기서는 표시 문자열만 만든다.
 */
export function formatKoreanPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";

  if (d.startsWith("010")) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  /* 11자리(예: 011-1234-5678): 가운데 4자리 블록 */
  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  /* 10자리 이하(예: 011-123-4567): 3-3-4 */
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

/** 입력 문자열에서 숫자만 남겨 검증·세션 저장에 쓴다 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** 한국 휴대폰 번호: 하이픈 유무와 관계없이 숫자만으로 010·011 등 패턴을 검사한다 */
export function isValidKoreanMobile(digits: string): boolean {
  if (digits.length < 10 || digits.length > 11) return false;
  if (digits.startsWith("010")) return digits.length === 11;
  if (
    digits.startsWith("011") ||
    digits.startsWith("016") ||
    digits.startsWith("017") ||
    digits.startsWith("018") ||
    digits.startsWith("019")
  ) {
    return digits.length === 10 || digits.length === 11;
  }
  return false;
}
