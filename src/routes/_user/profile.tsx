import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { userHasPasswordFn } from "@/features/auth/api/auth.api";
import {
  useLogout,
  useNotificationToggle,
  usePasswordForm,
  useProfileForm,
} from "@/features/auth/hooks";
import { AUTH_KEYS } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_user/profile")({
  ssr: false,
  component: ProfilePage,
  loader: async () => {
    return {
      title: m.profile_title(),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const profileForm = useProfileForm({ user });
  // hasPassword 决定密码卡片是「设置」还是「修改」：
  // 用 GitHub 注册的账号在 account 表里没有 credential 记录，只能设置新密码。
  const { data: hasPassword } = useQuery({
    queryKey: AUTH_KEYS.hasPassword(user?.id),
    queryFn: () => userHasPasswordFn(),
    enabled: !!user,
  });
  const passwordForm = usePasswordForm({ hasPassword: hasPassword === true });
  const notification = useNotificationToggle(user?.id);
  const { logout } = useLogout();

  if (!user) return null;

  return (
    <theme.ProfilePage
      user={user}
      profileForm={profileForm}
      passwordForm={hasPassword === undefined ? null : passwordForm}
      notification={notification}
      logout={logout}
    />
  );
}
