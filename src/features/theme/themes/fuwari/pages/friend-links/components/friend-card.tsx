import { ExternalLink, Globe } from "lucide-react";
import {
  avatarSeedForFriendLink,
  buildAvatarUrl,
} from "@/features/avatar/avatar.url";
import type { FriendLinkWithUser } from "@/features/friend-links/friend-links.schema";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface FriendCardProps {
  link: Omit<FriendLinkWithUser, "createdAt" | "updatedAt">;
  className?: string;
  style?: React.CSSProperties;
}

export function FriendCard({ link, className, style }: FriendCardProps) {
  // 没有站点 logo 时不再显示一个灰地球，而是按域名生成一张稳定的头像
  const avatarUrl =
    link.logoUrl ||
    link.user?.image ||
    buildAvatarUrl(avatarSeedForFriendLink(link));
  const description = link.description || m.friend_links_unknown_site();

  return (
    <a
      href={link.siteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fuwari-card-base block relative p-4 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg group active:scale-[0.98]",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-4">
        {/* Avatar Area */}
        <div className="shrink-0 relative w-16 h-16 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5 transition-transform duration-300 group-hover:scale-105">
          <Globe className="absolute w-8 h-8 opacity-40" />
          <img
            src={avatarUrl}
            alt={link.siteName}
            className="relative w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            onError={(e) => {
              // 图片加载失败时隐藏它，露出底层的 Globe 占位图标
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Content Area */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-bold fuwari-text-90 truncate transition-colors duration-300 group-hover:text-(--fuwari-primary) flex items-center gap-1.5">
            {link.siteName}
            <ExternalLink className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-(--fuwari-primary)" />
          </h3>
          <p
            className="text-sm fuwari-text-50 mt-1 line-clamp-2 leading-relaxed"
            title={description}
          >
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}
