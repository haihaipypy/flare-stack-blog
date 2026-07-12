import { Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Home, Menu, Search, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavOption, UserInfo } from "@/features/theme/contract/layouts";
import { categoriesQueryOptions } from "@/features/categories/queries";
import { m } from "@/paraglide/messages";
import { LanguageSwitcher } from "./language-switcher";

interface NavbarProps {
  navOptions: Array<NavOption>;
  onMenuClick: () => void;
  isLoading?: boolean;
  user?: UserInfo;
  bannerHeightVh: number;
}

const NAVBAR_HEIGHT_REM = 4.5;
const MAIN_OVERLAP_REM = 3.5;

export function Navbar({
  onMenuClick,
  user,
  navOptions,
  isLoading,
  bannerHeightVh,
}: NavbarProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [isHidden, setIsHidden] = useState(false);
  const { data: navCategories } = useQuery(categoriesQueryOptions);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate threshold based on banner height and layout
      const bannerHeightPx = window.innerHeight * (bannerHeightVh / 100);
      const navbarHeightPx = NAVBAR_HEIGHT_REM * 16;
      const mainOverlapPx = MAIN_OVERLAP_REM * 16;
      const extraPaddingPx = 16;

      const threshold =
        bannerHeightPx - navbarHeightPx - mainOverlapPx - extraPaddingPx;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      setIsHidden(scrollTop >= threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [bannerHeightVh]);

  return (
    <div
      id="fuwari-navbar-wrapper"
      className={`z-50 sticky top-0 transition-all duration-300 ease-in-out ${
        isHidden
          ? "-translate-y-16 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div
        id="fuwari-navbar"
        className="fuwari-onload-animation"
        style={{ animationDelay: "0ms" }}
      >
        <div className="fuwari-card-base overflow-visible! rounded-t-none! mx-auto flex items-center justify-between px-4 h-18 max-w-(--fuwari-page-width)">
          <Link
            to="/"
            className="fuwari-expand-animation rounded-lg h-13 px-5 font-bold active:scale-95 flex items-center"
          >
            <Home
              size={28}
              strokeWidth={1.5}
              className="text-(--fuwari-primary) mr-2 shrink-0"
            />
            <span className="text-(--fuwari-primary) text-base">
              {siteConfig.title}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navOptions.map((option) =>
              option.id === "categories" ? (
                <div key={option.id} className="relative group">
                  <Link
                    to={option.to}
                    className="fuwari-expand-animation rounded-lg h-11 font-bold px-5 active:scale-95 flex items-center gap-1 fuwari-text-75 hover:text-(--fuwari-primary)"
                    activeProps={{
                      className: "!text-[var(--fuwari-primary)]",
                    }}
                  >
                    {option.label}
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className="mt-0.5 transition-transform duration-200 group-hover:rotate-180"
                    />
                  </Link>
                  <div className="absolute left-0 top-full pt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="fuwari-card-base rounded-xl py-2 px-1 min-w-44 max-h-80 overflow-y-auto flex flex-col gap-0.5 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                      {(navCategories ?? []).map((cat) => (
                        <Link
                          key={cat.id}
                          to="/posts"
                          search={{ categoryName: cat.name }}
                          className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-sm fuwari-text-75 hover:bg-(--fuwari-btn-regular-bg) hover:text-(--fuwari-primary) whitespace-nowrap"
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs opacity-50">
                            {cat.postCount}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={option.id}
                  to={option.to}
                  className="fuwari-expand-animation rounded-lg h-11 font-bold px-5 active:scale-95 flex items-center fuwari-text-75 hover:text-(--fuwari-primary)"
                  activeProps={{
                    className: "!text-[var(--fuwari-primary)]",
                  }}
                >
                  {option.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              to="/search"
              className="hidden lg:flex items-center h-11 mr-2 rounded-lg bg-black/4 hover:bg-black/6 dark:bg-white/5 dark:hover:bg-white/10 transition-all active:scale-95 group w-52"
              aria-label={m.nav_search()}
            >
              <Search
                size={18}
                className="ml-3 transition-colors text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50"
                strokeWidth={1.25}
              />
              <span className="ml-2 text-black/50 dark:text-white/50 text-sm bg-transparent outline-none truncate">
                {m.nav_search()}
              </span>
            </Link>
            <Link
              to="/search"
              className="lg:hidden fuwari-expand-animation rounded-lg h-11 w-11 flex items-center justify-center active:scale-90 fuwari-text-75 hover:text-(--fuwari-primary)"
              aria-label={m.nav_search()}
            >
              <Search size={18} strokeWidth={1.25} />
            </Link>
            <ThemeToggle className="fuwari-expand-animation rounded-lg h-11 w-11 flex items-center justify-center active:scale-90 fuwari-text-75 hover:text-(--fuwari-primary) p-0! bg-transparent! [&_svg]:w-4.5! [&_svg]:h-4.5! [&_div]:w-auto! [&_div]:h-auto!" />
            <LanguageSwitcher className="fuwari-expand-animation rounded-lg h-11 w-11 flex items-center justify-center active:scale-90 fuwari-text-75 hover:text-(--fuwari-primary) p-0! bg-transparent! [&_svg]:w-4.5! [&_svg]:h-4.5!" />
            <div className="hidden md:flex items-center">
              {isLoading ? (
                <Skeleton className="w-9 h-9 rounded-lg" />
              ) : user ? (
                <Link
                  to="/profile"
                  className="fuwari-expand-animation rounded-lg h-11 w-11 flex items-center justify-center active:scale-90"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-(--fuwari-btn-regular-bg) flex items-center justify-center">
                      <UserIcon
                        size={18}
                        strokeWidth={1.25}
                        className="fuwari-text-50"
                      />
                    </div>
                  )}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="fuwari-expand-animation rounded-lg h-11 w-11 flex items-center justify-center active:scale-90 fuwari-text-75 hover:text-(--fuwari-primary)"
                  aria-label={m.nav_login()}
                >
                  <UserIcon size={18} strokeWidth={1.25} />
                </Link>
              )}
            </div>
            <button
              className="fuwari-expand-animation rounded-lg w-11 h-11 flex items-center justify-center active:scale-90 md:hidden fuwari-text-75 hover:text-(--fuwari-primary)"
              onClick={onMenuClick}
              aria-label={m.common_open_menu()}
              type="button"
            >
              <Menu size={18} strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
