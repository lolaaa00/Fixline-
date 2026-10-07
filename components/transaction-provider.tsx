"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TrackedTransaction, TxStage } from "@/lib/types";

interface TransactionContextValue { transactions: TrackedTransaction[]; track(label: string): string; update(id: string, patch: Partial<TrackedTransaction>): void; clearSettled(): void }
const TransactionContext = createContext<TransactionContextValue | null>(null);
const STORAGE_KEY = "fixline:transactions:v1";

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);
  useEffect(() => { try { setTransactions(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setTransactions([]); } }, []);
  useEffect(() => { if (transactions.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.slice(0, 20))); }, [transactions]);
  const track = (label: string) => { const id = crypto.randomUUID(); setTransactions(v => [{ id, label, hash: "", stage: "preparing", createdAt: Date.now() }, ...v]); return id; };
  const update = (id: string, patch: Partial<TrackedTransaction>) => setTransactions(v => v.map(tx => tx.id === id ? { ...tx, ...patch } : tx));
  const clearSettled = () => { const active: TxStage[] = ["preparing", "signature", "submitted", "pending", "accepted"]; setTransactions(v => v.filter(tx => active.includes(tx.stage))); };
  const value = useMemo(() => ({ transactions, track, update, clearSettled }), [transactions]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}
export function useTransactions() { const value = useContext(TransactionContext); if (!value) throw new Error("TransactionProvider is missing"); return value; }
