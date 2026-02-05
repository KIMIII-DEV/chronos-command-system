import { generateTOTP, verifyTOTP as verifyEpicTOTP } from '@epic-web/totp';
import { getSupabase } from './db';

/**
 * CHRONOS OSS - AUTHENTICATION (A1.2)
 * Updated to be Edge-compatible using @epic-web/totp (Web Crypto API).
 */

export async function verifyTOTP(userId: number, code: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('users')
    .select('totp_secret')
    .eq('id', userId)
    .single();

  if (error || !data?.totp_secret) return false;

  // verifyEpicTOTP returns null if invalid, or the result if valid
  const result = await verifyEpicTOTP({
    otp: code,
    secret: data.totp_secret,
  });

  return result !== null;
}

export async function generateTOTPSecret(): Promise<string> {
  // @epic-web/totp generates secrets compatible with standard TOTP
  const { secret } = generateTOTP();
  return secret;
}

export function getTOTPUri(email: string, secret: string): string {
  // Manual URI construction as @epic-web/totp focuses on generation/verification
  const issuer = 'CHRONOS-COMMAND';
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
