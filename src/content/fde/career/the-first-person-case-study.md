---
title: "The first-person case study: \"I\", not \"we\""
phase: career
module: proof-of-work
kind: lesson
summary: An interviewer who hears "we" cannot tell what you actually did. The fix is not arrogance, it is precision, naming your specific contribution inside a team effort, and this page shows the rewrite in practice on real before-and-after sentences.
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain why interviewers flag "we" language as a specific, named rejection pattern rather than a style preference.
  - Rewrite a team accomplishment into a first-person sentence that names your specific contribution without erasing your teammates.
  - Apply the same rewrite to a capstone or bootcamp artifact from this path.
artifact: A rewritten, first-person paragraph describing your most recent capstone or bootcamp, with every "we" replaced or justified.
sources:
  - https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
---

Two independent sources, an FDE candidate's own account of a real loop and an aggregated guide built from many candidates' outcomes, land on the same specific rejection pattern. This page treats it as a rule worth following exactly rather than as vague advice to "sound more confident."

## Where this rule comes from

The candidate who documented their ElevenLabs FDE loop in full on Exponent describes the recruiter screen pressing on this directly: "they keep pushing on individual ownership," with the explicit ask to "be specific about what you built yourself." That is stage one of a five-stage loop, before any code is written or any case study is discussed. Separately, Exponent's aggregated guide, built across many candidates' reported experiences, lists "saying 'we' instead of 'I'" as one of a short list of recurring reasons candidates are rejected. Two different data sources, a first-person account and an aggregate across many loops, converge on the same specific phrasing problem. That convergence is why this gets its own page rather than a bullet point somewhere else.

## Why interviewers actually care

An interviewer cannot verify a claim about a team. "We built a RAG pipeline that cut review time by sixty percent" tells them nothing about what you, specifically, are capable of doing again at their company, where the team will be different or nonexistent. It could mean you wrote the retrieval logic, or it could mean you sat in the standups. The FDE role in particular is one where, per the FDE-DIGEST, you are frequently the only engineer on site, sometimes the only technical person in the room. A resume or interview answer built entirely on "we" gives an interviewer no way to distinguish someone who has done that from someone who has only watched it happen.

This is not a demand for false solo credit. It is a demand for precision about which parts of a team effort were actually yours.

There is a second, quieter reason this matters specifically for this role. Ritika Singh's line, quoted elsewhere in this module, is that shipping without extracting the pattern makes you a very expensive contractor, and extracting patterns without shipping makes you an analyst. An interviewer testing for that distinction needs to know which actions in your story were yours, because the pattern-extraction half of the job, the generalise-or-one-off judgement, is a personal habit of noticing, not a team output. "We noticed a pattern across customers" is close to meaningless; "I noticed the same redaction requirement had come up in three engagements and wrote it up as a proposed product feature" is exactly the kind of sentence the role is built around, and it only works in the first person.

## The rewrite, in practice

The fix has three moves: name the team honestly, then carve out your specific piece, then state the outcome you personally can defend under a follow-up question.

**Before:** "We built an internal tool that automated ticket triage for the support team."

**After:** "I designed and wrote the rules engine that routed incoming tickets; a teammate built the front-end queue view. My part cut the average time-to-first-response from around four hours to under twenty minutes, measured against two weeks of ticket logs before and after."

**Before:** "Our team ran a pilot with a customer and got them onto the new platform."

**After:** "I ran the discovery interviews with the customer's operations lead, wrote the data-mapping spec that our team built against, and personally handled the cutover weekend. The pilot moved from a stated timeline of six weeks to shipped in four."

**Before:** "We identified that the eval harness needed to be rebuilt for the new use case."

**After:** "I noticed our existing eval harness was silently passing cases with malformed inputs, wrote twenty new labelled examples with a domain expert, and rebuilt the harness to catch that class of failure. Two teammates then reused it for their own projects."

Notice the pattern. Each "after" version still acknowledges the team, honestly, in the same sentence. It does not erase your teammates or claim their work. It just stops hiding the boundary of your own contribution behind a plural pronoun. That distinction, generous about the team but precise about your own edge, is what an interviewer following up with "which part did you do" wants to hear reflected before they even ask.

## Where to apply this before your next loop

Go back through the write-up for your most recent bootcamp or capstone in this path. Every capstone in this path is built around a decision memo and a generalise-or-one-off memo; both of those documents are natural places to practise this rewrite, because they force you to state, specifically, what you decided and why, not what "the team" decided. If a capstone genuinely was solo work, the fix is even simpler: just stop writing "we" out of habit. Deep Engineering's 30/90-day frame for proof-of-work, covered later in this module, works the same way, it asks for a baseline you measured, an improvement you shipped, and a lesson you converted, all first person by construction. Practise writing about your own work this way before an interviewer forces the distinction on you live.

One last check before you use any of this in a real interview: read your rewritten sentences back and ask whether they would survive a follow-up question asked by someone who was actually in the room. If a teammate reading your "after" sentences would object that you overstated your part, the rewrite has gone too far the other way, into the false-solo-credit failure this page opened by ruling out. The target is not maximum credit. It is an accurate, checkable account of the boundary between what you did and what the team around you did, stated plainly enough that a stranger could repeat it back correctly after hearing it once.
