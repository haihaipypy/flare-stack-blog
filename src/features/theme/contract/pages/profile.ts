import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

export interface ProfileUserInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

export interface ProfileSchema {
  name: string;
  image?: string;
}

export interface ProfileFormData {
  register: UseFormRegister<ProfileSchema>;
  errors: FieldErrors<ProfileSchema>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  watch: UseFormWatch<ProfileSchema>;
  setValue: UseFormSetValue<ProfileSchema>;
}

export interface PasswordSchema {
  /** 仅在 `change` 模式下必填；`set` 模式（如 GitHub 注册的账号）没有密码可填 */
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordFormMode = "set" | "change";

export interface PasswordFormData {
  mode: PasswordFormMode;
  register: UseFormRegister<PasswordSchema>;
  errors: FieldErrors<PasswordSchema>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

export interface NotificationData {
  available: boolean;
  enabled: boolean | undefined;
  isLoading: boolean;
  isPending: boolean;
  toggle: () => void;
}

export interface ProfilePageProps {
  user: ProfileUserInfo;
  profileForm: ProfileFormData;
  passwordForm: PasswordFormData | null;
  notification: NotificationData;
  logout: () => Promise<void>;
}
