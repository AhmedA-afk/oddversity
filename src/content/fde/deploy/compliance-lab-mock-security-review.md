---
title: "Lab: pass a mock security review"
phase: deploy
module: compliance-security-procurement
kind: lab
summary: "Fill out a real security questionnaire for a real project of yours, against a fictional but demanding reviewer, then defend three of your weakest answers out loud. The pass condition is not a clean scorecard: it is answers that survive a skeptical follow-up."
duration: 4 h
updated: "2026-09-02"
outcomes:
  - Complete a full security questionnaire for a real system you have built or deployed, with every answer traceable to an actual control.
  - "Assemble the evidence package a reviewer would ask for alongside the questionnaire: architecture diagram, data flow, subprocessor list."
  - Defend your weakest three answers against a written follow-up, in the reviewer's own skeptical voice.
artifact: A completed security questionnaire, an evidence package, and a written response to a reviewer's follow-up on your three weakest answers.
---

Every earlier lesson in this module builds toward this lab. You now know what each compliance regime changes architecturally, you have twenty model answers to draw on, and you understand why the pilot stretch exists. This lab is where that becomes a real, defensible document instead of something you can only describe in the abstract.

## Scenario

You are the FDE on a deal with **Arogya Hospital Group**, a fictional mid-size Indian hospital chain evaluating a system you have built — use a real project of yours, or Atlas from the earlier lessons if you have nothing else on hand. Their security lead, Priya Deshmukh, has sent back a twenty-two-question security questionnaire covering the categories from the walkthrough lesson, plus a note: "Given we hold patient data, our legal team will want a follow-up call on whichever three answers look weakest. Please flag those yourself so we can prioritise."

That instruction is the actual lab. A reviewer who tells you which answers she will push on is giving you a gift most real reviewers do not — use it.

## Steps

1. **Pick your system.** A real project you built and can describe accurately is strongly preferable to a hypothetical one, because the whole point is that every answer has to be traceable to something that actually exists. If you have no suitable project, use Atlas as described across the earlier deploy lessons and be explicit about which parts are assumed rather than verified.
2. **Write the twenty-two questions.** Use the twenty from the security-questionnaire lesson, plus add two specific to a healthcare customer: "Do you have or plan to obtain any healthcare-specific certification (e.g., ISO 27001, a HIPAA-equivalent internal control set)?" and "How would patient data be excluded from any AI model's training data, and can you show us the mechanism, not just the policy?"
3. **Answer every question in writing**, following the three rules from the walkthrough lesson: no more confidence than you have, a reason behind every "not applicable," and an honest escalation flag on anything outside your authority to answer (legal terms, subprocessor certifications you do not control).
4. **Assemble the evidence package.** A one-page architecture diagram showing where data enters, is stored, and leaves your system. A data flow description naming every subprocessor (cloud provider, model API, logging vendor) and what each one can see. A credential inventory, in the shape from the earlier secrets lesson, for anything with access to patient data.
5. **Flag your three weakest answers**, honestly. These should be the ones where your actual control is thinnest — an untested disaster-recovery plan, no formal pentest yet, a telemetry pipeline whose exact data scope you are not fully certain of. Do not pick easy ones to make the exercise feel safer; the value of the lab is in confronting the real gaps.
6. **Write Priya's follow-up, in her voice, for each of the three.** A specific, skeptical question that a real hospital security lead would ask given your flagged answer. Example shape: "You said patient identifiers are not included in the audit log. Can you show me the code path that enforces that, not just describe it?"
7. **Answer each follow-up.** For a genuine gap, the honest answer is a remediation plan with a real timeline, not a reassurance. For an answer that is actually solid but was stated weakly, rewrite it with the specific mechanism named.
8. **Write a one-paragraph verdict**, as if you were Priya deciding whether to recommend proceeding to a pilot. State plainly whether you would, and what condition (if any) she would attach.

## Definition of done

- All twenty-two questions answered in writing, each one traceable to a real control, a real gap with a plan, or an honest escalation.
- An evidence package exists: architecture diagram, data flow/subprocessor list, credential inventory.
- Three weakest answers are explicitly flagged, with a written skeptical follow-up and a real response to each — not a rewrite that quietly avoids the hard question.
- The closing verdict, written from the reviewer's perspective, states a real recommendation, not a hedge.

## How this goes wrong

**Every answer reads as equally strong.** If nothing in your questionnaire looks weak, you either built something unusually mature or you are not being honest with yourself about your own gaps — the latter is far more common, and a real reviewer will find the gap you did not flag, at a worse moment than this lab.

**The follow-up questions are softballs.** Writing Priya's follow-up in a way that is easy to answer defeats the exercise. A good test: if you can answer your own follow-up in one sentence with no new information, write a harder one.

**The evidence package doesn't match the questionnaire's claims.** If your written answer says "row-level security enforces tenant isolation" but the architecture diagram shows a single shared table with no isolation column drawn, that mismatch is exactly what a real reviewer catches, and catching it yourself here is far cheaper than catching it in a live call with a deal on the line.

**The verdict avoids a real answer.** "It depends on further discussion" is not a verdict. A reviewer in a real deal has to actually decide whether to recommend proceeding; practise making that call explicitly, with a stated condition attached if the answer is conditional, because that is the decision you are trying to earn from her in the real engagement.
