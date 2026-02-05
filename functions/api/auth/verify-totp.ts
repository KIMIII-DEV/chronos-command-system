import { verifyTOTP } from '../../../server/auth';
import { createSession } from '../../../server/session';
import { TOTPSchema } from '../../../server/_core/validation';

/**
 * CHRONOS OSS - TOTP VERIFICATION ENDPOINT
 */

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    // 1. Validate Input
    const validated = TOTPSchema.parse(body);
    
    // 2. Fetch User from Supabase (Internal call or via service)
    // For MVP, we assume user lookup and verification
    // In production, fetch user.id by email from Supabase
    const userId = 1; // Placeholder for actual lookup
    
    // 3. Verify TOTP
    const isValid = await verifyTOTP(userId, validated.code);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid TOTP code' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Create Session
    const token = await createSession(userId, validated.email);
    
    // 5. Return Token & Set Cookie (A1.2, Phase 1.2)
    return new Response(JSON.stringify({ token, success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7200`
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
