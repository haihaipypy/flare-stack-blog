import type { JSONContent } from "@tiptap/react";
import type { PostStatus } from "@/lib/db/schema";

export interface PostEditorData {
  title: string;
  summary: string;
  slug: string;
  status: PostStatus;
  readTimeInMinutes: number;
  contentJson: JSONContent | null;
  publishedAt: Date | null;
  pinnedAt: Date | null;
  tagIds: Array<number>;
  categoryIds: Array<number>;
  isSynced: boolean;
  hasPublicCache: boolean;
}

export interface PostSaveOptions {
  /** 跳过乐观锁，直接用本地内容覆盖服务端（用户已在冲突提示里确认） */
  force?: boolean;
}

export interface PostEditorProps {
  initialData: PostEditorData & { id: number };
  onSave: (data: PostEditorData, options?: PostSaveOptions) => Promise<void>;
}

export type SaveStatus = "SYNCED" | "SAVING" | "PENDING" | "ERROR" | "CONFLICT";

export const defaultPostData: PostEditorData = {
  title: "",
  summary: "",
  slug: "",
  status: "draft",
  readTimeInMinutes: 1,
  contentJson: null,
  publishedAt: null,
  pinnedAt: null,
  tagIds: [],
  categoryIds: [],
  isSynced: true,
  hasPublicCache: false,
};
