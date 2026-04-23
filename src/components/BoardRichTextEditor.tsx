"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "@/components/boardRichTextEditor.module.css";

const SPECIAL_CHARS = [
  "※", "★", "☆", "♥", "♡", "◆", "◇", "■", "□", "▲", "△", "▼", "▽",
  "→", "←", "↑", "↓", "·", "…", "‘", "’", "“", "”", "℃", "㎡",
  "①", "②", "③", "④", "⑤", "㈜", "℡",
];



type Props = {
  /** HTML 문자열 — 서버/부모 상태와 동기화 */
  value: string;
  onChange: (html: string) => void;
  /** <label htmlFor> 과 연결 */
  id?: string;
  placeholder?: string;
};

/**
 * 게시판 본문용 리치 텍스트 에디터.
 * 브라우저 document.execCommand 를 사용한다(deprecated 이지만 별도 에디터 라이브러리 없이
 * 폰트·색·정렬 등 툴바를 빠르게 맞추기 위함).
 * 버튼만 mousedown preventDefault — select 에는 걸면 드롭다운이 열리지 않는다.
 * 글꼴·크기는 mousedown 캡처로 선택 영역을 저장해 두고 onChange 에서 복원한다.
 */
export function BoardRichTextEditor({
  value,
  onChange,
  id,
  placeholder = "내용을 입력해 주세요",
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const foreColorRef = useRef<HTMLInputElement>(null);
  const backColorRef = useRef<HTMLInputElement>(null);
  const [showSpecial, setShowSpecial] = useState(false);
  /** 부모 value 와 에디터 innerHTML 을 맞출 때 사용 — null 이면 아직 초기 동기화 전 */
  const lastSyncedRef = useRef<string | null>(null);
  /**
   * 글꼴·크기 셀렉트를 누르면 에디터가 blur 되며 선택이 풀리므로,
   * mousedown 캡처 시점에 Range 를 복제해 두고 onChange 에서 복원한 뒤 execCommand 한다.
   */
  const savedSelectionRef = useRef<Range | null>(null);

  const captureSelectionFromEditor = () => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel?.rangeCount) {
      savedSelectionRef.current = null;
      return;
    }
    const node = sel.anchorNode;
    if (!node || !editor.contains(node)) {
      savedSelectionRef.current = null;
      return;
    }
    savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSavedSelection = (): boolean => {
    const editor = editorRef.current;
    const r = savedSelectionRef.current;
    if (!editor || !r) return false;
    editor.focus();
    try {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      return true;
    } catch {
      savedSelectionRef.current = null;
      return false;
    }
  };

  const emitHtml = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  }, [onChange]);

  /* useLayoutEffect 로 부모 value 를 DOM 에 맞추면 paint 전에 처리되어, 직후 삽입한 img 가 한 프레임 사라지는 현상을 줄인다 */
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    /* 마운트 직후 한 번은 무조건 value 를 넣고, 이후에는 부모가 바꾼 경우에만 덮어써서 입력 중 커서가 튀지 않게 한다 */
    if (lastSyncedRef.current === null) {
      el.innerHTML = value || "";
      lastSyncedRef.current = value;
      return;
    }
    if (value !== lastSyncedRef.current) {
      /*
       * 파일 선택 후 비동기로 img 를 넣은 직후, 부모 state 가 아직 빈 문자열인 채로 effect 가 돌면
       * 에디터를 덮어써 사진이 사라질 수 있다 — 에디터에만 img 가 있으면 부모를 다시 맞춘다.
       */
      const editorHasImg = el.innerHTML.includes("<img");
      const valueHasImg = (value || "").includes("<img");
      if (document.activeElement === el && editorHasImg && !valueHasImg) {
        lastSyncedRef.current = el.innerHTML;
        onChange(el.innerHTML);
        return;
      }
      el.innerHTML = value || "";
      lastSyncedRef.current = value;
    }
  }, [value, onChange]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const run = (command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitHtml();
  };

  /**
   * 글자 크기(px) — 드래그 선택이 있으면 span 으로 감싸고,
   * 커서만 있을 때는 빈 span 안에 커서를 두어 이어서 입력되는 글에 크기가 적용되게 한다.
   */
  const applyFontSizePx = (px: string) => {
    const el = editorRef.current;
    if (!el) return;
    restoreSavedSelection();
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;

    if (range.collapsed) {
      const z = document.createTextNode("\u200b");
      span.appendChild(z);
      range.insertNode(span);
      const nr = document.createRange();
      nr.setStart(z, 1);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    } else {
      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const nr = document.createRange();
      nr.selectNodeContents(span);
      nr.collapse(false);
      sel.addRange(nr);
    }
    savedSelectionRef.current = null;
    if (editorRef.current) lastSyncedRef.current = editorRef.current.innerHTML;
    emitHtml();
  };

  /** 글꼴 — execCommand fontName(선택 영역 또는 이어서 입력에 브라우저가 적용). */
  const applyFontFamily = (name: string) => {
    const el = editorRef.current;
    if (!el) return;
    restoreSavedSelection();
    el.focus();
    document.execCommand("fontName", false, name);
    savedSelectionRef.current = null;
    if (editorRef.current) lastSyncedRef.current = editorRef.current.innerHTML;
    emitHtml();
  };

  const insertLink = () => {
    focusEditor();
    const url = window.prompt("링크 URL 을 입력하세요.", "https://");
    if (!url?.trim()) return;
    document.execCommand("createLink", false, url.trim());
    emitHtml();
  };

  const insertChar = (ch: string) => {
    focusEditor();
    document.execCommand("insertText", false, ch);
    setShowSpecial(false);
    emitHtml();
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="본문 서식"
        onMouseDownCapture={(e) => {
          if ((e.target as HTMLElement).closest("select")) {
            captureSelectionFromEditor();
          }
        }}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) {
            e.preventDefault();
          }
        }}
      >
        <select
          className={`${styles.toolbarSelect} ${styles.toolbarSelectFont}`}
          aria-label="글꼴"
          defaultValue="Maru Buri"
          title="적용할 글자를 드래그한 뒤 선택하세요"
          onChange={(e) => applyFontFamily(e.target.value)}
        >
          <option value="Maru Buri">마루부리</option>
          <option value="Noto Sans KR">노토산스</option>
          <option value="Noto Serif KR">노토명조</option>
          <option value="Pretendard">프리텐다드</option>
          <option value="Georgia, serif">Georgia</option>
        </select>

        <select
          className={`${styles.toolbarSelect} ${styles.toolbarSelectSize}`}
          aria-label="글자 크기(px)"
          defaultValue="15"
          title="적용할 글자를 드래그한 뒤 선택하세요"
          onChange={(e) => applyFontSizePx(e.target.value)}
        >
          {["12", "13", "14", "15", "16", "18", "20", "24"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="굵게"
          onClick={() => run("bold")}
        >
          B
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="기울임"
          onClick={() => run("italic")}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="밑줄"
          onClick={() => run("underline")}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="취소선"
          onClick={() => run("strikeThrough")}
        >
          <s>T</s>
        </button>

        <span className={styles.colorWrap}>
          <button
            type="button"
            className={styles.toolbarBtn}
            aria-label="글자 색"
            title="글자 색"
            onClick={() => foreColorRef.current?.click()}
          >
            A
          </button>
          <input
            ref={foreColorRef}
            type="color"
            className={styles.colorInput}
            aria-hidden
            defaultValue="#2d2926"
            onChange={(e) => run("foreColor", e.target.value)}
          />
        </span>
        <span className={styles.colorWrap}>
          <button
            type="button"
            className={styles.toolbarBtn}
            aria-label="배경색(형광펜)"
            title="배경색"
            onClick={() => backColorRef.current?.click()}
          >
            ▢
          </button>
          <input
            ref={backColorRef}
            type="color"
            className={styles.colorInput}
            aria-hidden
            defaultValue="#fff59d"
            onChange={(e) => run("hiliteColor", e.target.value)}
          />
        </span>

        <span className={styles.toolbarDivider} aria-hidden />

        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="왼쪽 정렬"
          onClick={() => run("justifyLeft")}
        >
          ≡
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="가운데 정렬"
          onClick={() => run("justifyCenter")}
        >
          ≣
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="글머리 기호 목록"
          onClick={() => run("insertUnorderedList")}
        >
          •
        </button>

        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="위첨자"
          onClick={() => run("superscript")}
        >
          T¹
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="아래첨자"
          onClick={() => run("subscript")}
        >
          T₁
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="특수문자"
          onClick={() => setShowSpecial(true)}
        >
          ※
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          aria-label="링크"
          onClick={insertLink}
        >
          🔗
        </button>
      </div>

      <div
        ref={editorRef}
        id={id}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => {
          const el = editorRef.current;
          if (el) lastSyncedRef.current = el.innerHTML;
          emitHtml();
        }}
        onBlur={() => emitHtml()}
      />

      {showSpecial ? (
        <div
          className={styles.specialBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="특수문자 선택"
        >
          <div className={styles.specialPanel}>
            <p className={styles.specialTitle}>특수문자</p>
            <div className={styles.specialGrid}>
              {SPECIAL_CHARS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.specialCharBtn}
                  onClick={() => insertChar(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.specialClose}
              onClick={() => setShowSpecial(false)}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
