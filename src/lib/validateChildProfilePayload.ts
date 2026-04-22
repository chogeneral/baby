import { isIsoDateInRange } from "@/lib/birthDateParts";

/**
 * 회원가입·마이페이지에서 공통으로 쓰는 자녀 수·이름·생일 검증이다.
 * 통과 시 childBirthYears까지 계산해 한 번에 저장에 넣을 수 있게 한다.
 */
export function validateChildProfilePayload(
  childCount: unknown,
  childNames: unknown,
  childBirthDates: unknown,
  maxDateStr: string,
):
  | {
      ok: true;
      childCount: number;
      trimmedNames: string[];
      childBirthDates: string[];
      childBirthYears: number[];
    }
  | { ok: false; message: string } {
  if (
    childCount == null ||
    typeof childCount !== "number" ||
    !Number.isInteger(childCount) ||
    !Array.isArray(childNames) ||
    !Array.isArray(childBirthDates) ||
    childBirthDates.length !== childCount ||
    childNames.length !== childCount
  ) {
    return { ok: false, message: "자녀 수·이름·생일 정보가 올바르지 않습니다." };
  }

  if (childCount < 1 || childCount > 5) {
    return { ok: false, message: "자녀 수는 1명~5명만 가능합니다." };
  }

  const trimmedNames: string[] = [];
  for (let i = 0; i < childNames.length; i++) {
    const n = typeof childNames[i] === "string" ? childNames[i].trim() : "";
    if (!n) {
      return { ok: false, message: `${i + 1}번째 아이 이름을 입력해 주세요.` };
    }
    if (n.length > 24) {
      return { ok: false, message: `${i + 1}번째 아이 이름은 24자 이하로 입력해 주세요.` };
    }
    trimmedNames.push(n);
  }

  const childBirthYears: number[] = [];
  for (let i = 0; i < childBirthDates.length; i++) {
    const raw = childBirthDates[i];
    if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, message: `${i + 1}번째 아이의 생년월일을 다시 선택해 주세요.` };
    }
    if (!isIsoDateInRange(raw, "1990-01-01", maxDateStr)) {
      return { ok: false, message: `${i + 1}번째 아이의 생년월일은 1990-01-01 ~ 오늘 사이여야 합니다.` };
    }
    childBirthYears.push(Number.parseInt(raw.slice(0, 4), 10));
  }

  return {
    ok: true,
    childCount,
    trimmedNames,
    childBirthDates: childBirthDates as string[],
    childBirthYears,
  };
}
