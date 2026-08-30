---
title: "Summarization for Compaction"
track: "context-engineering"
status: live
summary: "Extractive vs abstractive summarization, and the short list of things a compaction pass is never allowed to lose."
duration: "8 min read"
---

This is the deferred rigor behind [compaction](/learn/context-engineering/summarization-for-compaction) — read that first if you haven't. Once you've accepted that [compaction is unavoidable](/learn/context-engineering/why-compaction-is-necessary), the question that actually determines whether your agent stays reliable is *how* you summarize, and what you refuse to let a summary touch.

## Extractive vs abstractive, precisely

There are two fundamentally different mechanisms for shrinking a stretch of conversation, and they fail in different ways.

**Extractive compaction** selects a subset of the original content and keeps it verbatim — pull out specific sentences, tool results, or structured fields, and discard the rest untouched. Nothing kept is paraphrased; it's either in, unedited, or out, gone. The failure mode is coverage: extraction is only as good as the selection rule, and information that's spread across several turns (a decision stated in turn 3, refined in turn 11, and finally confirmed in turn 19) doesn't extract cleanly as any single span. You either grab all three turns verbatim — barely compressing anything — or you grab one and silently lose the refinement.

**Abstractive compaction** has a model read the aging turns and write new text that describes what happened — "the user asked for a summary format, the agent proposed bullet points, the user asked for a table instead." This synthesizes information distributed across many turns into one coherent statement, which is where the real compression ratio comes from — a hundred verbose turns can become one paragraph. The failure mode is fidelity: paraphrasing is a form of interpretation, and interpretation can drift, omit, or flatten nuance the writer of the summary judged (correctly or not) to be unimportant. A rewritten decision can quietly lose the exception attached to it.

In practice, almost every production compaction system is a **hybrid**: an abstractive narrative summary for the gist, plus an extractive appendix of atomic facts kept exactly as stated — names, numbers, file paths, exact constraints, direct quotes of anything that reads like a ruling. The narrative gives you the story; the appendix gives you the facts you can't afford to have paraphrased.

## What must survive a summary

Regardless of mechanism, a compaction pass has a short, non-negotiable list of things it has to preserve, because losing any of them doesn't just lose detail — it changes what the agent will do next:

- **Decisions made, and the reasoning behind them.** Not just "we chose Postgres" but "we chose Postgres over MongoDB because the refund flow needs transactional guarantees" — the reasoning is what stops the decision from being silently re-litigated later.
- **Constraints stated by the user.** Anything phrased as an instruction, a preference, or a prohibition — "always respond in formal English," "never touch the production branch," "budget is capped at $500." These read as optional color to a summarizer that isn't told to weight them, and they are exactly the kind of thing a downstream turn will violate if it's gone.
- **Open threads.** Anything unresolved — a question asked but not yet answered, a task started but not finished, an error seen but not yet root-caused. Dropping an open thread doesn't just lose information, it makes the agent behave as if the thread was closed.

Everything else — the back-and-forth that led to a decision, a tool call that failed and was retried, small talk — is fair game to compress hard or drop.

## A summary that keeps the ruling, and one that loses it

Take a stretch of conversation where, ten turns back, this exchange happened:

> **User:** We need this to handle refunds. Use Postgres, not Mongo — we need transactional guarantees so a refund can't partially apply.
> **Agent:** Understood, Postgres it is for the refund path.

Fifteen turns later, none of that is visible in the raw window anymore. Here's what a compaction pass produces in two different runs.

**Summary A (preserves the ruling):**

```text
Decisions:
- Database for the refund path: Postgres (not MongoDB). Reason: refunds must
  be transactional — a refund cannot be allowed to partially apply.
Open threads:
- Refund retry logic not yet implemented.
```

**Summary B (loses it):**

```text
The team discussed data storage options for the refund system and moved on
to other implementation details. Refund retry logic is still pending.
```

Summary B isn't wrong, exactly — it's a plausible, fluent gist of "there was a database discussion." But it has silently converted a binding decision with a stated reason into a vague mention of "discussed options," and it drops the prohibition entirely. Five turns later, if the agent is asked to sketch a data-access layer and Mongo happens to come up as a reasonable-sounding default, nothing in Summary B stops it from proposing Mongo — the constraint that would have blocked that suggestion no longer exists anywhere the model can see. This is the mechanism behind [compaction that drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts): the summary isn't factually false, it's just missing the one sentence whose absence changes behavior.

## Stating the tradeoff precisely

Compaction always trades along three axes at once, and it's worth being exact about what moves:

- **Compression ratio vs. fidelity.** Higher compression means fewer tokens carried forward, which mechanically means less of the original detail can possibly survive. There's no free lunch here — a paragraph that replaces a hundred turns has thrown away far more than a paragraph that replaces ten.
- **Cost and latency vs. staleness.** Every compaction pass is an extra model call. Run it too rarely and the window fills up between passes, forcing an emergency compaction (or a truncation) at the worst time; run it on every turn and you're paying for a summarization call almost as often as the conversation itself, for marginal gain. See [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary) for the budget-threshold pattern that resolves this.
- **Abstractive coverage vs. extractive precision.** The hybrid approach above buys both, but at the cost of running two different extraction disciplines instead of one — a plain narrative summary is simpler to build and reason about, but only the hybrid form gives you confidence that an exact number or an exact prohibition survives word-for-word.

None of these tradeoffs has a universally correct setting. A customer-support agent handling low-stakes chit-chat can compact aggressively and rarely; an agent executing an irreversible multi-step workflow (deployments, financial transactions) should bias hard toward the extractive, verbatim end and compact conservatively. The right calibration is a property of how expensive a lost fact is in your specific domain, not a fixed ratio you can borrow from someone else's system.

## Where this fits

A single compaction pass has a ceiling: run it repeatedly on a conversation that keeps growing and you eventually have to re-summarize your own summary, which is exactly the kind of repeated, compounding compression that erodes detail fastest. [Hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained) is the fix — it structures compaction so each fact only gets compressed once, on its way up a layer, instead of being re-flattened every time the conversation grows. And because a summary is inherently a lossy compression, [context rot](/learn/context-engineering/context-rot) is the mirror-image failure worth keeping in mind: too little surviving context degrades an agent the same way too much undifferentiated context does — the target isn't maximum compression, it's the right things surviving.

**Related:** [Compaction: Summarizing History to Reclaim Context Space](/learn/context-engineering/summarization-for-compaction), [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [When Compaction Drops the Thing That Mattered](/learn/context-engineering/compaction-that-drops-key-facts), [Context Rot](/learn/context-engineering/context-rot)
