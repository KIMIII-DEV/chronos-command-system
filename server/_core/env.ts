/**
 * CHRONOS OSS - ENVIRONMENT CONFIGURATION
 * Updated for Cloudflare Pages compatibility (no global process.env).
 */

// Helper to safely access environment variables in both Node and Edge
const getEnv = (key: string, defaultValue: string = ""): string => {
  // @ts-ignore - process might not be defined in Edge
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // For Cloudflare Pages, variables are often injected or need to be accessed via context
  // But for static build-time or global vars, we use this fallback
  return defaultValue;
};

export const ENV = {
  appId: getEnv("VITE_APP_ID"),
  cookieSecret: getEnv("JWT_SECRET"),
  databaseUrl: getEnv("DATABASE_URL"),
  oAuthServerUrl: getEnv("OAUTH_SERVER_URL"),
  ownerOpenId: getEnv("OWNER_OPEN_ID"),
  isProduction: getEnv("NODE_ENV") === "production",
  forgeApiUrl: getEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: getEnv("BUILT_IN_FORGE_API_KEY"),
  // Supabase OSS AI Stack
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabaseAnonKey: getEnv("SUPABASE_ANON_KEY"),
};

export const env = ENV;
