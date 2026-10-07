export const NETWORK = {
  name: "GenLayer Studionet",
  chainId: 61999,
  chainHex: "0xf22f",
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api",
  explorerUrl: "https://genlayer-explorer.vercel.app",
} as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FIXLINE_CONTRACT_ADDRESS || "";

export function assertLiveConfig() {
  if (!CONTRACT_ADDRESS) throw new Error("The FixLine contract address is not configured.");
  return CONTRACT_ADDRESS;
}
