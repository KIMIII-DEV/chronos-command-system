/**
 * Chronos OSS Integration
 * 
 * This module replaces the traditional LLM-based Manus agent with the
 * Chronos OSS Orchestrator (Crepe + ECLiPSe + Jena) for zero-cost,
 * deterministic SIEM/SOAR operations.
 */

import { ChronosOrchestrator } from "./chronos_oss/orchestrator";
import { env } from "./_core/env";

export class Manus {
  private orchestrator: ChronosOrchestrator | null = null;
  private userId: number = 1; // Default to system user

  /**
   * Create and initialize a Chronos OSS instance
   */
  static async create(): Promise<Manus> {
    const instance = new Manus();
    await instance.initialize();
    return instance;
  }

  /**
   * Initialize the Chronos OSS Orchestrator
   */
  private async initialize(): Promise<void> {
    try {
      this.orchestrator = new ChronosOrchestrator(
        env.supabaseUrl,
        env.supabaseAnonKey,
        this.userId
      );
      console.log("[Chronos OSS] Orchestrator initialized");
    } catch (error) {
      console.error("[Chronos OSS] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Run the OSS Orchestrator with a prompt
   */
  async run(prompt: string): Promise<string> {
    if (!this.orchestrator) {
      throw new Error("Chronos OSS Orchestrator not initialized");
    }

    try {
      const response = await this.orchestrator.process({
        input: prompt,
        userId: this.userId
      });

      return response.output;
    } catch (error) {
      console.error("[Chronos OSS] Execution failed:", error);
      throw error;
    }
  }

  /**
   * Execute approved action (Reinforcement Loop)
   */
  async executeApproved(actionId: string, approved: boolean, evidence?: any): Promise<any> {
    if (!this.orchestrator) {
      throw new Error("Chronos OSS Orchestrator not initialized");
    }
    return await this.orchestrator.executeApproved(actionId, approved, evidence);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.orchestrator = null;
    console.log("[Chronos OSS] Cleaned up");
  }
}
