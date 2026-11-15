import { useEffect, useRef, useState } from "react";
import { isPostSaveConflictError } from "../conflict";
import type { PostEditorData, PostSaveOptions, SaveStatus } from "../types";

interface UseAutoSaveOptions {
  post: PostEditorData;
  onSave: (data: PostEditorData, options?: PostSaveOptions) => Promise<void>;
  /** 检测到别处改过这篇文章时调用，此时自动保存会暂停，等用户决定 */
  onConflict?: (currentUpdatedAt: number | null) => void;
  debounceMs?: number;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  setError: (error: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
  isDirty: boolean;
  markSaved: (post: PostEditorData) => void;
}

export function useAutoSave({
  post,
  onSave,
  onConflict,
  debounceMs = 1500,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("SYNCED");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFirstMount = useRef(true);
  const isMounted = useRef(false);
  const isSaving = useRef(false);
  // 冲突未解决前不再自动重试，否则每次敲字都会再打一次请求
  const isPaused = useRef(false);
  const latestPostRef = useRef(post);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track last-saved snapshot (shallow)
  const lastSavedSnapshot = useRef<{
    title: string;
    summary: string;
    slug: string;
    status: string;
    readTimeInMinutes: number;
    publishedAt: number | null;
    pinnedAt: number | null;
    tagIds: string; // Serialize for easy comparison
    contentRef: PostEditorData["contentJson"];
  } | null>(null);
  // Store onSave in ref to avoid effect re-running when onSave reference changes
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onConflictRef = useRef(onConflict);
  onConflictRef.current = onConflict;

  const toComparable = (p: PostEditorData) => ({
    title: p.title,
    summary: p.summary,
    slug: p.slug,
    status: p.status,
    readTimeInMinutes: p.readTimeInMinutes,
    publishedAt: p.publishedAt ? p.publishedAt.valueOf() : null,
    pinnedAt: p.pinnedAt ? p.pinnedAt.valueOf() : null,
    tagIds: [...p.tagIds].sort().join(","),
    contentRef: p.contentJson,
  });

  const isDirty = (curr: ReturnType<typeof toComparable>) => {
    const prev = lastSavedSnapshot.current;
    if (!prev) return true;
    return (
      prev.title !== curr.title ||
      prev.summary !== curr.summary ||
      prev.slug !== curr.slug ||
      prev.status !== curr.status ||
      prev.readTimeInMinutes !== curr.readTimeInMinutes ||
      prev.publishedAt !== curr.publishedAt ||
      prev.pinnedAt !== curr.pinnedAt ||
      prev.tagIds !== curr.tagIds ||
      prev.contentRef !== curr.contentRef
    );
  };

  const markSaved = (savedPost: PostEditorData) => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    latestPostRef.current = savedPost;
    lastSavedSnapshot.current = toComparable(savedPost);
    isPaused.current = false;
    setError(null);
    setSaveStatus("SYNCED");
    setLastSaved(new Date());
  };

  // Track mount / unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  // Auto-save effect - always enabled
  useEffect(() => {
    latestPostRef.current = post;
    const current = toComparable(post);

    if (isFirstMount.current) {
      isFirstMount.current = false;
      lastSavedSnapshot.current = current;
      return;
    }

    if (!isDirty(current)) {
      setSaveStatus("SYNCED");
      return;
    }

    // 冲突未解决时保持 CONFLICT 状态，不要显示成「保存中」
    if (isPaused.current) {
      setSaveStatus("CONFLICT");
      return;
    }

    setSaveStatus("SAVING");

    const attemptSave = async () => {
      if (isSaving.current || isPaused.current) return;
      isSaving.current = true;

      try {
        setError(null);
        const latestPost = latestPostRef.current;
        await onSaveRef.current(latestPost);
        const latestComparable = toComparable(latestPost);
        lastSavedSnapshot.current = latestComparable;
        if (!isMounted.current) return;
        setLastSaved(new Date());

        // After saving, if new changes arrived during the request, schedule another save (debounced)
        const stillDirty = isDirty(toComparable(latestPostRef.current));
        if (stillDirty) {
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
          }
          retryTimerRef.current = setTimeout(() => {
            if (!isMounted.current) return;
            // respect debounce and avoid overlapping saves
            attemptSave();
          }, debounceMs);
          setSaveStatus("SAVING");
        } else {
          setSaveStatus("SYNCED");
        }
      } catch (err) {
        if (isPostSaveConflictError(err)) {
          // 别处改过：暂停自动保存，交给 UI 让用户选择覆盖还是丢弃
          isPaused.current = true;
          if (isMounted.current) {
            setSaveStatus("CONFLICT");
            onConflictRef.current?.(err.currentUpdatedAt);
          }
          return;
        }
        console.error("Auto-save failed:", err);
        setSaveStatus("ERROR");
        setError("AUTO_SAVE_FAILED");
      } finally {
        isSaving.current = false;
      }
    };

    const timer = setTimeout(() => {
      void attemptSave();
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [post, debounceMs]);

  return {
    saveStatus,
    lastSaved,
    error,
    setError,
    setSaveStatus,
    isDirty: isDirty(toComparable(post)),
    markSaved,
  };
}
