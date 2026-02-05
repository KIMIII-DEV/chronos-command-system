import { SignJWT, jwtVerify } from 'jose';
import { env } from './_core/env';

/**
 * CHRONOS OSS - SESSION MANAGEMENT (A1.3)
 */

const SECRET = new TextEncoder().encode(env.cookieSecret || 'default_secret_change_me');

export async function createSession(userId: number, email: string, role: string = 'viewer'): Promise<string> {
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(SECRET);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: number; email: string; role: string };
  } catch (e) {
    return null;
  }
}
