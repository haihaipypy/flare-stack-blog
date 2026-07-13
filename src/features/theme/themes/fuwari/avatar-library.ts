export type AvatarCategory = "person" | "robot" | "animal";

export interface AvatarOption {
  /** Public path served from /avatars/* */
  src: string;
  /** Display label (zh) */
  label: string;
  category: AvatarCategory;
}

/**
 * Preset avatar library shown in the user profile "basic settings" page.
 * Images are static SVGs generated with DiceBear (MIT, CC0-friendly) and
 * stored under public/avatars/. Selecting one writes its public path into
 * the user's `image` field — no external dependency at runtime.
 */
export const avatarLibrary: AvatarOption[] = [
  // 人物（卡通，男女混合）
  { src: "/avatars/person-1.svg", label: "男生 1", category: "person" },
  { src: "/avatars/person-2.svg", label: "女生 1", category: "person" },
  { src: "/avatars/person-3.svg", label: "男生 2", category: "person" },
  { src: "/avatars/person-4.svg", label: "女生 2", category: "person" },
  { src: "/avatars/person-5.svg", label: "男生 3", category: "person" },
  { src: "/avatars/person-6.svg", label: "女生 3", category: "person" },
  // 机器人
  { src: "/avatars/robot-1.svg", label: "机器人 1", category: "robot" },
  { src: "/avatars/robot-2.svg", label: "机器人 2", category: "robot" },
  { src: "/avatars/robot-3.svg", label: "机器人 3", category: "robot" },
  // 动物（emoji）
  { src: "/avatars/animal-cat.svg", label: "猫咪", category: "animal" },
  { src: "/avatars/animal-dog.svg", label: "小狗", category: "animal" },
  { src: "/avatars/animal-fox.svg", label: "狐狸", category: "animal" },
  { src: "/avatars/animal-panda.svg", label: "熊猫", category: "animal" },
  { src: "/avatars/animal-rabbit.svg", label: "兔子", category: "animal" },
  { src: "/avatars/animal-tiger.svg", label: "老虎", category: "animal" },
];
