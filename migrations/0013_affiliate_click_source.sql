-- 区分「本站文章里的广告位」与「站外嵌入悬浮卡」的点击来源
-- 手写迁移（同 0012：drizzle-kit 快照缺 0011，generate 会重复建表）
ALTER TABLE `affiliate_clicks` ADD `source` text;
--> statement-breakpoint
CREATE INDEX `idx_ac_source_created` ON `affiliate_clicks` (`source`,`created_at`);
