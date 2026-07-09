import type { PostItem } from "@/features/posts/schema/posts.schema";
import type { TagWithCount } from "@/features/tags/tags.schema";
import type { CategoryWithCount } from "@/features/categories/categories.schema";

export interface PostsPageProps {
  posts: Array<PostItem>;
  tags: Array<Omit<TagWithCount, "createdAt">>;
  categories: Array<Omit<CategoryWithCount, "createdAt">>;
  selectedTag?: string;
  selectedCategory?: string;
  onTagClick: (tag: string) => void;
  onCategoryClick: (category: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}
