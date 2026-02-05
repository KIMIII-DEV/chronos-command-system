import { CrepeMonitor } from './monitor-bridge';
import { EclipseReasoner } from './reasoning-bridge';
import { JenaMemory } from './mem-bridge';
import { createClient } from '@supabase/supabase-js';
import { ChronosQuerySchema, sanitizeInput } from '../_core/validation';

/**
 * CHRONOS OSS ORCHESTRATOR (A3.4, A5.1)
 * Integrates all OSS engines with strict security gates and persistent memory.
 */

export interface OrchestratorResponse {
  output: string;
  requiresApproval: boolean;
  actionId: string;
  risk: 'low' | 'medium' | 'high';
  input: string;
}

export class ChronosOrchestrator {
  private monitor: CrepeMonitor;
  private reasoner: EclipseReasoner;
  private memory: JenaMemory;
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string, userId: number) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.monitor = new CrepeMonitor();
    this.reasoner = new EclipseReasoner();
    this.memory = new JenaMemory();
    this.memory.setClient(this.supabase);
  }

  async process(req: { input: string, userId: number, context?: any }): Promise<OrchestratorResponse> {
    // 1. Validation & Sanitization (A6.4)
    const validated = ChronosQuerySchema.parse(req);
    const safeInput = sanitizeInput(validated.prompt);

    // 2. Rate Limiting (A6.3)
    const withinLimit = await this.monitor.checkRateLimit(req.userId.toString(), this.supabase);
    if (!withinLimit) {
      throw new Error("RATE_LIMIT_EXCEEDED: Maximum requests per minute reached.");
    }

    // 3. Monitor (Crepe) - Deterministic Risk Detection
    const risk = await this.monitor.analyze(safeInput);

    // 4. Memory (Jena) - Fetch Persistent Context
    const context = await this.memory.query(safeInput);

    // 5. Reasoner (ECLiPSe) - Constraint-based Planning
    const plan = await this.reasoner.plan(safeInput, risk);

    const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 6. Audit Logging (A7.2)
    await this.supabase.from('audit_logs').insert({
      id: actionId,
      user_id: req.userId,
      action: 'process_request',
      input: safeInput,
      output: plan.description,
      risk: risk,
      metadata: { context, verified: plan.verified }
    });

    return {
      output: plan.description,
      requiresApproval: risk === 'high' || risk === 'medium' || !plan.verified,
      actionId: actionId,
      risk: risk,
      input: safeInput
    };
  }
}
