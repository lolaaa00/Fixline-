"use client";

import { useState } from "react";
import { submitContract, waitForFinalized, executionSucceeded } from "@/lib/contract";
import { useWallet } from "./wallet-provider";
import { useTransactions } from "./transaction-provider";

export function TxAction({ method, args = [], value = 0n, children, disabled, onFinalized, className = "button primary" }: { method: string; args?: unknown[]; value?: bigint; children: React.ReactNode; disabled?: boolean; onFinalized?: () => void | Promise<void>; className?: string }) {
  const wallet = useWallet(); const txs = useTransactions(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const run = async () => {
    if (!wallet.connected) return void wallet.connect();
    if (!wallet.correctNetwork) return void wallet.switchNetwork();
    if (!wallet.client) return;
    const id = txs.track(typeof children === "string" ? children : method); setBusy(true); setError("");
    try {
      txs.update(id, { stage: "signature" });
      const hash = String(await submitContract(wallet.client, method, args, value));
      txs.update(id, { hash, stage: "submitted" });
      const receipt = await waitForFinalized(wallet.client, hash, stage => txs.update(id, { stage }));
      if (!executionSucceeded(receipt)) throw new Error("The transaction finalized, but contract execution did not succeed.");
      txs.update(id, { stage: "finalized" }); await onFinalized?.();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Transaction failed."; setError(message); txs.update(id, { stage: message.toLowerCase().includes("undetermined") ? "undetermined" : "failed", error: message }); }
    finally { setBusy(false); }
  };
  return <div className="action-wrap"><button className={className} disabled={disabled || busy} onClick={run}>{busy ? "Following consensus…" : children}</button>{error && <p className="inline-error">{error}</p>}</div>;
}
