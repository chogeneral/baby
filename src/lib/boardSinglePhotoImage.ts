/**
 * 게시판 본문 하단 첨부 사진용 — canvas 로 JPEG data URL 생성(용량·해상도 제한).
 * ‘사진’ 섹션에서만 사용한다(다중 첨부 시 파일마다 호출).
 */

const IMAGE_MAX_EDGE_PX = 1920;
const IMAGE_DATA_URL_MAX_LEN = 2_800_000;

export async function imageFileToJpegDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  const url = URL.createObjectURL(file);
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file).catch(() => null);
    let width: number;
    let height: number;
    let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

    if (bitmap) {
      const b = bitmap;
      width = b.width;
      height = b.height;
      draw = (ctx, w, h) => ctx.drawImage(b, 0, 0, w, h);
    } else {
      const img = await new Promise<HTMLImageElement | null>((resolve) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => resolve(null);
        el.src = url;
      });
      if (!img) return null;
      width = img.naturalWidth;
      height = img.naturalHeight;
      draw = (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h);
    }

    let w = width;
    let h = height;
    const edge = Math.max(w, h);
    if (edge > IMAGE_MAX_EDGE_PX) {
      const scale = IMAGE_MAX_EDGE_PX / edge;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    draw(ctx, canvas.width, canvas.height);

    let quality = 0.9;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > IMAGE_DATA_URL_MAX_LEN && quality > 0.45) {
      quality -= 0.07;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > IMAGE_DATA_URL_MAX_LEN) {
      window.alert(
        "이미지가 너무 커서 넣을 수 없어요. 더 작은 사진을 선택하거나 해상도를 낮춰 주세요.",
      );
      return null;
    }
    return dataUrl;
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(url);
  }
}
