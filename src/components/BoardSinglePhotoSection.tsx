"use client";

import { useRef } from "react";
import styles from "@/components/boardSinglePhotoSection.module.css";
import nestForm from "@/app/nestForm.module.css";
import { imageFileToJpegDataUrl } from "@/lib/boardSinglePhotoImage";

type Props = {
  /** data:image/jpeg;base64,... 또는 null — 부모 state 와 동기화 */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  /** <label htmlFor> 연결용 */
  sectionId?: string;
};

/**
 * 리치텍스트 아래에 두는 ‘사진 1장’ 전용 블록.
 * 툴바 아이콘 대신 여기서만 파일을 고르게 해서 한 장 제한을 UI 로도 분명히 한다.
 */
export function BoardSinglePhotoSection({ value, onChange, sectionId = "boardSinglePhoto" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await imageFileToJpegDataUrl(file);
    if (dataUrl) onChange(dataUrl);
    else {
      window.alert(
        "이 사진을 이 브라우저에서 열 수 없어요. JPG·PNG·WEBP 로 저장한 뒤 다시 시도해 주세요.",
      );
    }
  }

  return (
    <div className={styles.section}>
      <label htmlFor={`${sectionId}File`} className={styles.sectionLabel}>
        사진 <span className={nestForm.nestMuted}>(선택, 1장만)</span>
      </label>
      <p className={styles.hint}>
        본문과 별도로 사진 한 장만 첨부할 수 있어요. 글 맨 아래에 표시돼요.
      </p>
      <div className={styles.row}>
        <input
          ref={inputRef}
          id={`${sectionId}File`}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          aria-hidden
          tabIndex={-1}
          onChange={handleFile}
        />
        <button
          type="button"
          className={styles.pickBtn}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "사진 바꾸기" : "사진 선택"}
        </button>
        {value ? (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onChange(null)}
          >
            사진 제거
          </button>
        ) : null}
      </div>
      {value ? (
        <div className={styles.previewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 업로드 data URL 미리보기 */}
          <img src={value} alt="" className={styles.preview} />
        </div>
      ) : null}
    </div>
  );
}
