/**
 * Chronos Engine - OSS AI Copilot for SIEM/SOAR operations
 * 
 * Orchestrated by LangChain (Authority)
 * Executed by OpenManus (Sandboxed)
 * Reasoned by OSS Stack (Crepe, ECLiPSe, Jena)
 */

import { ChronosOrchestrator } from "./chronos_oss/orchestrator";
import { LangChainAuthority } from "./chronos_oss/langchain_authority";
import { OpenManusExecutor } from "./openmanus_executor_wrapper";
import { env } from "./_core/env";

let authority: LangChainAuthority | null = null;

export async function initializeChronos(userId: number): Promise<void> {
  try {
    const orchestrator = new ChronosOrchestrator(
      env.supabaseUrl,
      env.supabaseAnonKey,
      userId
    );
    
    // OpenManus is restricted to execution only
    const executor = new OpenManusExecutor();
    
    // LangChain is the final authority
    authority = new LangChainAuthority(orchestrator, executor);
    
    console.log("[Chronos] LangChain Authority initialized");
  } catch (error) {
    console.error("[Chronos] Initialization failed:", error);
    throw error;
  }
}

export async function processChronosQuery(request: { query: string, userId: number, context?: any }) {
  if (!authority) {
    await initializeChronos(request.userId);
  }

  return await authority!.route(request.query, request.userId, request.context);
}

/**
 * Approve and execute a pending action (Enforced by LangChain)
 */
export async function approveChronosAction(
  actionId: string, 
  approved: boolean, 
  userId: number,
  command: string
) {
  if (!authority) {
    await initializeChronos(userId);
  }

  if (!approved) {
    return { output: "Action rejected by user.", status: "REJECTED" };
  }

  // Final Authority executes the command through OpenManus
  return await authority!.execute(actionId, command);
}
