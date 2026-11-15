/**
 * 保存时发现服务端 updatedAt 已经变了（别的窗口/设备改过这篇文章）。
 * 由编辑页抛出，自动保存 hook 捕获后转成 CONFLICT 状态，不会静默覆盖。
 */
export class PostSaveConflictError extends Error {
  readonly currentUpdatedAt: number | null;

  constructor(currentUpdatedAt?: number | null) {
    super("POST_SAVE_CONFLICT");
    this.name = "PostSaveConflictError";
    this.currentUpdatedAt = currentUpdatedAt ?? null;
  }
}

export function isPostSaveConflictError(
  error: unknown,
): error is PostSaveConflictError {
  return error instanceof PostSaveConflictError;
}
