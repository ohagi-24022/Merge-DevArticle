export type OAuthUserInfo = {
  openId: string;
  name: string;
  email?: string | null;
  loginMethod: string;
  avatarUrl?: string | null;
};
