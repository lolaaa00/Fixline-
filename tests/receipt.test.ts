import { describe, expect, it } from "vitest";
import { executionSucceeded, transactionStage } from "@/lib/contract";

describe("transaction truthfulness", () => {
  it("requires finalized and successful execution", () => {
    expect(executionSucceeded({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN" })).toBe(true);
    expect(executionSucceeded({ statusName: "ACCEPTED", txExecutionResultName: "FINISHED_WITH_RETURN" })).toBe(false);
    expect(executionSucceeded({ statusName: "FINALIZED", txExecutionResultName: "USER_ERROR" })).toBe(false);
  });

  it("preserves accepted as a distinct pre-finality stage", () => {
    expect(transactionStage({ statusName: "PENDING" })).toBe("pending");
    expect(transactionStage({ statusName: "ACCEPTED" })).toBe("accepted");
    expect(transactionStage({ statusName: "READY_TO_FINALIZE" })).toBe("accepted");
    expect(transactionStage({ statusName: "UNDETERMINED" })).toBe("undetermined");
    expect(transactionStage({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN" })).toBe("finalized");
    expect(transactionStage({ statusName: "FINALIZED", txExecutionResultName: "USER_ERROR" })).toBe("failed");
  });
});
