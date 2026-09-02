---
title: "Lab: write the memo for your own capstone"
phase: product
module: the-feedback-loop-in-practice
kind: lab
summary: "A three-hour working session that turns one finished capstone into the three artifacts the loop produces: a customer-learning log, a generalise-or-one-off memo, and a labelled failure set for research."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Produce a component-by-component classification of your own build with stated evidence for each call.
  - Estimate and defend a reuse percentage for the engagement.
  - Hand a second engineer a memo they can act on without having met the customer.
artifact: Three files committed to the capstone repository — customer-learnings.md, generalise-or-one-off.md, and failures.jsonl — plus a reuse figure in the repository README.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
  - "https://review.firstround.com/so-you-want-to-hire-a-forward-deployed-engineer/"
  - "https://engineering.ramp.com/post/forward-deployed-engineering"
  - "https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a"
  - "https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring"
---

Pick one capstone you have finished. If you have not finished one yet, run this lab against the most complete project you have, including work you did in a job. The lab works on anything you built for a specific user with a specific problem.

Block three uninterrupted hours. The output is three files in the project's repository and one number in its README. You will use all four in interviews.

## What you need in front of you

- The repository, with the commit history reachable.
- Any notes from the discovery conversation, however scrappy.
- The eval set, if the project has one.
- A blank file called `customer-learnings.md`.

If you kept no notes during the build, start by reconstructing from commits and messages. Reconstruction is worse than the real thing and it is much better than nothing; note in the file that it was reconstructed, and then keep notes properly next time.

## Steps

**1. Reconstruct the customer-learning log (35 minutes).**
Write between four and ten entries in the format from [the customer-learning document](/roles/forward-deployed-engineer/product/what-i-learned-from-customers-this-week): origin, what they said, what they do today, what broke precisely, your classification. Use real quotes where you have them and mark paraphrases as paraphrases. Include at least two entries about things that did not work. If every entry is a success, you are writing a case study, not a log.

**2. Inventory the components (25 minutes).**
List every distinct piece of the system in a table: ingestion, parsing, permission model, retrieval, prompt or agent logic, evals, UI, deployment scripts, observability, anything customer-specific. Aim for between eight and twenty rows. Too few and the classification is meaningless; too many and you are listing files.

**3. Classify each one (30 minutes).**
Bespoke, configurable, or product. Default is bespoke. For anything you mark configurable, name the second customer with a different value; for anything you mark product, name two blocked customers and the person who would own it. For the fictional customers in this path, use the other bootcamps and drills as your second and third customers — they are written to overlap deliberately.

Write the reason in one sentence per row. If the reason is "it's well written", the row is bespoke.

**4. Compute the reuse figure (10 minutes).**
Count components classified configurable or product, divided by total components. Write the number down even if you hate it. Colin Jarvis's stated targets are roughly 20% reusable in a first engagement and about 50% by the third; if this is your first project and you got 60%, you have almost certainly over-classified, so go back and demote the weakest three rows.

**5. Write the two judgement sections (25 minutes).**
"The two calls I am least sure about", with what evidence would change each. Then "what I recommend product does next quarter" and "what I recommend product does not do". The second recommendation is the one interviewers probe, because arguing against your own work is the hard part. Ramp's field team lists questioning all requirements among its principles; apply it to yourself here.

**6. Build the failure set (35 minutes).**
Pull twenty or more failing cases out of your eval runs into `failures.jsonl`, in the format from [feeding research](/roles/forward-deployed-engineer/product/feeding-research-not-just-product): id, input reference, expected, observed, hypothesis, reproduction conditions, label source. Run the four-question classification on each and keep only the ones that survive to level four, model behaviour, in a separate section. If none survive, say so explicitly in a comment at the top of the file. "All 34 failures were ours" is an honest and creditable finding.

**7. Strip the confidential material (10 minutes).**
If any of this touched real customer or employer data, rewrite every example as a synthetic one that reproduces the same structural failure, and verify it still reproduces. Do this before the commit, not after.

**8. Get it read (10 minutes to send, however long they take).**
Send the memo to one engineer who has never seen the project. Ask exactly one question: which component would you have classified differently, and why. Record their answer at the bottom of the memo. Vin Vashishta's list of FDE competencies puts the product feedback loop alongside end-to-end ownership; a memo nobody read has exercised neither.

**9. Update the README (5 minutes).**
One line: what the system does, who for, the measured outcome if there is one, and the reuse figure with its date. This is the line a recruiter reads.

## Definition of done

- `customer-learnings.md` has at least four dated entries, at least two of which describe something that failed.
- `generalise-or-one-off.md` has a component table where every row carries a bucket and a one-sentence reason, plus the two uncertain calls, plus a do-not-do recommendation.
- Every "configurable" row names a second customer; every "product" row names two and an owner.
- `failures.jsonl` has 20 or more entries with reproduction conditions and a label source, and a stated count of how many were model-level.
- A reuse percentage appears in the README with the date it was computed.
- One external reader has disagreed with at least one classification in writing.
- Nothing in any of the three files is confidential.

## How this could go wrong

**You classify everything as product.** The most common outcome on a first attempt, and it reads as inexperience to anyone who has run a real engagement. The fix is mechanical: for each product row, try to name the second blocked customer out loud. If you cannot say the name, demote it.

**You write the memo as marketing.** If the two-uncertain-calls section is empty or hedged into meaninglessness, the memo has become a brochure. First Round's guide makes the FDE-versus-services distinction turn on whether the work feeds product development; a document that only praises the work feeds nothing.

**The failure set is all prompt failures you already fixed.** That is fine and worth stating, but do not relabel them as model failures to make the file look impressive. The four-question ladder exists to stop exactly that, and an interviewer who works on models will spot it in thirty seconds.

**You leak the customer.** The single unrecoverable error in this lab. A public repository with a real employer's document structure, field names, or thresholds is a professional problem, not a portfolio. Synthesise first, commit second.

**You do it once.** The memo is worth roughly nothing as a single artifact and a great deal as a series. Repeat this lab after every capstone and every bootcamp in [field practice](/roles/forward-deployed-engineer/practice/how-capstones-are-graded). By the end of the path you will have five of them, and the trend in the reuse figure across five projects is a stronger claim about you than any single project.

## What to do with it afterwards

Publish the memo, not just the code. Ritika Singh's line, quoted in Deep Engineering's piece on FDE hiring, is that shipping without extracting the pattern makes you a very expensive contractor and extracting without shipping makes you an analyst. The repository proves you shipped. The memo proves you extracted. Very few candidates bring both, and bringing both is the entire argument of this phase.
