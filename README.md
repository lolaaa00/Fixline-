# FixLine

FixLine is a backend-free GenLayer application for funding bounded public software work without giving either financially interested party unilateral control over acceptance.

A sponsor freezes a public GitHub repository, a named contributor, a fixed GEN award, a work brief, mandatory criteria, and deadlines. The contributor accepts and submits an immutable commit plus criterion-bound public evidence. GenLayer validators independently inspect that evidence and classify every criterion. A fully qualified delivery receives the award; a deficient delivery can be revised; unavailable or insufficient evidence never triggers payment.

## Why GenLayer matters

The important decision is semantic: whether a public revision actually satisfies every frozen criterion. A conventional server operated by the sponsor would preserve the sponsor's veto. FixLine puts that decision inside one Intelligent Contract, where independently selected validators fetch the allowed evidence and agree on criterion results.

Validators can return:

- `QUALIFIED`
- `NOT_QUALIFIED`
- `INSUFFICIENT_EVIDENCE`
- `SOURCE_UNAVAILABLE`

Only `QUALIFIED` releases funds, and the transfer is emitted on finalization.

## Architecture

```text
User → Next.js frontend → injected EIP-1193 wallet
     → GenLayer Studionet → FixLine Intelligent Contract
     → validator judgment / contract state → frontend
```

There is no application backend, database, worker, queue, hosted AI agent, API route, or authoritative server action. Contract state is canonical. Browser storage retains transaction identifiers only as a recovery convenience.

## Network and toolchain

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Repository-local GenLayer CLI: `0.39.1`
- Frontend SDK: `genlayer-js 1.1.8`
- Direct Mode: `genlayer-test 0.29.2`
- GenVM linter: `0.11.0`, pinned to the Studionet-compatible `v0.3.0-rc7` artifact for validation

Use only the repository scripts. Do not substitute a globally installed CLI.

## Product flow

1. Sponsor connects an injected wallet on chain 61999.
2. Sponsor funds and publishes a work brief.
3. The named contributor accepts.
4. The contributor submits a full commit SHA, canonical commit URL, and evidence for every criterion.
5. Anyone triggers validator assessment.
6. A qualifying result awards the fixed amount after finality. Other outcomes preserve the funds and allow the appropriate revision or retry path.
7. Expired work can be closed permissionlessly and unused funds return to the sponsor.

## Frontend

The Next.js App Router application provides:

- a document-oriented product entry page;
- a personal work desk reconstructed from contract reads;
- a structured brief authoring studio;
- a canonical work-order room;
- a revision delivery room;
- criterion-level evidence and decision presentation;
- injected-wallet connection, account changes, disconnect, and Studionet switching;
- a persistent transaction center that distinguishes submission from finality and execution success.

## Intelligent Contract

`contracts/fixline.py` owns work orders, submissions, evidence binding, accounting, authorization, terminal states, duplicate protection, validator assessment, and finality-safe transfers.

Important invariants:

- funding must exactly equal the award;
- one named contributor is the only eligible payee;
- brief terms and criteria cannot change after creation;
- a delivery is bound to an immutable revision and unique digest;
- no negative or uncertain result pays;
- every on-time delivery remains protected from expiry refunds until assessment and any scheduled retry complete;
- a work order can award at most once;
- award plus refund never exceeds original funding;
- terminal work cannot be reopened.

## Setup

```bash
npm install
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env.local
```

The included public configuration points to the deployed Studionet contract. The RPC and chain ID defaults are fixed to Studionet.

Run locally:

```bash
npm run dev
```

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run contract:cli
npm run contract:validate
npm run contract:test
npm run build
```

Contract tests cover exact funding, authorization, revision binding, duplicate delivery prevention, source provenance, withdrawal boundaries, qualifying consensus, uncertainty, and double-resolution prevention.

## Deployment

The contract deployment command uses the repository-local CLI:

```bash
npx genlayer@0.39.1 deploy \
  --contract contracts/fixline.py \
  --rpc https://studio.genlayer.com/api
```

Deployment requires an explicitly configured funded deployer account. Never commit its key. After deployment, set the public address in `.env.local`, rerun the full verification suite, and deploy the Next.js application.

## Current deployment

- Source repository: `https://github.com/lolaaa00/Fixline-`
- Contract: `FixLine`
- Address: `0xF2dedE7065a14C0c3b1a26f580A786fC6630dB86`
- Deployment transaction: `0xa396313d2d2593b67c3599d36fa0b39e099d46aba2b3e682dfaee57fa4efd262`
- Status: `FINALIZED` with `MAJORITY_AGREE` (five agreeing validators)
- Deployment sender: `0x7099f2F0d13A9e0C208A9E140f681334cc3D6B89`
- Deployed source commit: `eefbf54ed5ce336600dd254769ec47b87e72ccce`
- Contract explorer: `https://explorer-studio.genlayer.com/address/0xF2dedE7065a14C0c3b1a26f580A786fC6630dB86`
- Transaction explorer: `https://explorer-studio.genlayer.com/tx/0xa396313d2d2593b67c3599d36fa0b39e099d46aba2b3e682dfaee57fa4efd262`
- Frontend: `https://fixline-genlayer.vercel.app`

The production frontend was verified at desktop and 390px mobile widths. It loaded without browser console errors, displayed Studionet chain 61999, exposed the contract-backed desk, and presented a clear error when no injected wallet was available. A direct live read of `get_protocol_totals` returned zero funded, paid, refunded, and work-count values on the newly initialized deployment.

## Limitations

- V1 accepts public GitHub repositories and commit pages only.
- Tasks must be small enough for bounded public evidence to demonstrate.
- Private repositories, subjective design review, load testing, teams, partial milestones, and open contributor pools are intentionally unsupported.
- The contract's bounded wallet index is sufficient for V1, not a general discovery engine.
- Website availability and model judgment remain real sources of uncertainty; the contract represents them without paying.
