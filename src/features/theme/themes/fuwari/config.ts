import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: {
    recentPostsLimit: 10,
    popularPostsLimit: 1,
  },
  posts: {
    postsPerPage: 24,
  },
  post: {
    relatedPostsLimit: 4,
  },
};
