---
title: "Quiz: cost, limits, and tradeoffs"
track: "ai-literacy"
status: live
summary: "Six scenario-based MCQs testing calibrated, cost-aware AI use: weighing stakes against verification cost, free vs. paid decisions, permanent limits vs."
duration: "12 min read"
---

No definitions this time — just six situations like the ones you'll actually run into, where the "right" answer depends on stakes, verification cost, and what's actually fixable versus permanent.

## 1. Stakes plus verification cost

You're deciding whether to use AI for four tasks. Considering both the stakes if something's wrong *and* how expensive it would be to verify the output, which task is the best fit for AI?

- **A.** Drafting the first pass of a performance review for a direct report — you'll edit it yourself before it goes anywhere, and you already know every specific well enough to check the draft in under a minute.
- **B.** Summarizing a 40-page vendor contract's key obligations, when you plan to skim the summary and sign off without reading the actual contract.
- **C.** Generating the financial projections for a board deck you're presenting tomorrow, using numbers you won't have time to trace back to the source spreadsheet.
- **D.** Writing a one-off social post announcing a minor product update, posted without a second look because it's "low stakes."

<details><summary>Answer</summary>

**Correct: A.** This is the sweet spot the whole module has been building toward: stakes are real (it affects someone's career) but verification cost is low, because you were there for the events being described and can check every claim against your own memory in a minute. High stakes alone don't disqualify AI — high stakes *combined with* expensive or impossible verification does. See [is AI worth it for this task](/learn/ai-literacy/is-ai-worth-it-for-this-task) for the full framework.

**B** is tempting because a summary feels like a time-saver, but you're describing skipping the verification entirely on a document with real legal obligations. The task itself might be a fine use of AI — the plan of "skim the AI summary and never open the source" is the problem. Cheap summarization isn't the same as cheap verification.

**C** stacks the two worst factors together: high stakes (a board is making decisions on these numbers) and no verification path at all before they go live. This is the clearest case of "don't," not because AI is bad at math-adjacent tasks, but because nobody is checking the output before it matters.

**D** sounds safe because "low stakes" is doing a lot of work in that sentence, but a ten-second glance costs almost nothing and catches the cases where a typo becomes a wrong claim about your own product. "Low stakes" is a reason to skip a *heavy* review, not a reason to skip looking at all.

</details>

## 2. When the cost multiplies

You need to send personalized thank-you notes to 200 event attendees, each referencing something specific from your actual conversation with them. Which approach best accounts for the real cost of using AI here?

- **A.** Skip AI entirely — 200 notes is too many to trust to a model, so write them all by hand.
- **B.** Have AI draft all 200 from your notes on each conversation, then spot-check a random 10 percent before sending.
- **C.** Have AI draft all 200 from your notes, and skim every single one before sending.
- **D.** Have AI draft all 200 and send them without review — checking each one defeats the point of using AI at scale.

<details><summary>Answer</summary>

**Correct: C.** Verification cost isn't fixed — it scales with volume, but here it scales *cheaply*, because you supplied the ground truth yourself (your own notes on each conversation). A quick skim of each note against what you actually remember takes seconds per note, and the failure mode you're guarding against — a fabricated or swapped detail attached to a real person's name — is exactly the kind of error that's invisible in aggregate and mortifying in the one instance it happens to. [What using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs) covers why cost is per-use, not one-time.

**A** overcorrects. It throws away real time savings on a task where AI is genuinely well-suited (personalized drafting from source material you provide), out of a fear that applies to unverified output, not to output you're about to check.

**B** is the trap version of "at scale, sample instead of checking everything." A 10 percent sample tells you the *average* error rate, but it does nothing to stop a wrong detail from reaching the 90 percent of recipients you didn't sample. Sampling works for judging overall quality; it doesn't work for catching the specific instance that's about to embarrass you with a specific person.

**D** skips verification altogether on the exact category of content — invented specifics, names, details — where models are most likely to blend or fabricate. This is the most expensive mistake per dollar saved.

</details>

## 3. Free tier or paid plan

Which of these people has the clearest case for paying for AI rather than using a free tier?

- **A.** A student who occasionally asks AI to explain a concept from a textbook, a few times a week.
- **B.** Someone drafting one casual text a day to reschedule plans with friends.
- **C.** A freelance analyst who needs to feed long client reports into a single conversation and get consistently strong reasoning across several projects a day, where output quality affects income.
- **D.** A hobbyist who asks for a dinner recipe once a month.

<details><summary>Answer</summary>

**Correct: C.** Paid tiers earn their cost on three things free tiers usually cap: how much you can put in front of the model at once, how often you can use it before hitting a limit, and access to more capable models for harder reasoning. When the quality of the output has a direct line to your income and you're using it daily across substantial documents, those caps start costing you more than the subscription would. [Free vs. paid: what you actually get](/learn/ai-literacy/free-vs-paid-ai-what-you-get) breaks down exactly which limits differ.

**A** is light, occasional, low-stakes use — comfortably inside what free tiers are built for. Paying here buys capacity that goes unused.

**B** is even lighter: one short, low-stakes message a day. There's no volume or capability ceiling being hit.

**D** is the clearest non-case in the set — infrequent, trivial, nothing-on-the-line use. A paid plan adds cost with no corresponding benefit at this usage level.

</details>

## 4. Real limit, or just a bad prompt

Which of these is a limit no amount of clever prompting fixes, as opposed to a problem a clearer prompt would mostly solve?

- **A.** It states a fact that doesn't exist, in the same confident tone it uses for facts that check out.
- **B.** It gives you a generic, one-size-fits-all answer because you didn't say who it's for or what you already tried.
- **C.** It ignores the format you needed — a table instead of the bullet points you actually wanted.
- **D.** It answers a noticeably different question than the one you meant to ask.

<details><summary>Answer</summary>

**Correct: A.** This is the deep, architectural one. The model is trained to produce fluent, plausible-sounding text, not to consult a truth-checked database and flag what it's unsure of — it has no reliable internal "I don't actually know this" signal. That means a fabricated statistic gets stated with the exact same confidence as a verified one, and no phrasing — "only tell me true things," "double-check yourself," "cite your sources" — reliably changes that, because the model can't distinguish confident-and-true from confident-and-fabricated at the moment it's generating text. This is precisely [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) even when it's wrong, and it's the reason verification stays your job no matter how good your prompt is.

**B** feels like a hard ceiling but is usually starvation of context — the model mirrors the vagueness of the ask. Tell it who the answer is for, what "specific" means here, and what you've already ruled out, and generic answers usually sharpen up fast. That's a prompting fix, not a limit.

**C** is one of the most reliably steerable things about model output. Say "a table with these three columns" and it complies almost every time. Treating this as a limit usually just means the format was never specified.

**D** feels like the model "not getting it," but it's typically a compressed or ambiguous prompt trying to do two jobs at once. Splitting the ask, or showing an example of the shape you want, usually closes the gap — no fundamental wall here.

</details>

## 5. The over-truster and the dismisser

Two coworkers use AI very differently. Priya pastes AI's first draft of a client email straight into the send box, because "it sounds right." Marcus refuses to use AI for anything, including brainstorming a list of possible blog topics, because "you can't trust it." What should each of them actually change?

- **A.** Priya should stop using AI altogether; Marcus is right to keep avoiding it.
- **B.** Priya should keep sending drafts unedited since AI is usually right; Marcus should start trusting outputs without checking them too.
- **C.** Priya should add a verification step sized to the task's stakes before sending anything AI drafted; Marcus should use AI for low-stakes, easy-to-verify tasks like brainstorming, where being wrong costs nothing.
- **D.** Priya should only use AI for brainstorming, never client-facing writing; Marcus should only use AI for client-facing writing, never brainstorming.

<details><summary>Answer</summary>

**Correct: C.** This is calibration in one sentence: verification effort should scale with stakes, not with how confident the output sounds. Priya's email touches a client relationship, so it deserves a read-through sized to that — not paranoid line-by-line fact-checking, just an actual look before it leaves her outbox. Marcus is paying the full cost of double-checking (in this case, his own labor of generating ideas from scratch) on a task where an AI miss costs nothing — he's picking from a list, not shipping anything raw. See [the single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) and [when AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts).

**A** overcorrects in both directions. Priya doesn't need to quit AI — she needs a verification habit, not abstinence. And Marcus isn't being appropriately cautious; he's avoiding a task where caution isn't even required.

**B** takes the worst habit in the pair and recommends it for everyone. Priya is already the over-truster; telling Marcus to match her turns two different failure modes into one shared one.

**D** sounds like a reasonable-seeming rule but has the logic backwards. It bans AI from exactly the place it's safest (brainstorming, where a bad idea costs nothing because you're the one selecting from the list) and does nothing about Priya's actual problem, which isn't the *category* of task — it's the missing check before she hits send.

</details>

## 6. When "quick to check" isn't verification

You've internalized "weigh verification cost against stakes." Here's a harder version: a friend asks AI to summarize the side effects and interactions of a new prescription they're about to start, and plans to act on the summary without calling their doctor or pharmacist. It feels low-effort to verify — they can just skim it once. What's the most accurate read?

- **A.** Fine to trust as-is — medical information is well-documented, so AI is unlikely to get it wrong.
- **B.** This is the sweet spot from the earlier framework: the check is quick, so it's worth using AI here without extra steps.
- **C.** A quick skim isn't real verification here: the stakes are irreversible, and "reads plausible to a non-expert" isn't the same as "confirmed by someone qualified." The better move is using AI to prepare sharp questions for the pharmacist, not to replace them.
- **D.** Avoid AI completely for anything health-related — go straight to a professional every time.

<details><summary>Answer</summary>

**Correct: C.** This is the nuance the earlier questions were building toward: "quick to read" and "quick to verify" are not the same thing. Your friend can skim the summary fast, but skimming doesn't let a non-expert catch a wrong dosage note or a missed interaction with something else they're taking — they're not qualified to spot the error even if it's sitting right there in plain text. And the downside here is irreversible: a health outcome, not an email you can send a correction for. When you can't personally confirm correctness *and* a miss can't be undone, the right move is to use AI upstream — to turn "what should I even ask about this" into a sharp list of questions — and route the actual decision to a qualified check. This is the harder version of [should I use AI for this?](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions).

**A** assumes documentation existing somewhere means the summary correctly reflects it for this specific person's specific combination of medications — which is exactly the kind of detail a general summary can blend or miss.

**B** is the trap this question is built to catch. "Easy to skim" got mistaken for "easy to verify." The framework from question 1 still holds, but skimming a plausible-sounding paragraph isn't a verification step when you're not qualified to catch what's wrong with it — and irreversible stakes raise the bar even when the check *feels* effortless.

**D** throws out real value. AI is genuinely useful here as prep — turning vague worry into specific, well-formed questions for the pharmacist — which is a different job from being the final word on a medical decision. Banning it outright loses that without adding any safety.

</details>

**Related:** [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [The real limits of AI today](/learn/ai-literacy/the-real-limits-of-ai-today) · [Expecting too much or too little](/learn/ai-literacy/expecting-too-much-or-too-little) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) · [AI literacy master cheatsheet](/learn/ai-literacy/ai-literacy-master-cheatsheet)
