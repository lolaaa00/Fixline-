"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardPenLine, FolderKanban, Menu, Network, RadioTower, X } from "lucide-react";
import { useState } from "react";
import { useWallet } from "./wallet-provider";
import { shortAddress } from "@/lib/format";
import { NETWORK } from "@/lib/config";

const nav = [{ href: "/work", label: "Desk", icon: FolderKanban }, { href: "/briefs/new", label: "New brief", icon: ClipboardPenLine }, { href: "/transactions", label: "Transactions", icon: RadioTower }, { href: "/method", label: "Method", icon: BookOpen }];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const [menu, setMenu] = useState(false); const wallet = useWallet();
  return <div className="shell">
    <header className="topbar">
      <Link className="wordmark" href="/"><span>F</span> FIXLINE</Link>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      <div className="network-pill"><Network size={14} /> STUDIONET · {NETWORK.chainId}</div>
      <div className="wallet-controls">
        {wallet.connected && !wallet.correctNetwork && <button className="network-warning" onClick={wallet.switchNetwork}>Switch to 61999</button>}
        {wallet.connected ? <><button className="account-chip">{shortAddress(wallet.account)}</button><button className="text-action" onClick={wallet.disconnect}>Disconnect</button></> : <button className="button compact" onClick={wallet.connect}>Connect wallet</button>}
      </div>
    </header>
    <aside className={menu ? "sidebar open" : "sidebar"}>
      <div className="rail-label">WORKSPACE</div>
      <nav>{nav.map(item => { const Icon = item.icon; const active = path === item.href || (item.href === "/work" && path.startsWith("/work/")); return <Link key={item.href} className={active ? "active" : ""} href={item.href} onClick={() => setMenu(false)}><Icon size={18}/><span>{item.label}</span></Link>; })}</nav>
      <div className="rail-foot"><i className={wallet.correctNetwork ? "online" : ""}/><span>{wallet.connected ? wallet.correctNetwork ? "Ready on Studionet" : "Wrong network" : "Read-only mode"}</span></div>
    </aside>
    <main className="content">{wallet.error && <div className="global-error">{wallet.error}</div>}{children}</main>
  </div>;
}
