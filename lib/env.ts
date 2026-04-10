const DEFAULT_THRESHOLD = 50000;

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasEnv(...names: string[]): boolean {
  return names.every((name) => Boolean(process.env[name]));
}

export function getHighValueThreshold(): number {
  const parsed = Number(process.env.HIGH_VALUE_THRESHOLD ?? DEFAULT_THRESHOLD);
  return Number.isFinite(parsed) ? parsed : DEFAULT_THRESHOLD;
}

export function isSupabaseConfigured(): boolean {
  return hasEnv("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
}

export function isRetailCrmConfigured(): boolean {
  return hasEnv("RETAILCRM_BASE_URL", "RETAILCRM_API_KEY", "RETAILCRM_SITE_CODE");
}

export function isTelegramConfigured(): boolean {
  return hasEnv("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID");
}
