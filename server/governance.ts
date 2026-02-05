/**
 * CHRONOS OSS - GOVERNANCE & RBAC (A1.3, A5.1)
 * Enforces role-based access and resource quotas.
 */

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface ResourcePolicy {
  table: string;
  allowedRoles: UserRole[];
  canWrite: boolean;
}

const POLICIES: ResourcePolicy[] = [
  { table: 'audit_logs', allowedRoles: ['admin', 'operator', 'viewer'], canWrite: false },
  { table: 'self_improvement_log', allowedRoles: ['admin'], canWrite: true },
  { table: 'users', allowedRoles: ['admin'], canWrite: true },
  { table: 'rdf_triples', allowedRoles: ['admin', 'operator'], canWrite: true },
];

export class GovernanceEngine {
  /**
   * Checks if a user has permission to perform an action on a resource.
   */
  static checkPermission(role: UserRole, table: string, action: 'read' | 'write'): boolean {
    const policy = POLICIES.find(p => p.table === table);
    if (!policy) return false;

    if (!policy.allowedRoles.includes(role)) return false;
    if (action === 'write' && !policy.canWrite) return false;

    return true;
  }

  /**
   * Enforces global rate limits for the orchestrator.
   */
  static checkQuota(userId: number, currentUsage: number): boolean {
    const MAX_QUOTA = 1000; // 1000 operations per hour
    return currentUsage < MAX_QUOTA;
  }
}
