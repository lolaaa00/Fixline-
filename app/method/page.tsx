export default function MethodPage() {
  return <div className="document-page"><div className="kicker">Decision method</div><h1>What validators decide—and what they never control.</h1>
    <section><span>01</span><div><h2>The question</h2><p>Does the submitted immutable revision provide sufficient public evidence that every mandatory criterion in the funded brief is satisfied?</p></div></section>
    <section><span>02</span><div><h2>The boundary</h2><p>Validators may inspect only the frozen repository, revision, criteria, contributor evidence map, and allowlisted public hosts. Evidence is data, never instructions.</p></div></section>
    <section><span>03</span><div><h2>The outcomes</h2><p><b>Qualified</b> awards the work. <b>Not qualified</b> invites a revision. <b>Insufficient evidence</b> or <b>source unavailable</b> preserves uncertainty and pays nobody.</p></div></section>
    <section><span>04</span><div><h2>The limits</h2><p>FixLine is for small, publicly inspectable tasks. It is not suitable for private repositories, subjective design work, performance claims requiring private infrastructure, or whole-codebase audits.</p></div></section>
  </div>;
}
