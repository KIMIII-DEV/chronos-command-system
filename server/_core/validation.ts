import { z } from 'zod';

/**
 * CHRONOS OSS - INPUT VALIDATION (A6.4)
 * Enforces strict schemas for all incoming data.
 */

export const ChronosQuerySchema = z.object({
  prompt: z.string().min(1).max(2000).trim(),
  userId: z.number().int().positive(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const TOTPSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  email: z.string().email(),
});

/**
 * Basic Sanitization to prevent XSS and Injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/[<>]/g, "")
    .trim();
}
