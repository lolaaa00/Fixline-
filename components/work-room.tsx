"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, FileCheck2, GitCommitHorizontal, Scale } from "lucide-react";
import { readContract } from "@/lib/contract";
import { formatDate, formatGen, shortAddress, STATUS_LABELS } from "@/lib/format";
import type { Submission, WorkOrder } from "@/lib/types";
import { useWallet } from "./wallet-provider";
import { TxAction } from "./tx-action";
import { DeliveryForm } from "./delivery-form";

const addressKey = (value: unknown) => String(value || "").toLowerCase();
const normalize = (value: unknown, id: number): WorkOrder => { const v=value as WorkOrder; return {...v,id,status:Number(v.status),submissionCount:Number(v.submissionCount),winningSubmission:Number(v.winningSubmission),award:BigInt(v.award),remaining:BigInt(v.remaining),createdAt:BigInt(v.createdAt),acceptBy:BigInt(v.acceptBy),deliverBy:BigInt(v.deliverBy)}; };
const normalizeSubmission = (value: unknown): Submission => { const v=value as Submission; return {...v,submittedAt:BigInt(v.submittedAt),assessedAt:BigInt(v.assessedAt),retryAfter:BigInt(v.retryAfter)}; };

function Loading() { return <div className="empty-state"><Clock3/><h2>Reading canonical state…</h2></div>; }

export function WorkRoom({ id }: { id: number }) {
  const wallet=useWallet(); const [work,setWork]=useState<WorkOrder|null>(null); const [submission,setSubmission]=useState<Submission|null>(null); const [error,setError]=useState("");
  const load=useCallback(async()=>{try{const next=normalize(await readContract("get_work",[id]),id);setWork(next);if(next.submissionCount>0)setSubmission(normalizeSubmission(await readContract("get_submission",[id,next.submissionCount])));else setSubmission(null);setError("");}catch(cause){setError(cause instanceof Error?cause.message:"Work order is unavailable.");}},[id]);
  useEffect(()=>{void load();},[load]);
  const criteria=useMemo(()=>{try{return JSON.parse(work?.criteria||"[]") as string[]}catch{return[]}},[work]);
  const evidence=useMemo(()=>{try{return JSON.parse(submission?.evidenceMap||"[]") as string[]}catch{return[]}},[submission]);
  if(error)return <div className="empty-state error"><h2>Unable to open work room</h2><p>{error}</p></div>;
  if(!work)return <Loading/>;
  const isSponsor=addressKey(wallet.account)===addressKey(work.sponsor); const isContributor=addressKey(wallet.account)===addressKey(work.contributor); const now=BigInt(Math.floor(Date.now()/1000));
  const canAccept=work.status===0&&isContributor&&now<=work.acceptBy; const canDeliver=[1,3,4].includes(work.status)&&isContributor&&now<=work.deliverBy; const canAssess=work.status===2&&!!submission; const canRetry=work.status===4&&!!submission&&now>=submission.retryAfter; const canWithdraw=work.status===0&&isSponsor; const canExpire=[0,1,3].includes(work.status)&&now>work.deliverBy;
  return <div className="room"><Link className="back-link" href="/work"><ArrowLeft size={15}/> Back to desk</Link>
    <header className="room-head"><div><div className="kicker">Work order {String(id).padStart(3,"0")}</div><h1>{work.title}</h1><p>{work.brief}</p></div><div className="award-stamp"><span>FIXED AWARD</span><strong>{formatGen(work.award)}</strong><i>{STATUS_LABELS[work.status]||"UNKNOWN"}</i></div></header>
    <div className="room-grid"><div className="room-primary">
      <section className="criteria-sheet"><header><div><span>ACCEPTANCE SHEET</span><h2>Every condition is mandatory.</h2></div><span>{criteria.length} criteria</span></header>{criteria.map((criterion,index)=><article key={criterion}><b>{String(index+1).padStart(2,"0")}</b><p>{criterion}</p>{submission&&<span className="criterion-result">{submission.outcome||"Awaiting assessment"}</span>}</article>)}</section>
      {submission&&<section className="submission-sheet"><div className="section-label"><GitCommitHorizontal/> Latest submission · {work.submissionCount}</div><div className="revision"><span>REVISION</span><strong>{submission.revision}</strong></div><div className="evidence-lines">{criteria.map((criterion,index)=><article key={criterion}><span>{index+1}</span><div><strong>{criterion}</strong><p>{evidence[index]||"No evidence mapping"}</p></div></article>)}</div><div className="link-row"><Link href={submission.artifactUrl} target="_blank">Open immutable revision <ExternalLink size={14}/></Link>{submission.checkUrl&&<Link href={submission.checkUrl} target="_blank">Open public checks <ExternalLink size={14}/></Link>}</div>{submission.outcome&&<div className={`decision-panel ${submission.outcome.toLowerCase()}`}><Scale/><div><span>VALIDATOR OUTCOME</span><h3>{submission.outcome.replaceAll("_"," ")}</h3><p>{submission.rationale}</p></div></div>}</section>}
    </div><aside className="room-aside"><section><div className="section-label">NEXT LEGITIMATE ACTION</div>{canAccept?<TxAction method="accept_work" args={[id]} onFinalized={load}>Accept assignment</TxAction>:canDeliver?<Link className="button primary block" href={`/work/${id}/deliver`}>{submission?"Submit a revised commit":"Deliver a commit"} <ArrowUpRight size={16}/></Link>:canAssess?<TxAction method="review_delivery" args={[id,work.submissionCount]} onFinalized={load}>Ask validators to assess</TxAction>:canRetry?<TxAction method="retry_review" args={[id,work.submissionCount]} onFinalized={load}>Retry unavailable review</TxAction>:canExpire?<TxAction method="close_expired" args={[id]} onFinalized={load}>Close and refund expired work</TxAction>:canWithdraw?<TxAction method="withdraw_unaccepted" args={[id]} onFinalized={load}>Withdraw before acceptance</TxAction>:<p className="muted">No action is available for this wallet and contract state.</p>}</section>
      <section><div className="section-label">IMMUTABLE CONTEXT</div><dl><div><dt>Sponsor</dt><dd>{shortAddress(work.sponsor)}</dd></div><div><dt>Contributor</dt><dd>{shortAddress(work.contributor)}</dd></div><div><dt>Repository</dt><dd><Link href={work.repository} target="_blank">Public source <ExternalLink size={12}/></Link></dd></div><div><dt>Accept by</dt><dd>{formatDate(work.acceptBy)}</dd></div><div><dt>Deliver by</dt><dd>{formatDate(work.deliverBy)}</dd></div><div><dt>Remaining</dt><dd>{formatGen(work.remaining)}</dd></div></dl></section>
      <section className="timeline"><div className="section-label">CONTRACT HISTORY</div><div className="timeline-item done"><i/><div><strong>Funded</strong><span>{formatDate(work.createdAt)}</span></div></div>{work.status>=1&&<div className="timeline-item done"><i/><div><strong>Accepted</strong></div></div>}{work.submissionCount>0&&<div className="timeline-item done"><i/><div><strong>{work.submissionCount} revision{work.submissionCount===1?"":"s"}</strong></div></div>}{work.status===5&&<div className="timeline-item done"><i/><div><strong>Awarded</strong></div></div>}</section>
    </aside></div>
  </div>;
}

export function DeliveryPage({id}:{id:number}) {
  const [work,setWork]=useState<WorkOrder|null>(null);const [error,setError]=useState("");
  useEffect(()=>{readContract("get_work",[id]).then(v=>setWork(normalize(v,id))).catch(e=>setError(e.message));},[id]);
  if(error)return <div className="empty-state error"><h2>Cannot prepare delivery</h2><p>{error}</p></div>;if(!work)return <Loading/>;
  let criteria:string[]=[];try{criteria=JSON.parse(work.criteria)}catch{}
  return <div className="page"><Link className="back-link" href={`/work/${id}`}><ArrowLeft size={15}/> Back to work room</Link><header className="page-title narrow"><div className="kicker">Delivery room · Work {String(id).padStart(3,"0")}</div><h1>Bind your evidence to one immutable revision.</h1><p>Validators will inspect only the frozen repository, this revision, and the public evidence mapped below.</p></header><div className="delivery-context"><FileCheck2/><div><strong>{work.title}</strong><span>{work.repository}</span></div></div><DeliveryForm workId={id} criteria={criteria} repository={work.repository}/></div>;
}
