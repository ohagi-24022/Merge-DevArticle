# サークル開発記録掲示板

React 19 + Tailwind 4 + Express + tRPC のフルスタック掲示板アプリです。**Fly.io** でホスティングし、**TiDB Serverless** をデータベースとして利用します。

## 機能

- 開発日記の投稿・編集・一覧
- GitHub OAuth ログイン
- AI による記事生成（Google Gemini）
- GitHub リポジトリ連携・差分分析

## ローカル開発

```bash
cp .env.example .env
# .env に TiDB Serverless の DATABASE_URL などを設定
pnpm install
pnpm db:push
pnpm dev
```

### TiDB Serverless の接続文字列

1. [TiDB Cloud](https://tidbcloud.com/) で Serverless クラスターを作成
2. **Connect** → **General** から `DATABASE_URL` をコピー
3. `.env` の `DATABASE_URL` に貼り付け（ホストに `tidbcloud.com` が含まれる場合、TLS は自動で有効）

## Fly.io へのデプロイ

```bash
# Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch          # 初回のみ（fly.toml / Dockerfile を利用）
fly secrets set DATABASE_URL="mysql://..." JWT_SECRET="..." GITHUB_CLIENT_ID="..." ...
fly deploy
```

GitHub OAuth App の **Authorization callback URL**:

```
https://<your-app>.fly.dev/api/oauth/callback
```

### 必須シークレット（`fly secrets set`）

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | TiDB Serverless 接続文字列 |
| `JWT_SECRET` | セッション署名用 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `OWNER_GITHUB_ID` | 管理者の GitHub 数値 ID |
| `GEMINI_API_KEY` | 記事生成（Gemini） |
| `S3_BUCKET` + AWS 認証情報 | ファイルストレージ（任意） |

一覧は `.env.example` を参照。

### マイグレーション

デプロイ時に `fly.toml` の `release_command` で `pnpm db:push` が実行されます。  
手動で実行する場合:

```bash
# ローカル（DATABASE_URL を TiDB に向ける）
pnpm db:push

# または Fly 上
fly ssh console -C "pnpm db:push"
```

### ヘルスチェック

`GET /api/health` → `{ "ok": true }`

### 定期実行

`references/fly-cron.md` を参照。

## 認証

- ログイン: `GET /api/oauth/login`
- コールバック: `GET /api/oauth/callback`

## ストレージ

S3 互換ストレージにアップロードし、`/api/storage/<key>` で署名付き URL にリダイレクトします。

## 主要ファイル

```
fly.toml             # Fly.io 設定
Dockerfile           # 本番イメージ
drizzle/schema.ts    # DB スキーマ
server/db.ts         # TiDB 接続（TLS 対応）
server/routers.ts    # tRPC API
```

## テスト

```bash
pnpm test
```
