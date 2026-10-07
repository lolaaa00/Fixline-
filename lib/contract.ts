import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { assertLiveConfig } from "./config";
import type { TxStage } from "./types";

export const readClient = createClient({ chain: studionet });
export const makeWalletClient = (provider: unknown, account: string) => createClient({ chain: studionet, provider: provider as never, account: account as `0x${string}` });

export async function readContract(functionName: string, args: unknown[] = []) {
  return readClient.readContract({ address: assertLiveConfig() as `0x${string}`, functionName, args: args as never[] });
}

export async function submitContract(client: ReturnType<typeof makeWalletClient>, functionName: string, args: unknown[] = [], value = 0n) {
  return client.writeContract({ address: assertLiveConfig() as `0x${string}`, functionName, args: args as never[], value });
}

export function transactionStage(receipt: unknown): TxStage {
  const value = String((receipt as { statusName?: string; status?: string }).statusName || (receipt as { status?: string }).status || "").toUpperCase();
  if (value.includes("FINALIZED")) return executionSucceeded(receipt) ? "finalized" : "failed";
  if (value.includes("UNDETERMINED") || value.includes("TIMEOUT") || value.includes("CANCELED")) return "undetermined";
  if (value.includes("ACCEPTED") || value.includes("READY_TO_FINALIZE")) return "accepted";
  return "pending";
}

export async function getTransactionStage(hash: string) {
  const receipt = await readClient.getTransaction({ hash: hash as never });
  return { stage: transactionStage(receipt), receipt };
}

export async function waitForFinalized(
  client: ReturnType<typeof makeWalletClient>,
  hash: string,
  onStage?: (stage: TxStage) => void,
) {
  let stopped = false;
  const observe = async () => {
    while (!stopped) {
      try {
        const current = await client.getTransaction({ hash: hash as never });
        onStage?.(transactionStage(current));
      } catch { /* The transaction may not be indexed immediately after submission. */ }
      await new Promise(resolve => setTimeout(resolve, 2_500));
    }
  };
  const observer = observe();
  try {
    const receipt = await client.waitForTransactionReceipt({ hash: hash as never, status: TransactionStatus.FINALIZED });
    onStage?.(transactionStage(receipt));
    return receipt;
  } finally {
    stopped = true;
    await observer;
  }
}

export function executionSucceeded(receipt: unknown) {
  const r = receipt as { statusName?: string; txExecutionResultName?: string; status?: string; result?: string };
  const status = String(r.statusName || r.status || "").toUpperCase();
  const execution = String(r.txExecutionResultName || r.result || "").toUpperCase();
  return status.includes("FINALIZED") && (execution.includes("FINISHED_WITH_RETURN") || execution.includes("RETURN"));
}
