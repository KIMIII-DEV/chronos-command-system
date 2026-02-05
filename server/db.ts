import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './_core/env';

let _supabase: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 */
export function getSupabase() {
  if (!_supabase && env.supabaseUrl && env.supabaseAnonKey) {
    try {
      _supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
    } catch (error) {
      console.warn("[Supabase] Failed to connect:", error);
      _supabase = null;
    }
  }
  return _supabase;
}

/**
 * Get audit logs from Supabase
 */
export async function getAuditLogs(limit: number = 50) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] Failed to fetch audit logs:", error);
    return [];
  }

  return data;
}

/**
 * Get self-improvement history
 */
export async function getImprovementLogs(limit: number = 20) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('self_improvement_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] Failed to fetch improvement logs:", error);
    return [];
  }

  return data;
}

// Legacy Drizzle support (if still needed for other tables)
export async function getDb() {
  return null; // Migrated to Supabase
}
