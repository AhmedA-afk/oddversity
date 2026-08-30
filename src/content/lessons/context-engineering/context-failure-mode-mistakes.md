---
title: "Failure-Mode Mistakes"
track: "context-engineering"
status: live
summary: "Six real context failure modes, the incident each one causes, and the defense that actually prevents it."
duration: "6 min read"
---

Every mistake below has shipped, quietly, in a system that looked fine in the demo. None of them require an adversary — most of these are just what happens when nobody measured.

### The mistake: Trusting instructions found inside retrieved content

**Why it's wrong:** A model can't structurally tell the difference between "the operator told me to do this" and "a document I fetched contains a sentence that reads like a command" unless something in the prompt draws that line explicitly. Treating retrieved text as automatically safe is the same as running unsanitized input as code.

**Symptom:** An agent takes a consequential action — a refund, a send, a delete — that traces back to wording found inside a fetched document, ticket, or web page rather than the actual user or operator.

**Fix:** Delimit and label every block of retrieved content as untrusted, and state an explicit instruction-ignoring policy for it, worked through end to end in [Injection Through Retrieved Content](/learn/context-engineering/prompt-injection-via-retrieved-content).

### The mistake: Assuming a bigger context window means more context is safe to add

**Why it's wrong:** Fitting is not the same as using well. Quality can peak well below the token ceiling and decline from there, even when every added token is genuinely on-topic — see [Context Rot Explained](/learn/context-engineering/context-rot-explained).

**Symptom:** A prompt that scored well in a small demo quietly regresses once fed production-sized inputs, with no error or warning. It just gets worse.

**Fix:** Treat window size as a hard ceiling, not a target, and measure quality across a range of realistic context sizes instead of assuming "if it fits, it's fine." See [Why More Tokens Can Hurt](/learn/context-engineering/why-more-tokens-hurt).

### The mistake: Never ablating a context segment before shipping it

**Why it's wrong:** A segment can look self-evidently helpful — "of course the FAQ block helps" — and still be actively hurting accuracy, or purely adding cost for zero benefit. Intuition about what helps is not evidence that it does.

**Symptom:** Nobody can say what would happen if a given retrieved block, memory, or tool-output segment were removed, because it's never been tried in isolation.

**Fix:** Run the segment through a with/without ablation on a fixed eval set before treating it as load-bearing. See [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps) and the runnable version in [An Eval Harness for Context Choices](/learn/context-engineering/eval-harness-for-context).

### The mistake: Letting a poisoned fact ride uncorrected through the rest of the session

**Why it's wrong:** Once a wrong claim is in the transcript, the model treats it as an established premise and keeps building on it — it doesn't spontaneously re-derive or re-check something it already "knows."

**Symptom:** A wrong value from an early tool call or a hallucinated aside shows up again, restated with more confidence, several turns later — and by the time it surfaces in a final output, three or four things have already been built on top of it.

**Fix:** Verify facts before they enter context rather than after, and give the agent a real way to retract and backtrack from a bad premise. Traced step by step in [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction-deep).

### The mistake: Treating a cached or previously-summarized fact as still current

**Why it's wrong:** A fact frozen at the moment it was cached or summarized carries no signal about whether it's still true, and a model reading it back has no way to tell a stale fact from a fresh one unless that information travels with it.

**Symptom:** An agent confidently states a price, a status, or a policy that was correct when first recorded but has since changed, with nothing in the output hedging or flagging that it might be stale.

**Fix:** Attach a source and an age to every fact that matters, and revalidate anything past its freshness window before acting on it. Walked through with real cases in [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios).

### The mistake: Judging context quality by reading a handful of outputs instead of measuring it

**Why it's wrong:** A human skimming a few sample outputs after a context change almost always feels more confident when there's visibly more supporting material present — it looks thorough — regardless of whether it actually helped.

**Symptom:** A context change ships on the strength of "these five examples look better," then a later regression traces back to exactly that change, with nobody having run a real comparison.

**Fix:** Compare context variants on a fixed, paired eval set and read the win/loss, not the vibe. See [A/B Testing Context Variants](/learn/context-engineering/ab-testing-context-variants).

## Pre-flight checklist

- [ ] Every block of retrieved or fetched content is delimited, labeled with its source, and covered by an explicit instruction-ignoring policy.
- [ ] The prompt has been evaluated at the context sizes production actually produces, not just a small demo size.
- [ ] Every context segment currently shipped has a with/without ablation result on file, not just an assumption that it helps.
- [ ] There's a way for the agent or pipeline to catch and retract a claim discovered to be wrong, rather than only ever appending.
- [ ] Facts that matter carry a source and a freshness check, and nothing high-stakes is acted on past its freshness window without revalidation.
- [ ] The last context change was judged by a fixed eval comparison, not by reading a handful of sample outputs.

**Related:** [Context Rot Explained](/learn/context-engineering/context-rot-explained), [Why More Tokens Can Hurt](/learn/context-engineering/why-more-tokens-hurt), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction-deep), [Injection Through Retrieved Content](/learn/context-engineering/prompt-injection-via-retrieved-content), [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps), [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios)
