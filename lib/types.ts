export type WorkStatus = "FUNDED" | "ACCEPTED" | "SUBMITTED" | "REVISION_NEEDED" | "RETRYABLE" | "AWARDED" | "WITHDRAWN" | "EXPIRED_REFUNDED";
export type ReviewOutcome = "" | "QUALIFIED" | "NOT_QUALIFIED" | "INSUFFICIENT_EVIDENCE" | "SOURCE_UNAVAILABLE";

export interface WorkOrder {
  id: number;
  sponsor: string;
  contributor: string;
  title: string;
  brief: string;
  repository: string;
  criteria: string;
  allowedHosts: string;
  award: bigint;
  remaining: bigint;
  createdAt: bigint;
  acceptBy: bigint;
  deliverBy: bigint;
  status: number;
  submissionCount: number;
  winningSubmission: number;
}

export interface Submission {
  revision: string;
  artifactUrl: string;
  checkUrl: string;
  evidenceMap: string;
  digest: string;
  submittedAt: bigint;
  assessedAt: bigint;
  outcome: ReviewOutcome;
  rationale: string;
  criterionResults: string;
  retryAfter: bigint;
}

export type TxStage = "preparing" | "signature" | "submitted" | "pending" | "accepted" | "finalized" | "failed" | "undetermined";
export interface TrackedTransaction { id: string; label: string; hash: string; stage: TxStage; createdAt: number; error?: string }
