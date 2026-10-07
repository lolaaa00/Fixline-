import { describe, expect, it } from "vitest";
import { NETWORK } from "@/lib/config";

describe("absolute network configuration", () => {
  it("targets Studionet 61999", () => {
    expect(NETWORK.chainId).toBe(61999);
    expect(NETWORK.chainHex).toBe("0xf22f");
    expect(NETWORK.rpcUrl).toBe("https://studio.genlayer.com/api");
  });
});
