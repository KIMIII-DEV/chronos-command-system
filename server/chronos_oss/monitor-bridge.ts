/**
 * CHRONOS OSS - CREPE MONITOR (A8.1)
 * Deterministic pattern detection using Datalog-inspired logic.
 */

export class CrepeMonitor {
  // Predicates for risk detection
  private destructivePatterns = [
    'rm -rf', 'drop table', 'delete from', 'truncate', 'format', 'shutdown'
  ];

  private modifyPatterns = [
    'update', 'alter', 'modify', 'chmod', 'chown', 'git push'
  ];

  async analyze(input: string): Promise<'low' | 'medium' | 'high'> {
    const lowerInput = input.toLowerCase();

    // 1. Check for high-risk destructive patterns
    if (this.destructivePatterns.some(p => lowerInput.includes(p))) {
      console.log(`[Crepe] HIGH RISK detected: ${input}`);
      return 'high';
    }

    // 2. Check for medium-risk modification patterns
    if (this.modifyPatterns.some(p => lowerInput.includes(p))) {
      console.log(`[Crepe] MEDIUM RISK detected: ${input}`);
      return 'medium';
    }

    // 3. Default to low risk
    return 'low';
  }

  /**
   * Rate Limiting Enforcement (A6.3)
   */
  async checkRateLimit(identifier: string, supabase: any): Promise<boolean> {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('hits, last_hit')
      .eq('identifier', identifier)
      .single();

    const now = new Date();
    const limit = 100; // 100 requests per window
    const windowMs = 60 * 1000; // 1 minute window

    if (error || !data) {
      await supabase.from('rate_limits').upsert({ identifier, hits: 1, last_hit: now });
      return true;
    }

    const lastHit = new Date(data.last_hit);
    if (now.getTime() - lastHit.getTime() > windowMs) {
      await supabase.from('rate_limits').update({ hits: 1, last_hit: now }).eq('identifier', identifier);
      return true;
    }

    if (data.hits >= limit) {
      return false;
    }

    await supabase.from('rate_limits').update({ hits: data.hits + 1, last_hit: now }).eq('identifier', identifier);
    return true;
  }
}
