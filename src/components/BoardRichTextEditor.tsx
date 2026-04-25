"use client";

import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import styles from "@/components/boardRichTextEditor.module.css";
import { uploadPostImage } from "@/lib/uploadPostImage";

const SPECIAL_CHARS = [
  "※", "★", "☆", "♥", "♡", "◆", "◇", "■", "□", "▲", "△", "▼", "▽",
  "→", "←", "↑", "↓", "·", "…", "‘", "’", "“", "”", "℃", "㎡",
  "①", "②", "③", "④", "⑤", "㈜", "℡",
];

export type BoardRichTextEditorHandle = {
  run: (command: string, value?: string) => void;
  applyFontSizePx: (px: string) => void;
  applyFontFamily: (name: string) => void;
  insertLink: () => void;
  insertImage: (dataUrl: string) => void;
  insertBlockquote: () => void;
  insertHr: () => void;
  insertEmoji: (emoji: string) => void;
  insertTable: () => void;
};

type Props = {
  value: string;
  onChange: (html: string) => void;
  id?: string;
  placeholder?: string;
  showToolbar?: boolean;
};

export const BoardRichTextEditor = forwardRef<BoardRichTextEditorHandle, Props>(
  function BoardRichTextEditor(
    { value, onChange, id, placeholder = "내용을 입력해 주세요", showToolbar = true },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const foreColorRef = useRef<HTMLInputElement>(null);
    const backColorRef = useRef<HTMLInputElement>(null);
    const [showSpecial, setShowSpecial] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const lastSyncedRef = useRef<string | null>(null);
    const savedSelectionRef = useRef<Range | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    useLayoutEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (lastSyncedRef.current === null) {
        el.innerHTML = value || "";
        lastSyncedRef.current = value;
        return;
      }
      if (value !== lastSyncedRef.current) {
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
        const z = document.createTextNode("​");
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

    const insertImage = (dataUrl: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const img = document.createElement("img");
      img.src = dataUrl;
      img.style.maxWidth = "100%";
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.collapse(false);
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        el.appendChild(img);
      }
      if (editorRef.current) lastSyncedRef.current = editorRef.current.innerHTML;
      emitHtml();
    };

    const insertBlockquote = () => {
      focusEditor();
      document.execCommand("formatBlock", false, "blockquote");
      emitHtml();
    };

    const insertHr = () => {
      focusEditor();
      document.execCommand("insertHorizontalRule");
      emitHtml();
    };

    const insertEmoji = (emoji: string) => {
      focusEditor();
      document.execCommand("insertText", false, emoji);
      emitHtml();
    };

    const insertTable = () => {
      focusEditor();
      const tableHtml = `
        <table>
          <tbody>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
          </tbody>
        </table><p><br></p>`;
      document.execCommand("insertHTML", false, tableHtml);
      emitHtml();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setIsUploading(true);
      try {
        const url = await uploadPostImage(file);
        if (url) insertImage(url);
      } finally {
        setIsUploading(false);
      }
    };

    const insertChar = (ch: string) => {
      focusEditor();
      document.execCommand("insertText", false, ch);
      setShowSpecial(false);
      emitHtml();
    };

    useImperativeHandle(ref, () => ({
      run,
      applyFontSizePx,
      applyFontFamily,
      insertLink,
      insertImage,
      insertBlockquote,
      insertHr,
      insertEmoji,
      insertTable,
    }));

    return (
      <div className={styles.wrap}>
        {showToolbar && (
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
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button type="button" className={styles.toolbarBtn} aria-label="굵게" onClick={() => run("bold")}>B</button>
            <button type="button" className={styles.toolbarBtn} aria-label="기울임" onClick={() => run("italic")}><i>I</i></button>
            <button type="button" className={styles.toolbarBtn} aria-label="밑줄" onClick={() => run("underline")}><u>U</u></button>
            <button type="button" className={styles.toolbarBtn} aria-label="취소선" onClick={() => run("strikeThrough")}><s>T</s></button>

            <span className={styles.colorWrap}>
              <button type="button" className={styles.toolbarBtn} aria-label="글자 색" onClick={() => foreColorRef.current?.click()}>A</button>
              <input ref={foreColorRef} type="color" className={styles.colorInput} aria-hidden defaultValue="#2d2926" onChange={(e) => run("foreColor", e.target.value)} />
            </span>
            <span className={styles.colorWrap}>
              <button type="button" className={styles.toolbarBtn} aria-label="배경색(형광펜)" onClick={() => backColorRef.current?.click()}>▢</button>
              <input ref={backColorRef} type="color" className={styles.colorInput} aria-hidden defaultValue="#fff59d" onChange={(e) => run("hiliteColor", e.target.value)} />
            </span>

            <span className={styles.toolbarDivider} aria-hidden />

            <button type="button" className={styles.toolbarBtn} aria-label="왼쪽 정렬" onClick={() => run("justifyLeft")}>≡</button>
            <button type="button" className={styles.toolbarBtn} aria-label="가운데 정렬" onClick={() => run("justifyCenter")}>≣</button>
            <button type="button" className={styles.toolbarBtn} aria-label="글머리 기호 목록" onClick={() => run("insertUnorderedList")}>•</button>

            <button type="button" className={styles.toolbarBtn} aria-label="인용구" onClick={insertBlockquote}>❝</button>
            <button type="button" className={styles.toolbarBtn} aria-label="구분선" onClick={insertHr}>—</button>
            <button type="button" className={styles.toolbarBtn} aria-label="표 삽입" onClick={insertTable}>⊞</button>
            <button type="button" className={styles.toolbarBtn} aria-label="위첨자" onClick={() => run("superscript")}>T¹</button>
            <button type="button" className={styles.toolbarBtn} aria-label="아래첨자" onClick={() => run("subscript")}>T₁</button>
            <button type="button" className={styles.toolbarBtn} aria-label="특수문자" onClick={() => setShowSpecial(true)}>※</button>
            <button type="button" className={styles.toolbarBtn} aria-label="링크" onClick={insertLink}>🔗</button>
            <span className={styles.toolbarDivider} aria-hidden />
            <button
              type="button"
              className={styles.toolbarBtn}
              aria-label="이미지 삽입"
              disabled={isUploading}
              onClick={() => imageInputRef.current?.click()}
            >
              {isUploading ? "…" : "🖼"}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className={styles.imageInput}
              onChange={handleImageUpload}
            />
          </div>
        )}

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

        {showSpecial && (
          <div className={styles.specialBackdrop} role="dialog" aria-modal="true" aria-label="특수문자 선택">
            <div className={styles.specialPanel}>
              <p className={styles.specialTitle}>특수문자</p>
              <div className={styles.specialGrid}>
                {SPECIAL_CHARS.map((c) => (
                  <button key={c} type="button" className={styles.specialCharBtn} onClick={() => insertChar(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <button type="button" className={styles.specialClose} onClick={() => setShowSpecial(false)}>
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
