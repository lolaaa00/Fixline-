"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TrackedTransaction, TxStage } from "@/lib/types";
import { getTransactionStage } from "@/lib/contract";

interface TransactionContextValue { transactions: TrackedTransaction[]; track(label: string): string; update(id: string, patch: Partial<TrackedTransaction>): void; clearSettled(): void }
const TransactionContext = createContext<TransactionContextValue | null>(null);
const STORAGE_KEY = "fixline:transactions:v1";

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);
  useEffect(() => { try { setTransactions(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setTransactions([]); } }, []);
  useEffect(() => { if (transactions.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.slice(0, 20))); }, [transactions]);
  useEffect(() => {
    const active = transactions.filter(tx => tx.hash && ["submitted", "pending", "accepted"].includes(tx.stage));
    if (!active.length) return;
    let cancelled = false;
    const refresh = async () => {
      const results = await Promise.all(active.map(async tx => {
        try { return { id: tx.id, ...(await getTransactionStage(tx.hash)) }; }
        catch { return null; }
      }));
      if (cancelled) return;
      setTransactions(current => {
        let changed = false;
        const next = current.map(tx => {
          const result = results.find(item => item?.id === tx.id);
          if (!result) return tx;
          const error = result.stage === "failed" ? "Finalized without successful execution." : tx.error;
          if (result.stage === tx.stage && error === tx.error) return tx;
          changed = true;
          return { ...tx, stage: result.stage, error };
        });
        return changed ? next : current;
      });
    };
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [transactions]);
  const track = (label: string) => { const id = crypto.randomUUID(); setTransactions(v => [{ id, label, hash: "", stage: "preparing", createdAt: Date.now() }, ...v]); return id; };
  const update = (id: string, patch: Partial<TrackedTransaction>) => setTransactions(v => v.map(tx => tx.id === id ? { ...tx, ...patch } : tx));
  const clearSettled = () => { const active: TxStage[] = ["preparing", "signature", "submitted", "pending", "accepted"]; setTransactions(v => v.filter(tx => active.includes(tx.stage))); };
  const value = useMemo(() => ({ transactions, track, update, clearSettled }), [transactions]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}
export function useTransactions() { const value = useContext(TransactionContext); if (!value) throw new Error("TransactionProvider is missing"); return value; }
