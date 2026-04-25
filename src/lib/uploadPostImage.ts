import { supabase } from "./supabase";
import { imageFileToJpegDataUrl } from "./boardSinglePhotoImage";

/**
 * 이미지 파일을 JPEG로 압축 후 Supabase Storage post-images 버킷에 업로드.
 * 성공 시 public URL 반환, 실패 시 null 반환.
 */
export async function uploadPostImage(file: File): Promise<string | null> {
  const dataUrl = await imageFileToJpegDataUrl(file);
  if (!dataUrl) return null;

  // data URL → Blob 변환
  const fetchRes = await fetch(dataUrl);
  const blob = await fetchRes.blob();

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { data, error } = await supabase.storage
    .from("post-images")
    .upload(filename, blob, { contentType: "image/jpeg" });

  if (error || !data) {
    window.alert("이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.");
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
