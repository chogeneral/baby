/** 욕설·성적 표현 금지 단어 목록 */
const BANNED_WORDS = [
  // 욕설
  "씨발", "씨팔", "시발", "시팔", "ㅅㅂ",
  "개새끼", "개새", "ㄱㅅㄲ",
  "지랄", "ㅈㄹ",
  "병신", "ㅂㅅ",
  "미친놈", "미친년", "미친새끼", "미쳤냐",
  "꺼져", "죽어", "뒤져",
  "좆", "자지", "보지", "보지년",
  "창녀", "년놈", "개년",
  "새끼", "쌍년", "쌍놈",
  "닥쳐", "꺼지라",
  "찐따", "병자",
  // 성적 표현
  "섹스", "섹시", "야동", "포르노",
  "성관계", "성교", "성행위",
  "강간", "윤간",
  "딸딸이", "자위",
  "음란", "음탕",
  "AV", "av녀",
];

/**
 * 텍스트에 금지 단어가 포함되어 있으면 해당 단어를 반환하고, 없으면 null을 반환한다.
 */
export function findBannedWord(text: string): string | null {
  const normalized = text.replace(/\s/g, "").toLowerCase();
  for (const word of BANNED_WORDS) {
    if (normalized.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}
