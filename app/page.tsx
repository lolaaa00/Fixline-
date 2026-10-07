import Link from "next/link";
import { ArrowUpRight, Braces, CheckCircle2, GitCommitHorizontal, Scale } from "lucide-react";

export default function HomePage() {
  return (
    <div className="landing">
      <section className="masthead">
        <div className="kicker">Consensus-settled software work</div>
        <h1>Acceptance should not depend on who holds the budget.</h1>
        <p className="lede">FixLine freezes a public engineering brief, its acceptance criteria, and its award. A named contributor submits an immutable revision. GenLayer validators decide whether the work qualifies.</p>
        <div className="actions">
          <Link className="button primary" href="/briefs/new">Fund a work brief <ArrowUpRight size={17} /></Link>
          <Link className="button quiet" href="/work">Open your desk</Link>
        </div>
      </section>
      <section className="principle-strip" aria-label="How FixLine works">
        <article><Braces /><span>01</span><h2>Write the test</h2><p>Freeze a bounded brief and objective acceptance criteria before anyone starts.</p></article>
        <article><GitCommitHorizontal /><span>02</span><h2>Pin the work</h2><p>The contributor submits an immutable public revision and maps evidence to every criterion.</p></article>
        <article><Scale /><span>03</span><h2>Remove the veto</h2><p>Validators inspect the allowed evidence. Neither party unilaterally controls payment.</p></article>
        <article><CheckCircle2 /><span>04</span><h2>Settle at finality</h2><p>Only a finalized qualifying result releases the fixed award.</p></article>
      </section>
      <section className="field-note">
        <div className="note-index">WHY THIS EXISTS</div>
        <div><h2>A small, deliberate trust boundary.</h2><p>FixLine is not a freelance marketplace and does not decide whether arbitrary work is “good.” It handles one narrow case well: a sponsor and contributor agree on public, inspectable criteria but should not have to trust one another to adjudicate the result.</p></div>
      </section>
    </div>
  );
}
