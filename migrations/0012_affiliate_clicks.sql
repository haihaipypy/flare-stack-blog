-- 推广短链点击流水（/go/:slug）
-- 手写迁移：drizzle-kit 的 meta 快照缺少 0011_category_feature 的记录，
-- 直接 generate 会把 categories / post_categories 当成新表重复建，故此处手写。
CREATE TABLE `affiliate_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`post_slug` text,
	`country` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ac_slug_created` ON `affiliate_clicks` (`slug`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_ac_created` ON `affiliate_clicks` (`created_at`);
