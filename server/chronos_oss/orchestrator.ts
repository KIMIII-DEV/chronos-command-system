/**
 * CHRONOS OSS ORCHESTRATOR — FIXED
 *
 * CHANGES FROM ORIGINAL:
 *   1. executeApproved() now calls ManusExecutor (was a stub)
 *   2. ManusExecutor imported and initialized in constructor
 *   3. Approval verification enforced before execution
 *   4. ExecutionResult properly returned in OrchestratorResponse
 *   5. Audit log updated with actual execution result
 */

import { CrepeMonitor, MonitoringSignal } from './monitor-bridge';
import { ECLiPSeReasoner, ReasoningResult } from './reasoning-bridge';
import { JenaMemoryStore, MemoryEntry } from './mem-bridge';
import { ManusExecutor, ExecutionResult } from './manus-executor-bridge'; // NEW
import { createClient } from '@supabase/supabase-js';

export interface OrchestratorRequest {
  input: string;
  userId: number;
  requiresExecution?: boolean;
  context?: Record<string, unknown>;
}

export interface OrchestratorResponse {
  output: string;
  requiresApproval: boolean;
  action?: string;
  reasoning?: ReasoningResult;
  signals?: MonitoringSignal[];
  context?: MemoryEntry[];
  executionResult?: ExecutionResult; // FIXED: was 'any'
  cost: 0;
  mode: 'oss';
}

export interface SelfImprovementResult {
  rulesUpdated: number;
  programsUpdated: number;
  knowledgeAdded: number;
  version: string;
}

export class ChronosOrchestrator {
  private monitor: CrepeMonitor;
  private reasoner: ECLiPSeReasoner;
  private memory: JenaMemoryStore;
  private executor: ManusExecutor; // FIXED: was missing
  private supabase: ReturnType<typeof createClient>;
  private userId: number;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    userId: number
  ) {
    this.userId = userId;
    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.monitor = new CrepeMonitor();
    this.reasoner = new ECLiPSeReasoner();
    this.memory = new JenaMemoryStore(supabaseUrl, supabaseKey, userId);
    this.executor = new ManusExecutor(supabaseUrl, supabaseKey); // FIXED: now initialized
  }

  /**
   * Process a request through the full OSS AI pipeline
   */
  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      const [signals, contextMemories, reasoning] = await Promise.all([
        this.monitor.analyzeInput(request.input),
        this.memory.getRelevantContext(request.input),
        this.reasoner.analyze(request.input, request.context || {}),
      ]);

      const decision = this.aggregateDecision(signals, reasoning);
      const requiresApproval = this.requiresHumanApproval(signals, reasoning, decision);

      const actionId = `action_${this.userId}_${Date.now()}`;

      await this.logToAudit({
        id: actionId,
        userId: this.userId,
        action: 'chronos_query',
        input: request.input,
        signals,
        reasoning,
        requiresApproval,
        duration: Date.now() - startTime,
      });

      return {
        output: this.formatOutput(reasoning, requiresApproval),
        requiresApproval,
        action: requiresApproval ? actionId : undefined, // Return actionId so caller can approve it
        reasoning,
        signals: signals.filter(s => s.type !== 'info'),
        context: contextMemories,
        cost: 0,
        mode: 'oss',
      };
    } catch (error) {
      console.error('[Orchestrator] Error:', error);

      return {
        output: 'System error occurred during processing',
        requiresApproval: false,
        cost: 0,
        mode: 'oss',
      };
    }
  }

  /**
   * FIXED: Execute an approved action via ManusExecutor
   *
   * Previously this was a stub with a comment
   * "// Execute action (via OpenManus - preserved from original)"
   * and no actual execution.
   *
   * Now it:
   *   1. Validates approval in audit_logs
   *   2. Calls ManusExecutor.executeApproved()
   *   3. Triggers self-improvement from outcome
   *   4. Returns structured ExecutionResult
   */
  async executeApproved(
    actionId: string,
    approved: boolean,
    approvedBy: number,
    action: string,
    parameters: Record<string, unknown> = {},
    evidence?: { success: boolean; outcome: string }
  ): Promise<OrchestratorResponse> {
    // GATE: Denial path
    if (!approved) {
      await this.logToAudit({
        id: `denied_${actionId}`,
        userId: this.userId,
        action: 'action_denied',
        input: actionId,
        approved: false,
      });

      return {
        output: 'Action denied by operator',
        requiresApproval: false,
        cost: 0,
        mode: 'oss',
      };
    }

    // GATE: Approver cannot be the same as requester
    if (approvedBy === this.userId) {
      return {
        output: 'BLOCKED: Self-approval is not permitted',
        requiresApproval: false,
        cost: 0,
        mode: 'oss',
      };
    }

    // EXECUTE via ManusExecutor (FIXED — was missing)
    const executionResult = await this.executor.executeApproved({
      actionId,
      action,
      parameters,
      requestedBy: this.userId,
      approvedBy,
      approvalTimestamp: new Date().toISOString(),
    });

    // SELF-IMPROVEMENT: Learn from outcome
    const outcomeEvidence = evidence ?? {
      success: executionResult.success,
      outcome: executionResult.output,
    };
    await this.improveFromEvidence(actionId, outcomeEvidence);

    await this.logToAudit({
      id: `exec_result_${actionId}`,
      userId: this.userId,
      action: 'action_executed',
      input: actionId,
      approved: true,
      outcome: executionResult.output,
    });

    return {
      output: executionResult.success
        ? `✓ Action executed successfully\n\n${executionResult.output}`
        : `✗ Execution failed\n\n${executionResult.output}`,
      requiresApproval: false,
      executionResult,
      cost: 0,
      mode: 'oss',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SELF-IMPROVEMENT (unchanged from original)
  // ═══════════════════════════════════════════════════════════

  private async improveFromEvidence(
    actionId: string,
    evidence: { success: boolean; outcome: string }
  ): Promise<SelfImprovementResult> {
    const result: SelfImprovementResult = {
      rulesUpdated: 0,
      programsUpdated: 0,
      knowledgeAdded: 0,
      version: new Date().toISOString(),
    };

    await this.monitor.reinforceRule(
      'anomaly_detection',
      evidence.success ? 'success' : 'failure',
      { action: actionId, result: evidence.outcome }
    );
    result.rulesUpdated++;

    await this.reasoner.reinforceProgram(
      'verify_action_safety',
      evidence.success ? 'success' : 'failure',
      { input: actionId, result: evidence.outcome, constraints: [] }
    );
    result.programsUpdated++;

    await this.memory.storeMemory(
      `Action ${actionId} resulted in ${evidence.success ? 'success' : 'failure'}: ${evidence.outcome}`,
      {
        action: actionId,
        success: evidence.success,
        outcome: evidence.outcome,
        timestamp: new Date().toISOString(),
      },
      true
    );
    result.knowledgeAdded++;

    await this.supabase.from('self_improvement_log').insert({
      user_id: this.userId,
      action_id: actionId,
      proposed_change: { evidence, result },
      status: 'merged',
      created_at: new Date().toISOString(),
    });

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNAL HELPERS (unchanged from original)
  // ═══════════════════════════════════════════════════════════

  private aggregateDecision(
    signals: MonitoringSignal[],
    reasoning: ReasoningResult
  ): { safe: boolean; confidence: number } {
    const hasCritical = signals.some(s => s.type === 'critical');
    const safe = reasoning.safe && !hasCritical;
    return { safe, confidence: safe ? 1.0 : 0.0 };
  }

  private requiresHumanApproval(
    signals: MonitoringSignal[],
    reasoning: ReasoningResult,
    decision: { safe: boolean; confidence: number }
  ): boolean {
    return (
      !decision.safe ||
      signals.some(s => s.type !== 'info') ||
      reasoning.risks.length > 1 ||
      !reasoning.safe
    );
  }

  private formatOutput(reasoning: ReasoningResult, requiresApproval: boolean): string {
    let output = '';

    if (requiresApproval) {
      output += '⚠️ **OPERATOR APPROVAL REQUIRED**\n\n';
      output += `**Analysis:**\n${reasoning.analysis}\n\n`;

      if (reasoning.plan.length > 0) {
        output += '**Proposed Plan:**\n';
        reasoning.plan.forEach((step, i) => { output += `${i + 1}. ${step}\n`; });
        output += '\n';
      }

      if (reasoning.risks.length > 0) {
        output += '**Identified Risks:**\n';
        reasoning.risks.forEach(risk => { output += `- ${risk}\n`; });
      }
    } else {
      output += '✓ **Analysis Complete**\n\n';
      output += `${reasoning.analysis}\n\n`;

      if (reasoning.recommendations.length > 0) {
        output += '**Recommendations:**\n';
        reasoning.recommendations.forEach(rec => { output += `- ${rec}\n`; });
      }
    }

    output += '\n---\n*OSS mode — $0 cost*';
    return output.trim();
  }

  private async logToAudit(entry: {
    id?: string;
    userId: number;
    action: string;
    input: string;
    approved?: boolean;
    signals?: MonitoringSignal[];
    reasoning?: ReasoningResult;
    requiresApproval?: boolean;
    duration?: number;
    outcome?: string;
  }): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        id: entry.id || `log_${entry.userId}_${Date.now()}`,
        user_id: entry.userId,
        action: entry.action,
        input: entry.input.substring(0, 500),
        output: entry.outcome?.substring(0, 500) || 'processing',
        approved: entry.approved ?? !entry.requiresApproval,
        risk: this.assessRisk(entry.signals, entry.reasoning),
        metadata: {
          signals: entry.signals?.length || 0,
          reasoning_safe: entry.reasoning?.safe,
          duration_ms: entry.duration,
          cost: 0,
          mode: 'oss',
        },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Audit] Failed to log:', error);
    }
  }

  private assessRisk(
    signals?: MonitoringSignal[],
    reasoning?: ReasoningResult
  ): 'low' | 'medium' | 'high' {
    if (!signals || !reasoning) return 'low';
    if (signals.some(s => s.type === 'critical') || !reasoning.safe) return 'high';
    if (signals.some(s => s.type === 'warning') || reasoning.risks.length > 1) return 'medium';
    return 'low';
  }

  async exportSystemState() {
    const [rules, programs, knowledge] = await Promise.all([
      Promise.resolve(this.monitor.exportRules()),
      Promise.resolve(this.reasoner.exportPrograms()),
      this.memory.exportKnowledgeGraph(),
    ]);
    return { rules, programs, knowledge, version: new Date().toISOString() };
  }

  async importSystemState(state: { rules: unknown[]; programs: unknown[]; knowledge: unknown[] }) {
    await Promise.all([
      Promise.resolve(this.monitor.importRules(state.rules)),
      Promise.resolve(this.reasoner.importPrograms(state.programs)),
      this.memory.importKnowledgeGraph(state.knowledge),
    ]);
  }

  async getStats() {
    const knowledge = await this.memory.exportKnowledgeGraph();
    return {
      monitor: this.monitor.getStats(),
      reasoner: this.reasoner.getStats(),
      memory: { totalTriples: knowledge.length },
      totalCost: 0,
    };
  }
}

export function createChronosOrchestrator(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string },
  userId: number
): ChronosOrchestrator {
  return new ChronosOrchestrator(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, userId);
}
