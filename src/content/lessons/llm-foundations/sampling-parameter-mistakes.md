---
title: "Sampling Parameter Mistakes"
track: "llm-foundations"
status: live
summary: "Five ways people misconfigure temperature and top-p, each with a mechanism you can point to and a fix that isn't just 'tune it more'."
duration: "8 min read"
---

Sampling parameters are cheap to set and easy to cargo-cult. Most bad configurations aren't stupid — they're a reasonable-sounding heuristic applied one step past where it actually holds.

## The mistake: stacking temperature and top-p without understanding how they compose

Someone sets `temperature=1.3` for "more creative" output and `top_p=0.95` for "quality control," treating the two as independent creativity dials that add up.

**Why it's wrong.** They aren't independent — temperature runs first and reshapes the whole distribution, and top-p's cumulative-mass threshold is computed *on that reshaped distribution*, not the original one (the exact order is laid out in [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token)). Raising temperature flattens the distribution, which means top-p's same 0.95 threshold now has to reach much further into the tail to accumulate that much mass — so the "quality control" top-p was supposed to provide erodes exactly when you crank temperature up, which is exactly when you need it most.

**Symptom.** Output gets noticeably less coherent as temperature climbs, even with top-p turned on, and it's not obvious why the "safety net" isn't catching it — because the safety net's effective size grew along with the flattening it was meant to guard against.

**Fix.** Treat them as one interacting system, not two independent knobs. Raise temperature and top-p together deliberately in small steps and read actual output at each step, rather than assuming a "high creativity" preset of extreme values on both. If a distribution is already very flat, consider [min-p](/learn/llm-foundations/greedy-beam-sampling-min-p) instead of top-p — its threshold scales with the top token's own probability, so it doesn't lose its grip the way a fixed cumulative threshold does.

## The mistake: pure greedy decoding for anything longer than a sentence

A team switches to `temperature=0` (equivalent to greedy) for a "deterministic, high-quality" summarization pipeline, expecting the single best output every time.

**Why it's wrong.** Greedy has no mechanism to detect or escape a loop — it only ever asks "what's the single best next token given everything so far," never "have I already said this." Once a repeated phrase becomes locally likely (which happens easily; language has recurring structures), greedy can lock into it indefinitely, because the highest-probability continuation of a loop is often the loop continuing.

**Symptom.** Long outputs occasionally degenerate into a phrase or sentence repeating verbatim for the rest of the generation, especially past a few hundred tokens — a distinctive, easy-to-recognize failure once you've seen it, and confusing the first time you haven't.

**Fix.** For anything beyond short, narrow extraction, use a small non-zero temperature with top-p rather than pure greedy — even `temperature=0.2, top_p=0.9` introduces enough variation to break most loops while staying close to deterministic. If loops persist, that's the actual job for [repetition penalties](/learn/llm-foundations/repetition-penalties-and-constrained-decoding), which directly suppress tokens the model has already used — a more targeted fix than nudging temperature and hoping.

## The mistake: applying repetition penalties uniformly across code and numbers

A generic repetition penalty gets applied to every generation task, including code generation and anything involving numeric output.

**Why it's wrong.** Repetition penalties work by discouraging tokens that already appeared — but code and structured numeric output are *supposed* to repeat. Variable names recur by design. Closing braces, common keywords (`return`, `if`, `self`), and indentation tokens appear constantly and correctly. Penalizing them doesn't produce "less repetitive" code — it actively corrupts syntax, and it can distort digit sequences by discouraging a digit the model has already used earlier in the same number, even though "already used a 7" says nothing about whether the next digit should be a 7 again.

**Symptom.** Generated code that avoids reusing a variable name it should reuse, inconsistent formatting where a normally-repeated pattern breaks partway through, or numbers that look subtly "off" in a way that's hard to pin down until you check them digit by digit against the intended value.

**Fix.** Turn repetition penalties off (or set them very low) for code generation, structured data, and anything numeric — these are exactly the domains where legitimate repetition is the correct output, not a symptom of the model being stuck. Reserve repetition penalties for free-form prose generation, where repeated phrasing usually is a real quality problem. See [repetition penalties and constrained decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) for what these penalties actually do to logits, which makes it clearer why they interact so badly with structured output.

## The mistake: "set temperature to 0 for facts"

Widely repeated advice: use `temperature=0` whenever you want factual, reliable output, on the reasoning that determinism equals accuracy.

**Why it's wrong.** Temperature controls how the model *samples from its own distribution* — it has no way to fix a distribution that's wrong to begin with. If a model's most-probable token for a factual query is itself incorrect (a genuine hallucination, not a sampling artifact), `temperature=0` deterministically picks that wrong answer, every single time, with total confidence. Determinism and correctness are unrelated properties: greedy decoding guarantees you get the model's single most likely completion, not that the most likely completion is true.

**Symptom.** A pipeline running at `temperature=0` produces a consistent, repeatable, and confidently wrong answer to the same factual question — consistency gets mistaken for reliability because "at least it's not randomly different every time" feels like progress, when the actual failure (a bad top-ranked token) hasn't been touched at all.

**Fix.** Use low (not necessarily zero) temperature for tasks where you want the model's best single guess with minimal variance — that's a real and legitimate use of low temperature. But treat factual reliability as a separate problem that low temperature doesn't solve: retrieval augmentation, citation requirements, or verification passes address *what the model believes*, while temperature only ever controls *how confidently it commits to what it already believes*. Don't let "deterministic" substitute for "verified."

## The mistake: reaching for higher temperature to fix repetition

A model's output loops or repeats, and the fix that gets reached for first is raising temperature — the reasoning being that "more randomness" should break "the same thing happening over and over."

**Why it's wrong.** This treats the symptom as if it were the cause. If the underlying issue is a genuine repetition loop (see the greedy-decoding mistake above), raising temperature might occasionally jostle the model out of it, but it does so by making *every* token choice noisier, not just the ones near the loop — you're as likely to introduce incoherence elsewhere in the output as you are to fix the repetition, and on a sharply peaked distribution even a fairly high temperature may not flatten things enough to escape a strong loop anyway.

**Symptom.** Bumping temperature reduces repetition somewhat but output quality drops elsewhere in ways that seem unrelated to the original problem — because it is unrelated; you turned a global dial to fix a local, structural issue.

**Fix.** Match the tool to the mechanism. A repetition loop is a decoding-strategy problem — solved by a repetition penalty or a different sampling strategy like [top-p or min-p](/learn/llm-foundations/greedy-beam-sampling-min-p), not by adding noise everywhere. Reserve temperature adjustments for genuinely wanting more or less variance across an entire generation, not as a general-purpose "unstick the model" lever.

## Pre-flight checklist

- Treat temperature and top-p as one interacting system — validate combinations with real output, not by summing two "creativity" intuitions.
- Never run pure greedy (`temperature=0`) on generations longer than a sentence or two without a plan for repetition loops.
- Disable or minimize repetition penalties for code, structured data, and numeric output — repetition there is usually correct, not a defect.
- Don't equate `temperature=0` with factual accuracy — it guarantees consistency, not correctness, and consistency in a wrong answer is not progress.
- Diagnose before reaching for temperature: a genuine repetition loop needs a repetition penalty or a different decoding strategy, not a global noise increase.
- Whenever you touch a sampling parameter, re-check it against the specific task type (prose vs. code vs. structured data) rather than applying one house setting everywhere.

**Related:** [From Logits to a Chosen Token](/learn/llm-foundations/from-logits-to-a-chosen-token) · [Greedy, Beam, Nucleus, and Min-p Decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) · [Repetition Penalties and Constrained Decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Why LLMs Hallucinate](/learn/llm-foundations/why-llms-hallucinate) · [Temperature as Flattening the Distribution](/learn/llm-foundations/temperature-as-flattening)
