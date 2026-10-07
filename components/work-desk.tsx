"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ClipboardList, Wallet } from "lucide-react";
import { readContract } from "@/lib/contract";
import { useWallet } from "./wallet-provider";
import { STATUS_LABELS, formatDate, formatGen, shortAddress } from "@/lib/format";
import type { WorkOrder } from "@/lib/types";

function normalizeWork(value: unknown, id: number): WorkOrder { const v = value as WorkOrder; return { ...v, id, status: Number(v.status), submissionCount: Number(v.submissionCount), winningSubmission: Number(v.winningSubmission), award: BigInt(v.award), remaining: BigInt(v.remaining), createdAt: BigInt(v.createdAt), acceptBy: BigInt(v.acceptBy), deliverBy: BigInt(v.deliverBy) }; }

export function WorkDesk() {
  const wallet = useWallet(); const [items, setItems] = useState<WorkOrder[] | null>(null); const [error, setError] = useState("");
  useEffect(() => { if (!wallet.account) return void setItems([]); let alive = true; (async () => { try { const ids = await readContract("work_ids_for", [wallet.account, 0, 30]) as unknown[]; const rows = await Promise.all(ids.map(async raw => { const id = Number(raw); return normalizeWork(await readContract("get_work", [id]), id); })); if (alive) setItems(rows); } catch (cause) { if (alive) { setItems(null); setError(cause instanceof Error ? cause.message : "Contract state is unavailable."); } } })(); return () => { alive = false; }; }, [wallet.account]);
  const attention = useMemo(() => items?.filter(i => [0,1,2,3,4].includes(i.status)) || [], [items]);
  return <div className="page"><header className="desk-head"><div><div className="kicker">Your work desk</div><h1>{wallet.connected ? `Good to see you, ${shortAddress(wallet.account)}.` : "Connect a wallet to reconstruct your desk."}</h1><p>Everything below is read from the deployed contract. Browser memory is never the source of truth.</p></div><Link className="button primary" href="/briefs/new">Fund a brief <ArrowUpRight size={17}/></Link></header>
    {!wallet.connected ? <div className="empty-state"><Wallet/><h2>Wallet required for a personal desk</h2><p>Public work orders remain shareable by direct link. Connect to discover work associated with your address.</p><button className="button" onClick={wallet.connect}>Connect injected wallet</button></div> : items === null ? <div className="empty-state error"><h2>Could not read contract state</h2><p>{error}</p></div> : items.length === 0 ? <div className="empty-state"><ClipboardList/><h2>Your desk is clear</h2><p>Fund a brief or ask a sponsor to name this wallet as the contributor.</p></div> : <><div className="desk-summary"><div><span>Needs attention</span><strong>{attention.length}</strong></div><div><span>Total work</span><strong>{items.length}</strong></div><div><span>Finalized awards</span><strong>{items.filter(i => i.status === 5).length}</strong></div></div><div className="work-list">{items.map(work => <Link href={`/work/${work.id}`} className="work-row" key={work.id}><div className="work-number">{String(work.id).padStart(3,"0")}</div><div className="work-main"><span className="status-ribbon">{STATUS_LABELS[work.status] || "UNKNOWN"}</span><h2>{work.title}</h2><p>{work.repository}</p></div><div className="work-meta"><span>Award<strong>{formatGen(work.award)}</strong></span><span>Deliver by<strong>{formatDate(work.deliverBy)}</strong></span></div><ArrowUpRight/></Link>)}</div></>}
  </div>;
}
