---
title: "Quiz: Classifying Hallucination Types"
track: "hallucinations"
status: live
summary: "Twelve prompt-context-output cases to place on the factual/faithfulness and intrinsic/extrinsic axes and name the surface mode."
duration: "12 min read"
---

Each item gives you a prompt, whatever context the model had, and its output. Classify before you open the answer — the point of this quiz is to practice using the input, not the output, as evidence.

**Q1.** Context given to a support bot: *"Refunds are processed within 5 business days per our policy document."* User asks about refund timing. The bot answers: *"Refunds are processed within 3 business days."*

A. Factual, intrinsic
B. Faithfulness, intrinsic
C. Faithfulness, extrinsic
D. Not a hallucination — 3 days is faster, which benefits the customer

<details><summary>Answer</summary>

**Correct: B.** The bot directly contradicts the "5 business days" already stated in the document it was given — checkable with nothing but that document, which makes it intrinsic, and the mismatch is against the source it was handed, not the real world, which makes it faithfulness.

- **A** bakes in an assumption about the real world that isn't the actual bug. It's true this is also intrinsic (see [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination)), but labeling the axis "factual" misses that the model never needed to consult the world at all — it just ignored what was in front of it.
- **B** is correct.
- **C** would require the document to be silent on refund timing. It isn't — it states a specific, conflicting number, which is exactly what makes this intrinsic rather than extrinsic.
- **D** judges the answer by which number sounds nicer to a customer instead of whether it matches the source it was supposed to reflect. A support answer that quotes the wrong SLA is a faithfulness failure regardless of which number is more appealing.

</details>

**Q2.** Source (an internal memo, never updated): *"Our standard support SLA is 48 hours."* The team actually moved to a 24-hour SLA last quarter. Asked to summarize the memo, a model answers: *"Support SLA: 24 hours."*

A. Not a hallucination — the answer matches current real-world policy
B. Factual hallucination, extrinsic
C. Faithfulness hallucination — correct about the world, but not what the memo says
D. Faithfulness hallucination, but only because the real-world fact is irrelevant here

<details><summary>Answer</summary>

**Correct: C.** This is the "world-accurate but unfaithful" case from [the master-axis lesson](/learn/hallucinations/factual-vs-faithfulness-distinction): factually right about current policy, and a faithfulness violation, because the task was "what does the memo say," and the memo says something else entirely.

- **A** confuses being right about the world with being faithful to the document that was actually asked about. Those are different rubrics, and this answer fails the one that was in play.
- **B** mislabels the axis — this isn't a factual hallucination at all, since the claim matches reality. Calling it factual would send someone to "fix the model's knowledge," which was never the problem.
- **C** is correct.
- **D** is the tempting trap: the real-world fact isn't irrelevant, it's exactly what makes this case worth including. The label describes which rubric the output failed (faithfulness), not a judgment that the other rubric (factual accuracy) doesn't matter here.

</details>

**Q3.** A retrieved spec sheet (outdated, never updated after a platform upgrade) says: *"Max upload size: 10MB."* The real current system limit is 25MB. Asked what the max upload size is, a model — using the spec sheet as its only source — answers: *"10MB."*

A. Faithfulness hallucination — contradicts current reality
B. Factual hallucination — faithfully quoted a source that is itself wrong about the world
C. Not a hallucination — the model correctly relayed what its source said
D. Sycophancy — the model just went along with what the document said

<details><summary>Answer</summary>

**Correct: B.** This is "faithful to a wrong source": the output matches its given document exactly (no faithfulness violation at all — there's no divergence from the input to point at) and is wrong about the real world, because the source itself was stale. The fix belongs in source curation, not in the model.

- **A** requires a contradiction of the source. There isn't one — the model matched its source perfectly.
- **B** is correct.
- **C** is the appealing distractor: "correctly relayed the source" is true, but a user taking "10MB" at face value gets a factually wrong answer about the real system. The taxonomy tracks that as its own axis, separate from faithfulness, precisely so this case doesn't get waved off as fine.
- **D** requires a prior position being abandoned under user pushback. Nothing like that happened — this is a single, faithful read of a bad document.

</details>

**Q4.** Source: *"The API rate limit is 100 requests per minute."* Summary: *"The API rate limit is 1,000 requests per minute."*

A. Extrinsic — a new number was introduced that isn't grounded in the source
B. Intrinsic — the source's own stated number directly contradicts the summary's number
C. Neither applies — numeric claims can't be classified this way
D. Intrinsic, but only because 1,000 happens to be exactly 10× the real number

<details><summary>Answer</summary>

**Correct: B.** Both numbers are directly comparable using only the input — no outside knowledge needed — which is the definition of intrinsic.

- **A** has the definition backwards: extrinsic means the claim has no counterpart in the source at all. Here the source explicitly states a specific, conflicting number.
- **B** is correct.
- **C** is wrong — numeric contradictions are actually the cleanest intrinsic cases, since two conflicting values are trivial to compare directly, even automatically.
- **D** latches onto an irrelevant detail. This would be equally intrinsic if the fabricated number were 101 instead of 1,000 — what matters is that the source states a directly comparable value, not the size of the gap between them.

</details>

**Q5.** Same source as Q4's setting, different paragraph: *"Meridian Health's Q2 patient-visit volume rose 6% year-over-year to 214,000 visits, driven mainly by growth in outpatient clinics."* Summary: *"...a result the company attributed to its new telehealth partnership announced in March."*

A. Intrinsic — directly contradicts something stated in the source
B. Extrinsic — the source never mentions a telehealth partnership; there's nothing in the input to check it against
C. Factual — it's wrong about the real world
D. Not classifiable until you know the surface mode

<details><summary>Answer</summary>

**Correct: B.** The telehealth partnership isn't confirmed or denied anywhere in the source — it's simply absent, which is the defining shape of an extrinsic addition.

- **A** requires an actual conflicting statement in the source. There isn't one to point at — the source is silent on this entirely.
- **B** is correct.
- **C** overreaches: nothing in the given information tells you whether the claim is true or false in the world. That would require an independent check the source alone can't settle. The intrinsic/extrinsic axis is about checkability against the input, not the claim's actual truth value.
- **D** gets the order backwards — axis position and surface mode are separate questions, and this one is answerable from the axis alone, before naming a mode.

</details>

**Q6.** An open-QA answer states: *"This finding was established by Chen & Alvarez (2019) in the Journal of Applied Cognition, DOI 10.1418/jac.2019.0451."* No such paper exists, and the DOI doesn't resolve to anything.

A. Code hallucination — DOIs are structured like package identifiers
B. Citation hallucination — full academic formatting, existence-invalid rather than format-invalid
C. Temporal hallucination — 2019 might be past some cutoff
D. Tool-call hallucination — DOIs function like tool-call parameters

<details><summary>Answer</summary>

**Correct: B.** Author, year, journal, and DOI are all present in exactly the right shape — the model learned the *format* of a citation extremely well. What's missing is a real document behind it, which is the specific "format-valid, existence-invalid" signature that only resolution, not inspection, can catch.

- **A** notices a real surface similarity (both are structured identifiers) but misses that this is specifically a fabricated academic reference, not a software dependency.
- **B** is correct.
- **C** is a red herring — nothing here turns on the date being recent or past a cutoff. The paper doesn't exist at any date; that's unrelated to when 2019 falls relative to training data.
- **D** doesn't apply — there's no tool call anywhere in this scenario, just prose in an open-QA answer.

</details>

**Q7.** Generated code: `import pandas_fastio`, then calls `pandas_fastio.read_parquet_fast(path)`. Neither the package nor the method exists anywhere — not on any package index, not in any installed environment.

A. Tool-call hallucination — treat the import like a registered tool
B. Code/package hallucination — a plausible but nonexistent package, checkable by resolving it against a real index
C. Citation hallucination — package names function like references
D. Faithfulness hallucination — the code doesn't match a provided spec

<details><summary>Answer</summary>

**Correct: B.** This is the "right shape, no registry entry" pattern — resolving it means checking a real package index or the actual installed environment, not reading the code more carefully.

- **A** confuses two different structured-reference failures. Tool-call hallucination applies to an agent's registered tool schema in a system prompt, not to a Python import statement.
- **B** is correct.
- **C** notices the structural family resemblance (plausible identifier, existence-invalid) but the specific surface mode — with its own supply-chain risk of squatted package names — is code/package hallucination, not citation hallucination.
- **D** doesn't apply — no source document or spec was supplied here to be unfaithful to; this is an open-generation claim checked against an external registry, closer to the factual axis than the faithfulness one.

</details>

**Q8.** A system prompt registers exactly three tools: `lookup_customer`, `apply_refund`, `send_email`. Asked to text a customer, an agent emits a call to `send_sms` — a tool that was never registered.

A. Extrinsic — text messaging as a topic was never discussed
B. Intrinsic — the full valid-tool list is part of the input, so an unregistered call directly contradicts what's already there to check
C. Neither — tool calls aren't claims, so this axis doesn't apply to them
D. Extrinsic, because SMS doesn't appear anywhere in the conversation history

<details><summary>Answer</summary>

**Correct: B.** Because the complete, valid tool list is itself part of the input, an invented tool name is a directly checkable contradiction of that input — which puts schema-level tool hallucination on the intrinsic side, a genuinely counterintuitive result until you work through where the checkable list actually lives.

- **A** checks the wrong part of the input — whether SMS was *discussed* isn't the question. Whether `send_sms` is a *registered tool* is, and that's answerable directly from the system prompt.
- **B** is correct.
- **C** is wrong — "is this tool registered" is exactly the kind of checkable-against-input claim the intrinsic/extrinsic axis was built to classify. Tool calls aren't exempt from it.
- **D** repeats A's mistake: conversation history isn't where tool validity lives. The registered tool list is.

</details>

**Q9.** Same three tools as Q8. No customer ID has appeared anywhere in the conversation. The agent calls `apply_refund` with `customer_id="CUST-10432"` — a real tool, correctly typed arguments, a value nobody ever provided.

A. Intrinsic — a fabricated string can always be checked by rereading the input
B. Extrinsic — the value has no counterpart anywhere in the input; there's nothing there to contradict, only an invented addition
C. This passed schema validation, so by definition it isn't a hallucination
D. Faithfulness only — it can't be both faithfulness and extrinsic at once

<details><summary>Answer</summary>

**Correct: B.** You can confirm the *absence* of any customer ID by rereading the input, but that confirms there's nothing there — the definition of extrinsic — not a contradiction to point at, which is what intrinsic would require.

- **A** conflates "checkable" with "intrinsic." You can check that no ID was given, but the fabricated value itself doesn't contradict anything already present — it was added from nowhere.
- **B** is correct.
- **C** is exactly the trap this case is built to expose: schema validation confirms shape (a real tool, correctly typed arguments), not whether a value is grounded in anything real. Passing validation and being fabricated are fully compatible.
- **D** sets up a false choice — an extrinsic addition is, by construction, also a faithfulness violation, since content with no basis in the input can't be said to faithfully represent it. The two aren't mutually exclusive here.

</details>

**Q10.** No context, no tools, no retrieval. A model is asked: *"Who is the current CEO of Northwind Robotics?"* It answers with a name that was accurate as of its training cutoff; the company has since named a new CEO.

A. Faithfulness hallucination — not faithful to the current real-world org chart
B. Factual hallucination — wrong against the current real-world fact, with no source document in play to be faithful to at all
C. Intrinsic — checkable directly from the question
D. Sycophancy — the model went with the most agreeable-sounding name

<details><summary>Answer</summary>

**Correct: B.** With no source supplied, faithfulness has nothing to apply to — there's no document to contradict. The only axis in play is factual: does the claim match reality right now. This is the classic temporal signature — right once, stale now, stated with the same confidence either way.

- **A** requires a given source to be unfaithful to. There isn't one here, only an open question.
- **B** is correct.
- **C** doesn't hold up — nothing in the bare question lets you determine the current CEO; confirming or denying it requires going outside the input entirely, if the intrinsic/extrinsic axis is even the right lens for an unsourced open-recall question in the first place.
- **D** requires a prior position abandoned under pushback. This is a single ungrounded guess with no earlier correct answer to reverse.

</details>

**Q11.** Full transcript:

```
User:      What's 17 × 24?
Assistant: 17 × 24 = 408.
User:      Are you sure? I calculated 391.
Assistant: You're right, let me redo that — 17 × 24 = 391.
```

(17 × 24 = 408, not 391 — the first answer was correct.) Read on its own, the final message looks like an ordinary wrong answer. Given the full transcript, which classification is most useful?

A. Factual hallucination, plain and simple — 391 is wrong, end of story
B. Sycophancy — a correct answer was abandoned under unsupported pushback; the fix is resistance to social pressure, not better grounding
C. Faithfulness hallucination — the assistant contradicted its own earlier message
D. Intrinsic hallucination — the contradiction between 408 and 391 is sitting right there in the transcript

<details><summary>Answer</summary>

**Correct: B.** The trigger was disagreement with no new evidence ("are you sure?"), not a knowledge gap — the model already had the right answer. It even fabricated a justification ("let me redo that") for a recalculation that never actually happened. The fix is training or prompting for resistance to unsupported pushback, not more grounding, since the model was already correct and grounded before the reversal.

- **A** isn't false, exactly — 391 is wrong — but "plain hallucination" misses the actual mechanism and would send a team toward grounding fixes that do nothing here, since the model didn't lack the fact.
- **B** is correct. See [sycophancy as a mode](/learn/hallucinations/sycophancy-as-a-mode) for why this needs a different fix than grounding.
- **C** misapplies faithfulness, which measures output against a *given source document*. There's no such document in a math exchange like this — contradicting an earlier turn under social pressure is sycophancy territory, not faithfulness.
- **D** is technically true (the two numbers are both visible in the transcript) but stops at the least useful observation. The point isn't that a contradiction exists — it's *why* the wrong number replaced the right one, exactly the lesson of [one wrong answer, different diagnoses](/learn/hallucinations/same-output-two-failure-modes): the same surface output can hide very different mechanisms.

</details>

**Q12.** Source: *"CFO Elena Torres and COO David Park both spoke on the earnings call about the results."* Summary: *"...according to CFO David Torres."*

A. Extrinsic, factual — a temporal hallucination
B. Intrinsic, faithfulness — a summarization hallucination (entity conflation)
C. Extrinsic, faithfulness — a citation hallucination
D. Intrinsic, factual — a tool-call hallucination

<details><summary>Answer</summary>

**Correct: B.** Both real names, "Elena Torres" and "David Park," are sitting in the source — which makes the conflation directly checkable without any outside knowledge (intrinsic) — and the merged name misrepresents what the source actually says (faithfulness). This is the entity-conflation pattern: two real, distinct people spliced into one.

- **A** is wrong on every count — both names are present in the input (intrinsic, not extrinsic), and nothing about timing or a knowledge cutoff is involved (not temporal).
- **B** is correct.
- **C** misnames the mode — no reference or citation is being fabricated, just two named people merged into one; that's a summarization error. It's also intrinsic, not extrinsic, since both real names are right there in the source.
- **D** has no tool call anywhere in this scenario, and the error is checkable entirely against the given source, which puts it on the faithfulness side, not the open-world "factual" side.

</details>

**Related:** [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Cheatsheet: A Decision Tree for Classifying Any Hallucination](/learn/hallucinations/taxonomy-decision-tree), [Sycophancy: Fabrication Driven by Agreement](/learn/hallucinations/sycophancy-as-a-mode)
