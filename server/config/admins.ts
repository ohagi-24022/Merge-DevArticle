/**
 * 管理者のユーザー ID（`users` テーブルの `id`）をここに列挙します。
 * 管理者を追加・削除するときはこの配列を編集し、デプロイしてください。
 *
 * ID の確認方法: アカウントページ URL のログイン後、DB の users.id、
 * または管理者画面の利用者一覧を参照。
 */
export const ADMIN_USER_IDS: readonly number[] = [
  1,3420020// 例: 1,
];

export function isAdminUserId(userId: number): boolean {
  return ADMIN_USER_IDS.includes(userId);
}
