"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalldataAddress } from "genlayer-js/types";
import { ArrowRight, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { useTransactions } from "./transaction-provider";
import { executionSucceeded, submitContract, waitForFinalized } from "@/lib/contract";
import { parseGen } from "@/lib/format";

const toCalldataAddress = (address: string) => {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("Enter a valid contributor wallet address.");
  return new CalldataAddress(new Uint8Array(address.slice(2).match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16))));
};
const epoch = (value: string) => BigInt(Math.floor(new Date(value).getTime() / 1000));

export function CreateBriefForm() {
  const wallet = useWallet(); const txs = useTransactions(); const router = useRouter();
  const [criteria, setCriteria] = useState(["", ""]); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setStatus("");
    if (!wallet.connected) return void wallet.connect();
    if (!wallet.correctNetwork) return void wallet.switchNetwork();
    if (!wallet.client) return;
    const data = new FormData(event.currentTarget); const id = txs.track("Fund work brief"); setBusy(true);
    try {
      const cleanCriteria = criteria.map(v => v.trim()).filter(Boolean);
      if (cleanCriteria.length < 1 || cleanCriteria.length > 8) throw new Error("Use between one and eight mandatory criteria.");
      const repository = String(data.get("repository") || "").trim();
      const parsed = new URL(repository);
      if (parsed.protocol !== "https:" || !["github.com"].includes(parsed.hostname.toLowerCase())) throw new Error("V1 accepts public GitHub repository URLs only.");
      const award = parseGen(String(data.get("award")));
      const acceptBy = epoch(String(data.get("acceptBy"))); const deliverBy = epoch(String(data.get("deliverBy")));
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (acceptBy <= now || deliverBy <= acceptBy) throw new Error("Acceptance must be in the future and delivery must follow acceptance.");
      txs.update(id, { stage: "signature" }); setStatus("Awaiting wallet approval…");
      const args = [toCalldataAddress(String(data.get("contributor"))), String(data.get("title")).trim(), String(data.get("brief")).trim(), repository.replace(/\/$/, ""), JSON.stringify(cleanCriteria), JSON.stringify(["github.com"]), acceptBy, deliverBy, award];
      const hash = String(await submitContract(wallet.client, "open_work", args, award));
      txs.update(id, { hash, stage: "submitted" }); setStatus("Submitted. Validators and the network are processing the transaction…");
      const receipt = await waitForFinalized(wallet.client, hash);
      if (!executionSucceeded(receipt)) throw new Error("The transaction finalized without a successful contract return.");
      txs.update(id, { stage: "finalized" }); setStatus("Brief funded and finalized."); router.push("/work"); router.refresh();
    } catch (cause) { const message = cause instanceof Error ? cause.message : "Could not fund this brief."; txs.update(id, { stage: "failed", error: message }); setStatus(message); }
    finally { setBusy(false); }
  };
  return <form className="brief-form" onSubmit={submit}>
    <section className="form-section"><div className="form-index">01</div><div><h2>People and award</h2><p>One sponsor, one named contributor, one fixed award.</p><div className="form-grid"><label>Contributor wallet<input name="contributor" placeholder="0x…" required /></label><label>Award in GEN<input name="award" inputMode="decimal" placeholder="10" required /></label><label>Accept by<input name="acceptBy" type="datetime-local" required /></label><label>Deliver by<input name="deliverBy" type="datetime-local" required /></label></div></div></section>
    <section className="form-section"><div className="form-index">02</div><div><h2>Public work</h2><p>Keep the task narrow enough to inspect from public evidence.</p><label>Brief title<input name="title" maxLength={100} placeholder="Add regression coverage for failed webhook retries" required /></label><label>Public GitHub repository<input name="repository" type="url" placeholder="https://github.com/owner/project" required /></label><label>Bounded work brief<textarea name="brief" maxLength={2400} rows={7} placeholder="Describe the observed problem, expected behavior, and important constraints…" required /></label></div></section>
    <section className="form-section"><div className="form-index">03</div><div><h2>Mandatory criteria</h2><p>Validators must be able to decide each item from the submitted revision and allowed public evidence.</p><div className="criteria-editor">{criteria.map((criterion, index) => <div className="criterion-input" key={index}><span>{String(index + 1).padStart(2, "0")}</span><textarea aria-label={`Criterion ${index + 1}`} value={criterion} maxLength={500} rows={2} onChange={event => setCriteria(v => v.map((item, i) => i === index ? event.target.value : item))} placeholder="A focused, observable condition…" required/><button type="button" aria-label={`Remove criterion ${index + 1}`} disabled={criteria.length === 1} onClick={() => setCriteria(v => v.filter((_, i) => i !== index))}><Trash2 size={16}/></button></div>)}</div><button className="text-action" type="button" disabled={criteria.length >= 8} onClick={() => setCriteria(v => [...v, ""])}><Plus size={16}/> Add criterion</button></div></section>
    <aside className="commitment-note"><ShieldCheck/><div><strong>Immutable after acceptance</strong><p>The contributor, repository, award, brief, criteria, and deadlines cannot be rewritten once the assignment is accepted.</p></div></aside>
    <div className="submit-row"><button className="button primary" disabled={busy}>{busy ? "Following finality…" : <>Fund and publish <ArrowRight size={17}/></>}</button>{status && <p role="status">{status}</p>}</div>
  </form>;
}
