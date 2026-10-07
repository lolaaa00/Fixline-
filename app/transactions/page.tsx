"use client";
import Link from "next/link";
import { ExternalLink, RadioTower, Trash2 } from "lucide-react";
import { useTransactions } from "@/components/transaction-provider";
import { NETWORK } from "@/lib/config";
import { shortHash } from "@/lib/format";

export default function TransactionsPage() {
  const { transactions, clearSettled } = useTransactions();
  return <div className="page"><header className="page-title"><div className="kicker">Lifecycle center</div><h1>Transactions</h1><p>Submission is not success. Decisions remain provisional until GenLayer records finality.</p></header>
    <div className="section-toolbar"><span>{transactions.length} remembered in this browser</span><button className="text-action" onClick={clearSettled}><Trash2 size={15}/> Clear settled</button></div>
    {transactions.length === 0 ? <div className="empty-state"><RadioTower/><h2>No transactions yet</h2><p>Transactions you initiate will stay here across refreshes so you can resume following their real network state.</p></div> : <div className="tx-list">{transactions.map(tx => <article key={tx.id} className="tx-row"><div className={`status-dot ${tx.stage}`}/><div><strong>{tx.label}</strong><span>{new Date(tx.createdAt).toLocaleString()}</span>{tx.error && <p>{tx.error}</p>}</div><span className="stage">{tx.stage.replaceAll("_", " ")}</span>{tx.hash ? <Link href={`${NETWORK.explorerUrl}/transactions/${tx.hash}`} target="_blank">{shortHash(tx.hash)} <ExternalLink size={13}/></Link> : <span>Waiting for wallet</span>}</article>)}</div>}
  </div>;
}
