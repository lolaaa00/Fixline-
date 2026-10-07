import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { assertLiveConfig } from "./config";

export const readClient = createClient({ chain: studionet });
export const makeWalletClient = (provider: unknown, account: string) => createClient({ chain: studionet, provider: provider as never, account: account as `0x${string}` });

export async function readContract(functionName: string, args: unknown[] = []) {
  return readClient.readContract({ address: assertLiveConfig() as `0x${string}`, functionName, args: args as never[] });
}

export async function submitContract(client: ReturnType<typeof makeWalletClient>, functionName: string, args: unknown[] = [], value = 0n) {
  return client.writeContract({ address: assertLiveConfig() as `0x${string}`, functionName, args: args as never[], value });
}

export async function waitForFinalized(client: ReturnType<typeof makeWalletClient>, hash: string) {
  return client.waitForTransactionReceipt({ hash: hash as never, status: TransactionStatus.FINALIZED });
}

export function executionSucceeded(receipt: unknown) {
  const r = receipt as { statusName?: string; txExecutionResultName?: string; status?: string; result?: string };
  const status = String(r.statusName || r.status || "").toUpperCase();
  const execution = String(r.txExecutionResultName || r.result || "").toUpperCase();
  return status.includes("FINALIZED") && (execution.includes("FINISHED_WITH_RETURN") || execution.includes("RETURN"));
}
