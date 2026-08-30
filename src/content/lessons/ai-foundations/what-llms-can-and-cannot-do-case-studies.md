---
title: "Four Prompts That Reveal the Edges"
track: "ai-foundations"
status: live
summary: "Worked-example lesson for Oddversity's AI Foundations track: runs one model through four contrasting prompts (fluent summary, 13-digit multiplication, citation request, multi-step "
duration: "14 min read"
---

"It's smart at some things and dumb at others" is true and useless. [What LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) draws the boundary; this page puts one model through four prompts in one sitting and traces *why* each result comes out the way it does, one next-token step at a time.

## The setup

Same model, same chat session, no tools, no retrieval, no calculator plugin — just raw autoregressive generation. That constraint matters: everything below is a property of "predict the next token, then feed it back in and do it again," not a property of any particular vendor's model. Four prompts, back to back:

1. Summarize a paragraph.
2. Multiply two mid-sized numbers by hand.
3. Cite five sources for a claim.
4. Solve a four-step word problem — once asked for just the answer, once asked to show your work.

Nothing here is a benchmark score. It's a dissection: same mechanism, four different collisions between "plausible" and "correct."

## Step by step

### 1. The summary — reliable, and here's why

Prompt:

> Summarize this in two sentences: "The city council voted 5-2 Tuesday to approve the transit expansion after nearly three hours of public comment. Supporters argued the new bus routes would cut commute times for the east side, while opponents cited the $40M cost and worried about construction disruption on Fifth Avenue. The plan now goes to the mayor, who has ten days to sign or veto it."

Output:

> The city council approved a $40M transit expansion in a 5-2 vote after lengthy public debate over commute benefits versus cost and construction concerns. The mayor now has ten days to sign or veto the plan.

This works because at every generation step, the correct next token is *already sitting in the context window*. The model isn't retrieving "5-2" or "$40M" or "ten days" from some fuzzy memorized fact store — it's attending back to the exact tokens you just gave it and re-emitting a compressed, paraphrased version. The training signal for this task (huge amounts of article-plus-summary, email-plus-TL;DR pairs) sharply peaks the next-token distribution around "restate the salient tokens from above, shorter." Plausible and correct are the same target here, because correctness is fully derivable from what's already in context.

> **Why this step?** It's the control. You need one case where the mechanism obviously works before you can say precisely what's different about the ones where it doesn't.

### 2. The multiplication — unreliable, and here's the mechanism

Prompt:

> What is 6247913 × 839104? Just give me the number.

A model asked this cold, with no scratchpad, will often produce something close-looking but wrong — say, `5242648779952` instead of the correct `5242648789952` (they differ by exactly 10,000 — a dropped or corrupted digit in the middle, not a wild guess). You can check the real answer yourself:

```python
a, b = 6247913, 839104
print(a * b)
# 5242648789952
```

Two separate mechanical reasons this is unreliable, and neither is "the model is bad at math" as a personality trait:

**Tokenization doesn't respect place value.** A [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) tokenizer wasn't designed around arithmetic — it merges whatever digit substrings were frequent in its training corpus. `839104` might come apart as `["839", "104"]` or `["83", "91", "04"]` depending on the tokenizer and what it happened to see a lot of; the split has nothing to do with hundreds, thousands, or millions place. Grade-school multiplication is an algorithm defined over place value. If the input representation itself scrambles place value, every downstream step is fighting the encoding before it even gets to the arithmetic.

**There's no persistent scratchpad, and no going back.** Do this by hand and you carry digits: 4×3=12, write 2, carry 1, add it into the next column. That's *state* that has to survive across many small steps. A transformer generating the answer as a single number has to produce it left to right, and — because of [causal masking](/learn/llm-foundations/causal-masking) — it can never revise a digit it already emitted. Whatever carry error creeps in at position 6 just rides along into positions 7 through 13. There's no mechanism to notice "wait, that carry was wrong" and fix it, because fixing it would mean editing a token that's already locked into the context.

Contrast this directly with the summary: there, the answer already existed in the input tokens and the job was compression. Here, the answer exists nowhere until it's computed, and computing it exactly requires a long deterministic chain of state that next-token prediction was never trained to hold onto reliably.

> **Why this step?** This is the cleanest possible contrast with step 1. Same mechanism (predict plausible next token), completely different reliability, because the *source of truth* moved from "in the context, just restate it" to "must be derived by an exact algorithm the model has no dedicated circuitry for."

### 3. The citations — invented, and here's why they look so real

Prompt:

> Give me five peer-reviewed citations for the claim that listening to Baroque music while debugging code measurably shortens time-to-fix.

A plausible-looking response:

> 1. Whitfield, R. & Alden, T. (2015). "Tempo, Focus, and Task Switching in Software Debugging." *Journal of Applied Cognitive Ergonomics*, 19(2), 88–104.
> 2. Marsh, D. K. (2012). "Baroque Structure and Sustained Attention in Programmers." *Cognition and Software Practice*, 6(1), 33–51.
> 3. Okonkwo, L., Reyes, P., & Bianchi, S. (2018). "Background Music Tempo and Error-Localization Speed." *Human Factors in Computing Systems Quarterly*, 22(4), 301–319.

I invented every part of those — names, years, journal titles, volume and page numbers. None of them exist. I made them up in about fifteen seconds, and that's exactly the point: a model can do the same thing, just as fast, and just as convincingly.

Here's the mechanism. A citation has a *template*: `Author, Initial. (Year). "Title." Journal, volume(issue), pages.` The model has seen that template millions of times, densely enough that "produce something shaped like a citation, topically related to the claim above" is a very confident, very fluent next-token task — same family as the summary. What's different is what the template's slots are *grounded in*. In the summary, every slot traces back to tokens in your prompt. In a citation, the slots need to trace back to a real external database of papers that actually exist — and next-token prediction has no mechanism that checks a generated string against reality at generation time. It's filling in "what does a citation for a claim like this typically look like," not "what citation for this claim is retrievably true." Plausible-shaped and real are different targets, and nothing in the training objective forces them to coincide. See [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) for the deeper version of this failure across other task types.

> **Why this step?** It isolates the variable that mattered in step 2 differently than tokenization did. Here the problem isn't computation — generating a well-formed citation is trivial for the model — the problem is that "well-formed" and "true" are simply not the same property, and nothing in next-token prediction enforces the second one.

### 4. The word problem — with and without a scratchpad

Prompt A, no scratchpad allowed:

> A store had 144 apples. It sold 3/8 of them in the morning, then received 40 more, then sold half of what remained. Just give me the final number, nothing else.

A plausible wrong answer: `45`. That's not a random guess — it's what you get if the model correctly does 144 → sold 3/8 → 90 left, then jumps straight to "sold half of what remained" on 90 (→45), silently dropping the "received 40 more" step in between. Three operations chained correctly, one step in the middle lost.

Prompt B, same problem, one instruction added:

> Show your work step by step, then give the final number.

> Sold in the morning: 3/8 × 144 = 54. Remaining: 144 − 54 = 90.
> After delivery: 90 + 40 = 130.
> Sold in the afternoon: half of 130 = 65. Remaining: 130 − 65 = 65.
> **Final answer: 65.**

Verify it:

```python
apples = 144
sold_morning = 3 * apples // 8      # 54
remaining = apples - sold_morning    # 90
remaining += 40                      # 130
sold_afternoon = remaining // 2      # 65
final = remaining - sold_afternoon   # 65
print(final)  # 65
```

Here's the mechanism, and it connects directly to the two failures above. A transformer has a fixed number of layers, so every generated token gets exactly the same, fixed amount of forward computation — call it its "compute budget per token." When you demand *just the final number*, the entire four-step chain (a fraction, a subtraction, an addition, another fraction, another subtraction) has to happen inside that one token's worth of internal computation, hidden in the model's activations, with no way to check an intermediate result before committing to the next one. That's the same "no scratchpad, no going back" problem as the multiplication — just wearing word-problem clothes instead of digit clothes.

[Chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) fixes it by changing *where the computation lives*. Every token the model writes out gets fed back in as new context for the next one, and each of those next tokens gets its own full layer stack to work with. "Show your work" doesn't make the model smarter — it converts one hard, deep computation into a chain of easy, shallow ones, each with its own fresh compute budget and, crucially, a visible, attendable record of what it already concluded.

> **Why this step?** It's the same failure mode as the multiplication (bounded per-token computation, no revision) but with a fix that stays entirely inside next-token prediction — no tools, no retrieval, just more visible tokens. That makes it the cleanest demonstration that the fix has to change the *shape of the computation*, not the wording of the ask.

## Where it breaks — even with the fix

Chain-of-thought is real, but it's not a cure — it's a patch for one specific failure mode (not enough serial computation per token), and it inherits the other failure mode for free. Causal masking still means the model can never revise a token once it's written. Push the apples problem to eight or nine chained operations instead of four, and a wrong number two steps in doesn't get caught — it just gets carried forward and confidently narrated as if it were correct, because every later token is conditioning on an established context, not re-deriving the earlier arithmetic from scratch. Longer visible reasoning gives you more chances to compute correctly at each step, but zero chances to notice a mistake once it's made, unless something *outside* the generation — you, or a second pass, or a verifier — checks it.

That's the actual boundary, and it points at two different fixes depending on which failure you're looking at:

**For exact computation (the multiplication case), stop asking the model to compute — have it delegate.** Even a model that writes out a full long-multiplication scratchpad, digit by digit, is still doing each digit-and-carry step as next-token prediction, which is exactly the unreliable operation from step 2, just chunked smaller. The fix that actually works is to route the arithmetic to something that computes exactly instead of plausibly:

```python
# instead of trusting a generated number, generate the
# expression and evaluate it with code — the model's job
# becomes "parse the problem into an expression," which is
# a language task it's genuinely good at; the arithmetic
# itself happens outside the token stream entirely.
expression = "6247913 * 839104"
result = eval(expression)  # exact, every time
print(result)
```

This is the same principle behind tool-calling and code-interpreter setups: the model still writes the expression, but something else evaluates it. You're not making next-token prediction more reliable; you're routing the part it's structurally bad at to something else and keeping the model on the part it's structurally good at (turning your sentence into a well-formed expression).

**For unverifiable facts (the citation case), the fix isn't "ask it to double-check itself"** — a model re-asked "are you sure those citations are real?" will happily generate a fluent, confident-sounding correction that's just as unverified as the original, because it's still working from the same template-completion mechanism with no access to a real paper database. The fix that actually works is grounding: retrieve real sources first, then have the model cite only from what was retrieved. That's the whole premise behind [retrieval-augmented generation](/learn/rag/what-is-rag-and-when-to-use-it) — it doesn't make the model better at remembering citations, it removes the need for the model to generate them from parametric memory at all.

## Takeaways

- Every generated token is a plausibility judgment conditioned on context — never a correctness check. When "plausible" and "correct" happen to be the same target, you get reliable output for free.
- They're the same target when the answer is fully derivable from what's already in the prompt (the summary). They diverge when the task needs an exact algorithm the model has no dedicated circuit for (multiplication), a fact from outside the context that has to be independently real (citations), or more sequential computation than one token's fixed layer budget allows (the word problem, without a scratchpad).
- Causal masking means the model can only add tokens, never revise ones it already committed to — so an early slip anywhere in a chain rides forward uncorrected, no matter how fluent the tokens after it sound.
- Chain-of-thought fixes the "not enough computation per token" failure by turning hidden computation into visible, re-attendable tokens. It does not fix "no way to catch an error once it's made" — that needs something outside the generation itself.
- The durable fix is never a better-worded prompt. It's changing the substrate: put the fact in context (grounding), externalize the steps (chain-of-thought), or hand the operation to something that computes exactly (a tool call). Each of the three failures above maps to exactly one of those three fixes — which is a useful diagnostic to run *before* you pick which one to reach for. That diagnostic — a small, deliberately varied prompt set like this one — is also the seed of a real eval set: the four prompts here differ from a proper one mainly in scale and repetition, not in kind.

**Related:** [What LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) · [Byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) · [Causal masking](/learn/llm-foundations/causal-masking) · [Why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate) · [Chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) · [What is RAG and when to use it](/learn/rag/what-is-rag-and-when-to-use-it)
