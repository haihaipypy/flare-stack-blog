-- Categories table
CREATE TABLE `categories` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);

-- Post-Categories junction table (many-to-many)
CREATE TABLE `post_categories` (
  `post_id` integer NOT NULL,
  `category_id` integer NOT NULL,
  PRIMARY KEY(`post_id`, `category_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `post_categories_category_idx` ON `post_categories` (`category_id`);
