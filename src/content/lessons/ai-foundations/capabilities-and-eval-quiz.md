---
title: "Capabilities & Evaluation: What Would You Trust?"
track: "ai-foundations"
status: live
summary: "6-question self-check quiz for the AI Foundations 'Capabilities & Evaluation' module, testing prediction of reliability from benchmark scores, spotting misleading aggregate scores,"
duration: "14 min read"
---

## Question 1: The ledger problem

A vendor's model scores 88% on a public benchmark of grade-school arithmetic word problems — single question in, single number out, one step of reasoning. A finance team wants to use the same model to reconcile ledgers: each task is a chain of about 10 dependent calculations, where an error in step 3 corrupts every step after it.

Assuming the benchmark's 88% roughly reflects the model's per-step accuracy on this kind of arithmetic, what's the most defensible prediction for the ledger task?

- **A.** About 88% task success, since it's the same underlying skill (arithmetic).
- **B.** Higher than 88%, since reconciling a ledger is more mechanical and repetitive than word problems.
- **C.** Meaningfully lower than 88% — plan for it, and add a check.
- **D.** No prediction is possible; a benchmark score never tells you anything about a deployment task.

<details><summary>Answer</summary>

**Correct: C.** The benchmark measures accuracy on isolated, single-step problems. The ledger task chains roughly 10 dependent steps, so a single error anywhere downstream ruins the result. If each step is right 88% of the time independently, the chance all 10 land is roughly 0.88 raised to the 10th power:

```python
p_per_step = 0.88
n_steps = 10
p_all_correct = p_per_step ** n_steps
print(round(p_all_correct, 3))  # ≈ 0.279 — about 28%, not 88%
```

That's a rough model (real errors aren't perfectly independent, and some pipelines can catch and correct a bad intermediate step before it propagates), but the direction is the real lesson: chaining steps multiplies error probability, it doesn't average it. A benchmark of one-shot problems systematically overstates reliability on multi-step, dependent tasks — which is exactly why [what LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do-case-studies) keeps showing capable-looking models failing on tasks that are "the same skill, more steps."

**A** is the trap the whole question is built around — "arithmetic is arithmetic" ignores that the benchmark never tested a 10-step dependent chain, only independent one-shot problems, so its score carries no information about error compounding.

**B** gets the mechanism backwards: more repetitions of a fallible step is more opportunity for the per-step error rate to compound, not fewer — mechanical and repetitive is precisely the shape of task that punishes a sub-100% per-step accuracy hardest.

**D** overcorrects. The benchmark isn't worthless — it's exactly the number you need (a per-step error rate) to reason about compounding. Throwing it out because it doesn't directly answer your question discards a usable input to the estimate.

</details>

## Question 2: The 96% that isn't

Your team built an internal eval of 500 real customer-support tickets and ran your support bot against it: 96% overall accuracy — 480 of 500 correct. Later you break it down by ticket type: 450 of the 500 tickets are routine "reset my password" requests, and the bot gets essentially all of those right. The other 50 are billing-dispute tickets — messier, and the ones that actually drive escalations and churn when handled badly.

If the bot got all 450 easy tickets right, how many of the 50 billing-dispute tickets did it get right, and what should you actually do with that?

- **A.** It got 30 of 50 billing-dispute tickets right (60%) — dominated by the easy majority, report and act on the segment, not the blended average.
- **B.** 96% is a reliable estimate of performance on billing-dispute tickets specifically too, since they're part of the same eval set.
- **C.** The eval set is poorly designed and should be thrown out.
- **D.** The gap between segments means the model is overfit to the eval set and needs retraining from scratch.

<details><summary>Answer</summary>

**Correct: A.** Do the arithmetic: 480 total correct minus 450 correct on the easy segment leaves 30 correct out of the 50 hard tickets — a 60% success rate on precisely the tickets where a wrong answer is expensive. The headline 96% is a weighted average that's 90% composed of the easy class, so it's mathematically guaranteed to look great even if the minority segment is mediocre. This is the core lesson of [benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss): an aggregate score hides exactly the distribution of difficulty behind it. The fix is to always break scores out by segment, especially the rare-but-costly ones, and treat the blended number as close to meaningless for decision-making.

**B** is the trap — assuming a number computed over a mostly-different population applies to the subpopulation you actually care about is the same aggregation error that produces Simpson's-paradox-style illusions; the 96% was never measuring the billing-dispute segment on its own.

**C** overcorrects. The eval set isn't necessarily flawed — a 90/10 easy/hard split may faithfully reflect real ticket volume. The problem isn't the data, it's reporting a single blended number instead of segmenting it.

**D** is a non sequitur. "Overfit to the eval set" is a training-time leakage concern (the model having seen these exact tickets during training) — a different failure mode from the one here, which is a measurement and reporting problem. Segmenting the score is the fix; nothing here tells you the model needs retraining.

</details>

## Question 3: The credit-issuing task

A team wants to automate this: "Given an order number, check its status in the warehouse system and the shipping carrier's API, and if it's more than two days delayed, issue a $10 credit and email the customer." Someone proposes doing it with a single-turn chatbot — feed it a good prompt describing the policy, and have it produce the response.

The real discriminator between "chatbot" and "agent" is whether the task needs multiple dependent tool calls with state carried between them, and whether it takes an action with real-world side effects (not just whether it sounds like it involves "answering a question"). Given that, what does this task need?

- **A.** A chatbot is enough — this is fundamentally a question ("what's the order status?") with a well-defined answer.
- **B.** Neither — this is fully deterministic and should be a plain script with no model involved at all.
- **C.** A chatbot is enough, as long as the system prompt spells out every step in detail.
- **D.** An agent — it needs sequential tool calls across two live systems, a conditional decision on the combined result, and side-effecting actions.

<details><summary>Answer</summary>

**Correct: D.** Walk through what actually has to happen: query the warehouse system, query the carrier API, compare two dates from two different live sources to compute a delay, branch on that comparison, and — only on one branch — call a tool that issues a monetary credit and another that sends an email. That's multiple steps, state carried between them, a decision made on intermediate results, and consequential side effects in the outside world. That's the textbook shape of an agent task, not a single-turn response — see [agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) and the [worked example](/learn/ai-foundations/agents-vs-chatbots-worked-example) for the same rubric applied end to end.

**A** is the tempting trap: it sounds like "answering a question" because the user-facing framing is a question, but the task is read-then-act, not read-only. A chatbot can describe what a $10 credit policy is; it can't reach into two APIs, compare their outputs, and fire a payment.

**B** has a grain of truth — the delay comparison and the credit threshold are deterministic and could be plain code — but the conclusion is wrong. Real warehouse/carrier data is messy (missing timestamps, inconsistent statuses, edge cases in what counts as "delayed"), which is exactly where judgment-under-ambiguity earns its keep; most production systems here are a script with an agent (or an agent with tool-calling) in the loop, not one or the other.

**C** confuses instructions with capability. A longer system prompt changes what the model is told to do, not what it's able to do — without the ability to call tools and act across multiple steps, no prompt turns a single-turn text generator into something that can query two live systems and issue a credit.

</details>

## Question 4: The confident wrong signature

You ask a model for the exact signature of a library function. It replies immediately and precisely: `requests.get(url, timeout=5, retry_count=3)`. It reads as completely authoritative — no hedge, no "I think." It's also wrong: `requests.get` has no `retry_count` parameter. This is a hallucination — a fluent, specific, wrong claim stated with full confidence.

What's actually happening mechanically, and what does that imply about how you'd prevent it?

- **A.** The model deliberately lied because it didn't want to admit uncertainty.
- **B.** It's generating the statistically plausible next tokens for "what a requests-library call looks like," with no step that checks the claim against the actual docs — fluent output isn't evidence a fact was verified, so the fix is grounding (docs/retrieval) or verification (run it), not asking it to "be more careful."
- **C.** The tokenizer mis-split "retry_count," producing garbage.
- **D.** This only happens with small or cheap models; a frontier model wouldn't make this kind of error.

<details><summary>Answer</summary>

**Correct: B.** A model producing text is doing next-token prediction shaped by training data and instruction-tuning — see [how LLMs work](/learn/ai-foundations/how-llms-work) — with no built-in mechanism that looks up the real `requests.get` signature and checks the claim before emitting it. `retry_count` is a plausible-sounding parameter name (retries are a real, common `requests`-adjacent concept), so the model produces it with the same fluency it would use for a real parameter — fluency and correctness are generated by the same process and don't come with a confidence readout attached. That's the deep reason [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate): the failure mode is structural, not occasional carelessness. The actionable consequence: don't try to fix this by prompting for more caution — ground the claim in a retrieved source (the actual docs) or verify it (run the code) before you trust it.

**A** anthropomorphizes a mechanism that has no model of "things it knows it doesn't know" to compare against a choice to deceive. There's no intent here — just a plausible continuation being generated, same as a correct one would be.

**C** is a category error. A tokenizer failure would produce garbled or malformed text; this is fluent, syntactically valid, plausible-looking code that's simply wrong about one fact. That's a knowledge/grounding failure, not an encoding one.

**D** is false as a general claim. Hallucination rates on long-tail specifics (exact keyword arguments, precise version numbers, exact citations) shrink with better training and tuning but aren't eliminated by scale — larger models confabulate less often, not never, especially on details that are rare or ambiguous in training data. Trusting an answer needs verification regardless of model size, not a bigger model as a substitute for checking.

</details>

## Question 5: The suspiciously perfect score

A newly released model scores 97% on a well-known, publicly available benchmark that's been posted online — along with worked solutions and discussion of it — for years. It's the highest score anyone has recorded on that benchmark. A colleague says: "This proves it reasons better than any model before it."

Given that the benchmark and its answers have been public long enough to plausibly appear in training data, how should you weigh that 97%?

- **A.** Agree — the highest recorded score on a recognized benchmark is definitive proof of superior reasoning.
- **B.** Public benchmarks are always worthless the moment they're released, so ignore the score entirely.
- **C.** The score is meaningless unless you also know the model's parameter count.
- **D.** Be skeptical — a score this high on a long-public benchmark could reflect memorization of this specific benchmark rather than generalizable reasoning; you'd want a held-out or newly constructed eval to actually tell the difference.

<details><summary>Answer</summary>

**Correct: D.** A model's training data is drawn from a huge crawl of the public internet — see [the data the model learned from](/learn/ai-foundations/the-data-the-model-learned-from) — and a benchmark that's been public for years, complete with discussion and worked solutions, is a plausible candidate for having been seen (directly or via close paraphrase) during training. When that's true, a high score is consistent with two very different explanations — "the model generalizes well" and "the model has partially memorized this specific test" — and the score alone can't distinguish them. That's the practical reason contamination matters: it doesn't just inflate a number, it makes the number stop measuring what you think it measures. The fix is the same one used across [benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss): prefer evals built or refreshed after the model's training cutoff, or your own held-out set the model has never had a chance to see.

**A** is exactly the trap: it treats "highest score" as settling a question the score can't settle on its own, because you don't know how much of that score is memorization versus reasoning.

**B** overcorrects. Public benchmarks aren't universally worthless — one released *after* a model's training cutoff, or one you can show wasn't in the crawl, is still informative. The specific risk is leakage on old, widely mirrored, publicly-solved benchmarks, not benchmarks as a category.

**C** is a red herring. Parameter count doesn't tell you anything about whether this specific benchmark leaked into training — a small model can memorize a public benchmark just as a huge one can, and a huge model gets no automatic pass on contamination.

</details>

## Question 6: Deciding what to trust, for real

You need to decide whether to trust a model for a new internal task: pulling structured fields (vendor, amount, due date) off scanned invoices. Four approaches are on the table for answering "can I trust this?"

- **A.** Ask the model directly how confident it is in its own invoice-extraction accuracy, and use that number.
- **B.** Check its score on a general public document-understanding leaderboard and assume that transfers to your invoices.
- **C.** Build a small labeled eval set of your actual invoices — including the messy scans and edge cases — run the model against it, and measure error rate broken out by field.
- **D.** Deploy it and see whether customers complain.

<details><summary>Answer</summary>

**Correct: C.** This is the only option that measures the thing you actually need to know: performance on your task's real distribution, not a proxy for it. [Building an eval set](/learn/ai-foundations/building-an-eval-set-worked-example) that's representative of your actual documents — different vendors, layouts, scan quality, the annoying edge cases — and scoring it per field (not blended, per Question 2's lesson) gives you a number you can actually act on: which fields are reliable enough to trust unsupervised, and which need a human in the loop or a verification step downstream.

**A** repeats Question 4's mechanism: a model's stated confidence is generated text, not introspection over a calibrated internal error estimate. Fluent certainty ("I'm about 95% confident") carries no more guarantee of accuracy than the confident-but-wrong function signature did — there's no mechanism producing that number from an actual accuracy measurement.

**B** repeats Question 1's mechanism: a general leaderboard measures a different task distribution (different documents, different failure modes) than your specific invoices. It's a weak prior at best, not a substitute for measuring your own task.

**D** skips evaluation entirely and lets production be the test set. That means failures — a missed due date, a wrong amount — surface as real damage (bad data, annoyed customers) instead of being caught cheaply beforehand. It's not "no evaluation," it's evaluation happening at the worst possible time and cost.

</details>

**Related:** [Why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) · [Benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss) · [AI agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) · [Agents vs. chatbots: a worked example](/learn/ai-foundations/agents-vs-chatbots-worked-example) · [Building an eval set: a worked example](/learn/ai-foundations/building-an-eval-set-worked-example) · [The data the model learned from](/learn/ai-foundations/the-data-the-model-learned-from)
