---
title: "The security questionnaire: a walkthrough with answers"
phase: deploy
module: compliance-security-procurement
kind: lesson
summary: "Every enterprise deal past a certain size stalls on a spreadsheet of two hundred questions before it stalls on anything technical. This page gives you twenty of the questions that appear in almost every version of that spreadsheet, with the model answer for each, and the discipline for answering the ones you cannot."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Answer the twenty most common security-questionnaire questions with specific, defensible language instead of vague reassurance.
  - Distinguish a question you can answer yourself from one that needs legal, security, or the customer's own compliance team before you respond.
  - Write an answer that survives a follow-up call, not just the first read.
artifact: A filled security questionnaire template for one of your own projects, with every answer traceable to an actual control, not an aspiration.
---

The security questionnaire is not an obstacle between you and the deal. It is the customer's security team doing their job, and how well you answer it is one of the first signals they get about whether your engineering is as careful as your demo suggested. A vague answer to a specific question reads as a red flag even when the underlying system is fine, because it suggests you do not actually know your own architecture.

Three rules before the questions:

1. **Never answer with more confidence than you have.** "We encrypt data at rest" is a claim; "we encrypt data at rest using AES-256 via our cloud provider's managed encryption, with keys rotated per our provider's default schedule" is an answer that survives a follow-up. If you do not know the specific mechanism, say "confirming and will follow up" rather than guessing.
2. **"Not applicable" needs a reason, not just the phrase.** "N/A — we do not store payment card data; billing is handled entirely by [processor] via a hosted checkout, and no card data ever reaches our systems" is a real answer. "N/A" alone reads as evasive.
3. **Route what is not yours to answer.** Anything about your legal entity's insurance coverage, indemnification terms, or your subprocessors' own certifications belongs to legal or to whoever owns the vendor relationship with that subprocessor. Answering it yourself, wrong, is worse than escalating it.

## Twenty questions, with model answers

**1. Where is customer data physically stored, and can we choose the region?**
"Primary data is stored in [region], using [cloud provider]'s regional isolation. For customers with a data-residency requirement, we support pinning to a specific region at provisioning time — confirm before contracting if this applies to you."

**2. Is data encrypted at rest and in transit? What algorithms?**
"At rest: AES-256 via our cloud provider's managed encryption. In transit: TLS 1.2 or higher, enforced at the load balancer; we reject connections below that. Key management follows our provider's managed key rotation; describe your own if you manage keys directly."

**3. Who has production access, and how is it granted and revoked?**
"Access is granted through [SSO/IdP], scoped by role, and reviewed quarterly. Revocation is automatic on offboarding through our IdP's deprovisioning workflow, and we can provide the access review log for the most recent cycle."

**4. Do you have a SOC 2 report, and can we see it?**
"[State your actual status honestly: 'Yes, Type II, available under NDA' or 'We are in our first observation period for Type II, current status is X' or 'Not yet; here is our internal control framework and roadmap.'] Never claim a report you do not have."

**5. What happens to our data if we terminate the contract?**
"Data is retained for [period] post-termination to allow export, then permanently deleted, with deletion confirmed in writing. Export is available in [format] at any point during the contract."

**6. Do you use subprocessors, and who are they?**
"Yes: [cloud provider], [model API provider], [logging/APM vendor if applicable]. A current subprocessor list is maintained at [location] and customers are notified of additions per our DPA."

**7. If you use an LLM, is our data used to train the model?**
"No. We use [provider]'s API under a data processing agreement that excludes API data from training, per their published policy — link the specific policy, do not paraphrase it from memory."

**8. How do you prevent one customer's data from being visible to another?**
"[Describe your actual isolation model precisely: 'Row-level security enforced at the database layer, tested in our test suite' or 'Single-tenant database per customer, no shared schema.'] Name the mechanism, not just the intent."

**9. Is there a way for our security team to audit your environment?**
"We support a right-to-audit for [enterprise/regulated tier] customers, typically satisfied by our SOC 2 report plus a call with our engineering lead; a full on-site audit is negotiable and should be scoped in the MSA."

**10. What is your incident response process, and how fast do you notify us?**
"We notify affected customers within [your actual committed window] of confirming an incident affecting their data, per our incident response runbook. [If you don't yet have a formal committed SLA, say so and state what you can commit to now.]"

**11. Do you conduct penetration testing? How often, and can we see results?**
"[State honestly: annual third-party pentest, most recent summary available under NDA; or, if not yet done, state your plan and timeline honestly rather than implying a test that hasn't happened.]"

**12. How do you handle secrets and credentials for accessing our systems?**
"We hold no long-lived credential to your systems by default; access uses [workload identity / short-lived tokens], described in the credential-inventory table in our deployment documentation." (This is the answer the lesson on secrets and service accounts earlier in this phase exists to make true, not just claimed.)

**13. What logging exists for actions taken on our data, and how long is it retained?**
"Every read and write to customer data is logged with actor, timestamp, and action, retained for [period], stored [where], and available for export on request."

**14. Do you have a documented business continuity / disaster recovery plan?**
"Yes: RPO of [X], RTO of [Y], tested [frequency]. [If untested or informal, say so — a customer's follow-up call will find out either way, and finding out from you is better than finding out from a failed test.]"

**15. How are employees vetted and trained on security?**
"Background checks at hire per [policy]; annual security awareness training; access to production systems requires [MFA / a specific control]."

**16. Is multi-factor authentication enforced for all access to systems handling our data?**
"Yes, enforced at the IdP level for all production access, no exceptions." (If this is not true, this is a gap to close before the deal, not a question to soften in the answer.)

**17. What is your patch and vulnerability management process?**
"Dependencies are scanned [tool, frequency]; critical vulnerabilities are patched within [your actual SLA]; the process is [describe briefly, e.g., 'automated PRs via Dependabot, reviewed and merged within our standard change process']."

**18. Do you support single sign-on (SAML/OIDC) for our users?**
"Yes, via [SAML 2.0 / OIDC], compatible with [Okta, Azure AD, etc.] — confirm your specific IdP during technical scoping."

**19. What is your policy on data used for product analytics or telemetry?**
"[Describe exactly what telemetry is collected, whether it can include customer content, and whether it can be disabled or scoped for this customer — this is a common and legitimate source of follow-up, especially for regulated customers, and vague answers here get escalated fast.]"

**20. Who at your company owns security, and how do we reach them if we find an issue?**
"[Name, or role if the person changes,] is our security point of contact; issues can be reported to [channel — a monitored email, not a personal inbox] and are acknowledged within [your actual commitment]."

## What to do with a question you cannot answer well

Do not invent a control that does not exist. Write the true current state, plus a committed date if you have a real roadmap, and move on. A customer's security team has seen a thousand of these documents; a gap stated plainly with a credible remediation plan reads as more trustworthy than a suspiciously perfect scorecard, and it is far less likely to blow up in the follow-up call that always comes for the too-good answers.

## The FDE point

You will fill in dozens of these across an FDE career, and the temptation every time is to speed through with confident-sounding boilerplate. Resist it. The questionnaire is read by a person whose entire job is finding the gap between what you claimed and what is actually true, and every answer you cannot defend on a follow-up call costs more trust than a well-explained honest gap ever would. The lab later in this phase, a mock security review, is built to give you practice defending exactly this kind of answer out loud, under a skeptical question, before a real deal is on the line.
