export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Set to "true" to force TLS (auto-enabled when host contains tidbcloud.com). */
  databaseSsl: process.env.DATABASE_SSL === "true",
  isProduction: process.env.NODE_ENV === "production",

  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  ownerGithubId: process.env.OWNER_GITHUB_ID ?? "",

  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.AWS_REGION ?? "us-east-1",
  s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  notifyWebhookUrl: process.env.NOTIFY_WEBHOOK_URL ?? "",

  cronSecret: process.env.CRON_SECRET ?? "",
};
