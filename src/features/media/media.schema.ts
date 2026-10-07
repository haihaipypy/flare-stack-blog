import { z } from "zod";
import type { Messages } from "@/lib/i18n";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// SVG 也放行：图表、流程图、Logo 天然就是 SVG，栅格化成 PNG 会丢掉它唯一的优势。
// 只有站长本人能上传，所以"托管 SVG 有 XSS 风险"这条常见理由在这里不成立。
// AVIF 不放行：Cloudflare 仅在 Enterprise 计划下接受 AVIF 作为变换输入，永远无法缩放。
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const UploadMediaInputSchema = z.instanceof(FormData);

export function parseUploadMediaInput(formData: FormData, messages: Messages) {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    throw new Error(messages.media_validation_file_required());
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(messages.media_validation_file_too_large());
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(messages.media_validation_file_invalid_type());
  }

  return { file };
}

export const MediaKeyInputSchema = z.object({
  key: z.string(),
});

export function assertMediaKey(key: string, messages: Messages) {
  const trimmedKey = key.trim();
  if (trimmedKey.length === 0) {
    throw new Error(messages.media_validation_key_required());
  }

  return trimmedKey;
}

export const UpdateMediaNameInputSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});

export const GetMediaListInputSchema = z.object({
  cursor: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  unusedOnly: z.boolean().optional(),
});

export type UpdateMediaNameInput = z.infer<typeof UpdateMediaNameInputSchema>;
export type GetMediaListInput = z.infer<typeof GetMediaListInputSchema>;
