import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChronosOrchestrator } from "./orchestrator";
import { OpenManusExecutor } from "./openmanus_executor";

/**
 * CHRONOS OSS - LANGCHAIN AUTHORITY (A3.1)
 * The final decision-making layer that enforces safety and human-in-the-loop.
 */

export class LangChainAuthority {
  private orchestrator: ChronosOrchestrator;
  private executor: OpenManusExecutor;

  constructor(orchestrator: ChronosOrchestrator, executor: OpenManusExecutor) {
    this.orchestrator = orchestrator;
    this.executor = executor;
  }

  async route(input: string, userId: number, context?: any) {
    // 1. Get OSS Analysis (Crepe + ECLiPSe + Jena)
    const analysis = await this.orchestrator.process({ input, userId, context });

    // 2. LangChain Decision Logic (Enforcement)
    if (analysis.risk === 'high') {
      return {
        ...analysis,
        output: "⚠️ CRITICAL RISK DETECTED. Action held for manual approval by LangChain Authority.",
        status: "PENDING_APPROVAL"
      };
    }

    // 3. Automated Execution for Low Risk
    if (analysis.risk === 'low' && !analysis.requiresApproval) {
      const result = await this.executor.execute(analysis.input);
      return {
        ...analysis,
        output: result,
        status: "COMPLETED"
      };
    }

    return {
      ...analysis,
      status: "PENDING_APPROVAL"
    };
  }

  async execute(actionId: string, command: string) {
    // Verified execution path
    const result = await this.executor.execute(command);
    return {
      output: result,
      status: "COMPLETED",
      actionId
    };
  }
}
