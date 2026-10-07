import { describe, expect, it } from "vitest";
import { executionSucceeded } from "@/lib/contract";

describe("transaction truthfulness", () => {
  it("requires finalized and successful execution", () => {
    expect(executionSucceeded({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN" })).toBe(true);
    expect(executionSucceeded({ statusName: "ACCEPTED", txExecutionResultName: "FINISHED_WITH_RETURN" })).toBe(false);
    expect(executionSucceeded({ statusName: "FINALIZED", txExecutionResultName: "USER_ERROR" })).toBe(false);
  });
});
