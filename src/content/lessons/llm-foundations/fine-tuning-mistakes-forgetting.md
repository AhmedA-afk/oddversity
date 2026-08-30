---
title: "Fine-Tuning Mistakes and Catastrophic Forgetting"
track: "llm-foundations"
status: live
summary: "Overfitting tiny SFT sets, format leakage, catastrophic forgetting, wrong-learning-rate fine-tunes, and reaching for RLHF when SFT would do."
duration: "7 min read"
---

Most fine-tuning failures aren't exotic — they're the same handful of mistakes recurring across teams, each with a recognizable symptom and a boring, reliable fix.

### The mistake: overfitting a tiny SFT set

**Why it's wrong:** [SFT loss](/learn/llm-foundations/supervised-fine-tuning-mechanics) is computed the same way as pretraining loss, which means it's just as capable of being driven to near zero by memorizing a small dataset outright, rather than learning the general skill the dataset was meant to demonstrate. The smaller the dataset relative to the number of training steps, the easier this is to do without noticing.

**Symptom:** training loss keeps falling nicely, but outputs on held-out prompts start looking suspiciously close to specific training examples — verbatim phrases, oddly specific reused structure — or validation loss starts rising while training loss keeps falling, the same train/validation gap flagged in [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss).

**Fix:** track loss on a held-out split of the SFT data, not just training loss. Stop training when validation loss stops improving rather than when training loss looks good. When the dataset is genuinely small, fewer epochs and a lower learning rate reduce how hard the model can grip onto individual examples.

### The mistake: format leakage that makes the model rigid

**Why it's wrong:** if every example in an SFT set shares an incidental surface pattern the task doesn't actually require — a particular opening phrase, a fixed response length, always three bullet points — the model can learn that surface pattern as if it were the task, because nothing in the loss distinguishes the actual instruction-following skill from the format all the examples happened to share.

**Symptom:** the model applies the trained format rigidly even where it doesn't fit — always starting with the same phrase, always producing the same length or structure regardless of what the prompt actually calls for.

**Fix:** vary incidental surface features deliberately across the SFT set — length, opening phrasing, structure — so the only thing consistently correlated with a good response is the actual instruction-following behavior, not any single formatting habit.

### The mistake: catastrophic forgetting of pretrained skills

**Why it's wrong:** fine-tuning updates the same weights that encode everything the base model learned during [pretraining](/learn/llm-foundations/pretraining-explained). If it pushes hard and narrowly enough — too high a learning rate, too many epochs, too narrow a data distribution — those updates can overwrite capability the base model had that simply wasn't represented in the fine-tuning data, because nothing in the fine-tuning loss protects skills it never exercises.

**Symptom:** the model gets noticeably better at the fine-tuned task but measurably worse at unrelated things it could previously do well — general knowledge, other coding languages, tasks outside the fine-tuning domain.

**Fix:** use learning rates and epoch counts well below pretraining scale (see [Optimization Mechanics](/learn/llm-foundations/optimization-mechanics-adam-warmup) for why pretraining and fine-tuning rates differ so much), mix in some general-purpose data alongside the narrow fine-tuning set, and evaluate on a broad suite before and after fine-tuning, not just on the target task, to catch regressions early.

### The mistake: reaching for RLHF or DPO when plain SFT would do

**Why it's wrong:** preference optimization solves a specific problem — teaching a relative ranking between plausible responses (see [RLHF: Reward Models and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo) and [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods)) — and it comes with real cost and real risk (see [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy)). If the actual gap is that the model doesn't know the target behavior at all — it's never seen the format, the domain, or the task — no amount of ranking two bad-in-different-ways responses teaches it that behavior. SFT on direct examples gets there faster, cheaper, and with fewer side effects.

**Symptom:** a team collects preference pairs and runs DPO or RLHF to fix a behavior gap, and the model doesn't reliably improve, because the two response options being ranked were both missing the target skill in the first place — there's nothing for the preference signal to push toward.

**Fix:** diagnose whether the model can produce the target behavior at all, with the right prompt or examples, before reaching for preference optimization. If it can't, that's an SFT gap, not a preference gap. Save preference optimization for genuinely subjective tradeoffs, where the model can already produce multiple plausible answers and needs to prefer the better one.

### The mistake: borrowing a pretraining-scale learning rate for fine-tuning

**Why it's wrong:** fine-tuning starts from a model that already sits in a good region of the loss landscape. A learning rate sized for random initialization — large, meant to move weights a long way — applied to an already-converged model can knock it out of that region fast, compounding both overfitting and forgetting in a single mistake.

**Symptom:** fine-tuning loss drops sharply in the first few steps, sometimes to near zero, while the model's general behavior degrades noticeably even at low step counts — a faster, cruder version of the forgetting symptom above.

**Fix:** use fine-tuning learning rates an order of magnitude or more below typical pretraining rates, paired with a short warmup of their own scaled down from the recipe in [Optimization Mechanics](/learn/llm-foundations/optimization-mechanics-adam-warmup).

## Pre-flight checklist

- [ ] Held-out validation split set aside from the SFT data, checked before trusting training loss alone.
- [ ] Deliberate variation in incidental format features across examples, not just the target instruction.
- [ ] A broad, pre-fine-tuning eval baseline captured, so forgetting is measurable, not just felt.
- [ ] A clear answer to "does the model already produce this behavior sometimes?" before reaching for preference optimization instead of SFT.
- [ ] Fine-tuning learning rate confirmed well below the base model's pretraining rate, with its own shorter warmup.

**Related:** [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [Pretraining Explained](/learn/llm-foundations/pretraining-explained), [Optimization Mechanics: AdamW, Warmup, and Schedules](/learn/llm-foundations/optimization-mechanics-adam-warmup), [RLHF vs DPO vs Other Preference Methods](/learn/llm-foundations/rlhf-vs-dpo-vs-preference-methods), [The Alignment Tax](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy), [Fine-Tuning vs Prompting vs RAG](/learn/llm-foundations/fine-tuning-vs-prompting-vs-rag)
