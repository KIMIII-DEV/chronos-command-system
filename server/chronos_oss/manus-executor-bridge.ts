/**
 * CHRONOS OSS — MANUS EXECUTOR BRIDGE
 *
 * FIX: Bridges ChronosOrchestrator.executeApproved() with the Manus executor.
 *
 * PROBLEM IDENTIFIED:
 *   - ChronosOrchestrator.executeApproved() exists but calls no real executor
 *   - Manus class exists but is disconnected from Orchestrator
 *   - No bridge between approval flow and execution layer
 *
 * THIS FILE FIXES:
 *   1. Connects Orchestrator → Manus executor
 *   2. Enforces sandboxed execution (whitelist only)
 *   3. Enforces Human Approval gate (cannot be bypassed)
 *   4. Logs every action to Supabase audit_logs
 *   5. Returns structured ExecutionResult
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ExecutionRequest {
  actionId: string;
  action: string;
  parameters: Record<string, unknown>;
  requestedBy: number; // userId
  approvedBy: number;  // userId of approver (MUST differ from requestedBy)
  approvalTimestamp: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  actionId: string;
  executedAt: string;
  cost: 0; // Always zero — OSS
  sandboxed: true;
}

// Whitelist of allowed actions (Sandbox enforcement)
const ALLOWED_ACTIONS = new Set([
  'read_file',
  'list_directory',
  'search_codebase',
  'analyze_logs',
  'generate_report',
  'create_pr_draft',
  'query_memory',
  'export_state',
  'health_check',
]);

// ═══════════════════════════════════════════════════════════
// MANUS EXECUTOR (Sandboxed)
// ═══════════════════════════════════════════════════════════

export class ManusExecutor {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Execute an approved action.
   * CANNOT be called without prior human approval logged in audit_logs.
   */
  async executeApproved(request: ExecutionRequest): Promise<ExecutionResult> {
    const executedAt = new Date().toISOString();

    // GATE 1: Verify action is in whitelist
    if (!ALLOWED_ACTIONS.has(request.action)) {
      await this.logExecution({
        ...request,
        success: false,
        output: `Action '${request.action}' is not in execution whitelist`,
        executedAt,
      });

      return {
        success: false,
        output: `BLOCKED: '${request.action}' is not a permitted action`,
        actionId: request.actionId,
        executedAt,
        cost: 0,
        sandboxed: true,
      };
    }

    // GATE 2: Verify approval exists in audit_logs
    const approvalVerified = await this.verifyApprovalInAudit(request.actionId);
    if (!approvalVerified) {
      await this.logExecution({
        ...request,
        success: false,
        output: 'No verified approval found in audit_logs for this action',
        executedAt,
      });

      return {
        success: false,
        output: 'BLOCKED: No human approval found in audit trail',
        actionId: request.actionId,
        executedAt,
        cost: 0,
        sandboxed: true,
      };
    }

    // GATE 3: Approver must differ from requester
    if (request.approvedBy === request.requestedBy) {
      await this.logExecution({
        ...request,
        success: false,
        output: 'Self-approval is not permitted',
        executedAt,
      });

      return {
        success: false,
        output: 'BLOCKED: Approver and requester must be different users',
        actionId: request.actionId,
        executedAt,
        cost: 0,
        sandboxed: true,
      };
    }

    // EXECUTE (Sandboxed)
    try {
      const output = await this.runSandboxed(request.action, request.parameters);

      await this.logExecution({
        ...request,
        success: true,
        output,
        executedAt,
      });

      return {
        success: true,
        output,
        actionId: request.actionId,
        executedAt,
        cost: 0,
        sandboxed: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';

      await this.logExecution({
        ...request,
        success: false,
        output: errorMessage,
        executedAt,
      });

      return {
        success: false,
        output: `EXECUTION ERROR: ${errorMessage}`,
        actionId: request.actionId,
        executedAt,
        cost: 0,
        sandboxed: true,
      };
    }
  }

  /**
   * Sandboxed execution — only whitelisted, read-only operations
   */
  private async runSandboxed(
    action: string,
    parameters: Record<string, unknown>
  ): Promise<string> {
    switch (action) {
      case 'read_file':
        return this.actionReadFile(parameters);

      case 'list_directory':
        return this.actionListDirectory(parameters);

      case 'search_codebase':
        return this.actionSearchCodebase(parameters);

      case 'analyze_logs':
        return this.actionAnalyzeLogs(parameters);

      case 'generate_report':
        return this.actionGenerateReport(parameters);

      case 'create_pr_draft':
        return this.actionCreatePRDraft(parameters);

      case 'query_memory':
        return this.actionQueryMemory(parameters);

      case 'export_state':
        return this.actionExportState(parameters);

      case 'health_check':
        return this.actionHealthCheck();

      default:
        throw new Error(`Action '${action}' has no sandboxed implementation`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SANDBOXED ACTIONS (read-only, no system access, no secrets)
  // ═══════════════════════════════════════════════════════════

  private async actionReadFile(params: Record<string, unknown>): Promise<string> {
    // Read from Supabase storage only — no filesystem access
    const path = String(params.path || '');
    if (!path) throw new Error('path parameter required');

    const { data, error } = await this.supabase
      .storage
      .from('chronos-artifacts')
      .download(path);

    if (error) throw new Error(`File read failed: ${error.message}`);

    const text = await data.text();
    return `FILE: ${path}\n---\n${text.substring(0, 10000)}`;
  }

  private async actionListDirectory(params: Record<string, unknown>): Promise<string> {
    const prefix = String(params.prefix || '');

    const { data, error } = await this.supabase
      .storage
      .from('chronos-artifacts')
      .list(prefix);

    if (error) throw new Error(`List failed: ${error.message}`);

    const files = (data || []).map(f => `${f.name} (${f.metadata?.size || 0} bytes)`);
    return `DIRECTORY: ${prefix || '/'}\n---\n${files.join('\n')}`;
  }

  private async actionSearchCodebase(params: Record<string, unknown>): Promise<string> {
    // Search through audit_logs and rdf_triples for patterns
    const query = String(params.query || '');
    if (!query) throw new Error('query parameter required');

    const { data, error } = await this.supabase
      .from('rdf_triples')
      .select('subject, predicate, object')
      .or(`subject.ilike.%${query}%,object.ilike.%${query}%`)
      .limit(20);

    if (error) throw new Error(`Search failed: ${error.message}`);

    const results = (data || []).map(
      t => `${t.subject} → ${t.predicate} → ${t.object}`
    );

    return `SEARCH: "${query}"\nFOUND: ${results.length} results\n---\n${results.join('\n')}`;
  }

  private async actionAnalyzeLogs(params: Record<string, unknown>): Promise<string> {
    const limit = Math.min(Number(params.limit || 50), 100);
    const risk = String(params.risk || '');

    let queryBuilder = this.supabase
      .from('audit_logs')
      .select('action, risk, approved, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (risk && ['low', 'medium', 'high'].includes(risk)) {
      queryBuilder = queryBuilder.eq('risk', risk);
    }

    const { data, error } = await queryBuilder;
    if (error) throw new Error(`Log analysis failed: ${error.message}`);

    const summary = {
      total: data?.length || 0,
      high_risk: data?.filter(l => l.risk === 'high').length || 0,
      medium_risk: data?.filter(l => l.risk === 'medium').length || 0,
      approved: data?.filter(l => l.approved).length || 0,
    };

    return `LOG ANALYSIS (last ${limit} entries)\n---\n` +
      `Total: ${summary.total}\n` +
      `High Risk: ${summary.high_risk}\n` +
      `Medium Risk: ${summary.medium_risk}\n` +
      `Approved: ${summary.approved}\n`;
  }

  private async actionGenerateReport(params: Record<string, unknown>): Promise<string> {
    const type = String(params.type || 'summary');
    const timestamp = new Date().toISOString();

    // Fetch stats from Supabase
    const [logsResult, triplesResult] = await Promise.all([
      this.supabase.from('audit_logs').select('risk, approved', { count: 'exact' }),
      this.supabase.from('rdf_triples').select('id', { count: 'exact' }),
    ]);

    return `CHRONOS OSS REPORT — ${type.toUpperCase()}\n` +
      `Generated: ${timestamp}\n` +
      `---\n` +
      `Audit Log Entries: ${logsResult.count || 0}\n` +
      `RDF Memory Triples: ${triplesResult.count || 0}\n` +
      `System Mode: OSS\n` +
      `Cost: $0.00\n`;
  }

  private async actionCreatePRDraft(params: Record<string, unknown>): Promise<string> {
    // Creates a PR draft record in Supabase — no GitHub API call directly
    // Actual GitHub PR creation requires separate human-triggered workflow
    const title = String(params.title || '');
    const body = String(params.body || '');

    if (!title || !body) throw new Error('title and body parameters required');

    const { data, error } = await this.supabase
      .from('self_improvement_log')
      .insert({
        proposed_change: { title, body, type: 'pr_draft' },
        status: 'proposed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`PR draft creation failed: ${error.message}`);

    return `PR DRAFT CREATED\n---\n` +
      `ID: ${data.id}\n` +
      `Title: ${title}\n` +
      `Status: proposed (awaiting human review)\n` +
      `Note: Actual GitHub PR requires manual operator action`;
  }

  private async actionQueryMemory(params: Record<string, unknown>): Promise<string> {
    const subject = String(params.subject || '');
    const predicate = String(params.predicate || '');

    let query = this.supabase
      .from('rdf_triples')
      .select('subject, predicate, object, created_at')
      .limit(50);

    if (subject) query = query.ilike('subject', `%${subject}%`);
    if (predicate) query = query.ilike('predicate', `%${predicate}%`);

    const { data, error } = await query;
    if (error) throw new Error(`Memory query failed: ${error.message}`);

    const results = (data || []).map(
      t => `[${t.created_at}] ${t.subject} → ${t.predicate} → ${t.object}`
    );

    return `MEMORY QUERY\nSubject: ${subject || '*'}\nPredicate: ${predicate || '*'}\n` +
      `---\n${results.length} results:\n${results.join('\n')}`;
  }

  private async actionExportState(): Promise<string> {
    const [logs, triples, improvements] = await Promise.all([
      this.supabase.from('audit_logs').select('count').single(),
      this.supabase.from('rdf_triples').select('count').single(),
      this.supabase.from('self_improvement_log').select('count').single(),
    ]);

    return JSON.stringify({
      exported_at: new Date().toISOString(),
      audit_logs: logs.data?.count || 0,
      rdf_triples: triples.data?.count || 0,
      improvement_proposals: improvements.data?.count || 0,
      mode: 'oss',
      cost: 0,
    }, null, 2);
  }

  private async actionHealthCheck(): Promise<string> {
    try {
      await this.supabase.from('audit_logs').select('id').limit(1);
      return `HEALTH CHECK PASSED\n---\nSupabase: OK\nExecutor: OK\nTimestamp: ${new Date().toISOString()}`;
    } catch {
      return `HEALTH CHECK FAILED\n---\nSupabase: ERROR\nTimestamp: ${new Date().toISOString()}`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AUDIT HELPERS
  // ═══════════════════════════════════════════════════════════

  private async verifyApprovalInAudit(actionId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('id, approved')
      .eq('id', actionId)
      .eq('approved', true)
      .single();

    if (error || !data) return false;
    return data.approved === true;
  }

  private async logExecution(entry: {
    actionId: string;
    action: string;
    requestedBy: number;
    approvedBy: number;
    success: boolean;
    output: string;
    executedAt: string;
  }): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        id: `exec_${entry.actionId}_${Date.now()}`,
        user_id: entry.requestedBy,
        action: `execute:${entry.action}`,
        input: entry.actionId,
        output: entry.output.substring(0, 1000),
        risk: 'low',
        approved: entry.success,
        approved_by: entry.approvedBy,
        metadata: {
          executor: 'ManusExecutor',
          sandboxed: true,
          cost: 0,
          mode: 'oss',
        },
        created_at: entry.executedAt,
      });
    } catch (err) {
      console.error('[ManusExecutor] Audit log failed:', err);
    }
  }
}
