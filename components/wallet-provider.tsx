"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { makeWalletClient } from "@/lib/contract";
import { NETWORK } from "@/lib/config";

type WalletClient = ReturnType<typeof makeWalletClient>;
interface WalletState { account: string; chainId: number | null; connected: boolean; correctNetwork: boolean; error: string; client: WalletClient | null; connect(): Promise<void>; disconnect(): void; switchNetwork(): Promise<void> }
const WalletContext = createContext<WalletState | null>(null);

const parseChain = (value: unknown) => typeof value === "string" ? Number.parseInt(value, 16) : Number(value);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const sync = useCallback(async (requestAccounts = false) => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: requestAccounts ? "eth_requestAccounts" : "eth_accounts" }) as string[];
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(accounts?.[0] || ""); setChainId(parseChain(chain)); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Wallet connection failed."); }
  }, []);
  useEffect(() => {
    void sync();
    const update = () => void sync();
    window.ethereum?.on?.("accountsChanged", update); window.ethereum?.on?.("chainChanged", update);
    return () => { window.ethereum?.removeListener?.("accountsChanged", update); window.ethereum?.removeListener?.("chainChanged", update); };
  }, [sync]);
  const connect = async () => { if (!window.ethereum) { setError("No injected wallet was found. Install MetaMask or Rabby."); return; } await sync(true); };
  const disconnect = () => { setAccount(""); setError(""); };
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainHex }] }); await sync(); }
    catch (cause) {
      const code = (cause as { code?: number }).code;
      if (code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: NETWORK.chainHex, chainName: NETWORK.name, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: [NETWORK.rpcUrl], blockExplorerUrls: [NETWORK.explorerUrl] }] });
        await sync();
      } else setError(cause instanceof Error ? cause.message : "Network switch was rejected.");
    }
  };
  const client = useMemo(() => account && window.ethereum ? makeWalletClient(window.ethereum, account) : null, [account]);
  const value = { account, chainId, connected: !!account, correctNetwork: chainId === NETWORK.chainId, error, client, connect, disconnect, switchNetwork };
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() { const value = useContext(WalletContext); if (!value) throw new Error("WalletProvider is missing"); return value; }
