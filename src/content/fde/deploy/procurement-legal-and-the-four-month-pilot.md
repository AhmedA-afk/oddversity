---
title: "Procurement, legal, and the four-month pilot"
phase: deploy
module: compliance-security-procurement
kind: lesson
summary: "The build takes six weeks. The deal takes closer to six months. This page walks through why the gap exists — security review, legal negotiation, procurement cycles, and a trust-building pilot — and what an FDE actually does during the four months that are not spent writing code."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Lay out the five stages a mid-size enterprise deal passes through after the technical build is done, and roughly what happens at each.
  - Explain, with a real example, why a fast technical build does not translate into a fast go-live.
  - List three things an FDE should be doing during the pilot stretch besides waiting for legal to finish.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
---

Morgan Stanley's rollout of a GPT-4-based research tool for its wealth-management advisors is the cleanest public example of this gap. The technical pipeline — retrieval over the firm's research corpus, wired into GPT-4 — took about six to eight weeks. Reaching 98% advisor adoption took roughly four additional months of trust-building and eval rigour on top of that. The build was the fast part. The four months were not slack; they were where the actual risk of the deal got retired, one skeptical stakeholder and one eval result at a time.

If you plan an engagement assuming the calendar looks like the build, you will either promise a go-live date you cannot hit, or spend the four months anxious and idle instead of using them. Neither is necessary once you know what normally happens in that stretch.

## The five stages after "it works in the demo"

**1. Technical sign-off.** The people who watched the demo confirm it actually does what was promised, usually with a slightly harder version of the same test than the one in the demo. This is fast, days to two weeks, if the demo was honest.

**2. Security review.** The questionnaire from the previous lesson, plus follow-up calls, plus sometimes a formal pentest requirement before production data touches the system. Weeks to a couple of months depending on the customer's regulatory posture — a co-operative bank's review will run longer than a mid-size manufacturer's.

**3. Legal negotiation.** The Master Services Agreement, a Data Processing Agreement if personal data is involved, liability caps, indemnification, SLAs, and — for an AI product specifically — increasingly common clauses about model behaviour, output ownership, and what happens if the model says something wrong. This stage moves at the speed of two legal teams' calendars, not yours, and it is the stage most likely to stall for reasons that have nothing to do with your engineering.

**4. Procurement and budget approval.** Even once legal and security are satisfied, the deal often has to clear a purchase-order process, a budget cycle, or a committee that meets monthly or quarterly. A district administration's procurement cycle may be tied to a fiscal year in a way no amount of urgency from you will move.

**5. Pilot and adoption.** The system is live for a limited group, under real usage, being judged not on whether it works but on whether people trust it enough to change how they do their job. This is the stage Morgan Stanley's four months mostly describes, and it is the stage most FDEs underestimate, because it is the one that has nothing to do with code.

These stages overlap in practice — legal often runs in parallel with security review, and a pilot can start before the final contract is signed if both sides are comfortable with a limited-scope agreement — but none of them compress just because your build finished early.

## Why the pilot stage specifically takes months, not weeks

Technical correctness is necessary and not sufficient. An advisor at Morgan Stanley did not distrust the tool because it gave wrong answers; the tool had to prove, across enough real queries and enough time, that it was reliable enough to change a habit the advisor had built over years. Trust of that kind accumulates through repeated correct experience, not through a single successful demo, and there is no engineering shortcut that substitutes for the calendar time it takes to accumulate.

A useful way to think about the pilot stage: it is where the eval work from earlier in this path pays off. A pilot with a strong, domain-expert-labelled eval set that you can point to when someone asks "how do we know this is right" moves faster than a pilot running on vibes, because every skeptical question has an answer that is a number, not a reassurance.

## What an Indian enterprise deal adds to this timeline

The shape holds in India with a few additions worth planning for explicitly. A regulated customer — a co-operative bank under RBI's outsourcing framework, for instance — may have an internal outsourcing committee that has to approve the engagement before legal even starts drafting, which is a stage the Morgan Stanley example does not have to describe because it predates it. A government or PSU customer's procurement stage is frequently the longest of the five, tied to tender processes and fiscal-year budget cycles rather than a purchasing manager's discretion. Build slack into your own expectations here rather than into the customer's promises — you cannot move their calendar, but you can decide not to be the bottleneck when it finally does move.

## What an FDE does during the four months

The temptation is to treat this stretch as dead time and either disengage or, worse, keep building features nobody has asked to see yet. Neither is the right use of the time.

- **Keep the eval current.** New edge cases surface during pilot usage that were not in the original labelled set. Add them, re-run, and be ready to show the trend line, not just a static number.
- **Run structured check-ins with the actual users, not just the sponsor.** The champion who bought the deal is not the person whose trust you need to earn; that is the advisor, the clinician, the clerk actually using the system daily. Their specific, concrete complaints are what the pilot is for.
- **Prepare the UAT and rollout plan before it is asked for.** A written plan for how the pilot group expands to the full rollout, with named milestones, signals to a skeptical stakeholder that you are already thinking past the pilot, which itself builds trust.
- **Stay visible to procurement and legal without chasing them.** A brief, factual weekly update — what changed in the pilot, what the eval shows — keeps you present in a process you do not control, without becoming the person nagging a legal team that is already moving as fast as it can.

## The FDE point

The build being fast is not the achievement customers are actually buying. What they are buying is confidence that the system will still be right in six months, under real load, in front of a regulator or an auditor if it comes to that. The four months are where that confidence gets built, and an FDE who understands this spends them working the trust problem as deliberately as they spent the six weeks working the technical one.
