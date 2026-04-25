"use client";

import { useRef } from "react";
import styles from "@/components/boardSinglePhotoSection.module.css";
import { imageFileToJpegDataUrl } from "@/lib/boardSinglePhotoImage";

/** data URL 총량·요청 본문 크기를 고려한 상한(장수) */
const maxAttachedPhotos = 20;

type Props = {
  /** `data:image/jpeg;base64,...` 배열 — 부모 state 와 동기화 */
  value: string[];
  onChange: (dataUrls: string[]) => void;
  /** <label htmlFor> 연결용 */
  sectionId?: string;
};

/**
 * 리치텍스트 아래에 두는 ‘하단 사진’ 블록 — 다중 첨부 시 저장 HTML 에 `<p><img>…` 가 순서대로 붙는다.
 */
export function BoardSinglePhotoSection({
  value,
  onChange,
  sectionId = "boardSinglePhoto",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) {
      return;
    }
    const next = [...value];
    for (const file of files) {
      if (next.length >= maxAttachedPhotos) {
        window.alert(`사진은 최대 ${maxAttachedPhotos}장까지 첨부할 수 있어요.`);
        break;
      }
      const dataUrl = await imageFileToJpegDataUrl(file);
      if (dataUrl) {
        next.push(dataUrl);
      } else {
        window.alert(
          "이 사진을 이 브라우저에서 열 수 없어요. JPG·PNG·WEBP 로 저장한 뒤 다시 시도해 주세요.",
        );
      }
    }
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.section}>
      <label htmlFor={`${sectionId}File`} className={styles.sectionLabel}>
        사진
      </label>
      <p className={styles.hint}>
        본문과 별도로 여러 장의 사진을 첨부할 수 있어요. 글 맨 아래에 표시돼요.
      </p>
      <div className={styles.row}>
        <input
          ref={inputRef}
          id={`${sectionId}File`}
          type="file"
          accept="image/*"
          multiple
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
          {value.length > 0 ? "사진 추가" : "사진 선택"}
        </button>
        {value.length > 0 ? (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onChange([])}
          >
            전부 제거
          </button>
        ) : null}
      </div>
      {value.length > 0 ? (
        <ul className={styles.previewList}>
          {value.map((src, index) => (
            <li key={`${index}-${src.slice(0, 32)}`} className={styles.previewItem}>
              {/*
                썸네일 우상단에만 X 를 두어 한 장만 지울 때 시선 이동을 최소화한다.
                탭·SR 은 `aria-label` 로 “이 사진 제거” 의미를 전달한다.
              */}
              <div className={styles.previewFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 업로드 data URL 미리보기 */}
                <img src={src} alt="" className={styles.preview} />
                <button
                  type="button"
                  className={styles.removeXBtn}
                  onClick={() => removeAt(index)}
                  aria-label="이 사진 제거"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
