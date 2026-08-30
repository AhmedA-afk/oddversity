---
title: "Quiz: when and which AI"
track: "ai-literacy"
status: live
summary: "A 6-question self-check quiz for the 'Deciding When and Which AI' module, pairing each scenario with two judgment calls — use AI at all, and if so which category — covering current."
duration: "12 min read"
---

Six situations, two calls to make on each: should AI touch this at all, and if it does, which flavor of AI actually earns its place. That pairing — [should I use AI for this](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions) and [which tool fits the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) — is the whole skill this module built. Work through each one before you check the answer.

## 1. The merger update

Your manager asks: "What's the latest on the merger you've been tracking — did regulators approve it this week?" You open your usual AI chat assistant, the plain kind with no web browsing turned on, and ask it directly.

- **A.** Trust whatever it says — AI is trained on huge amounts of data, so recent events are covered.
- **B.** Don't use AI at all for this — only a human following the news can answer it.
- **C.** Don't rely on this assistant for this question. Switch to a tool with live search grounding, or just check a news source, since a plain chat model has a training cutoff and may produce a confident, plausible-sounding guess instead of admitting it doesn't know.
- **D.** Ask the assistant, then tell it to "double-check itself" before answering — that fixes the staleness problem.

<details><summary>Answer</summary>

**Correct: C.** A plain chat model's knowledge stops at its training cutoff. Ask it about something that happened this week and it doesn't reliably say "I don't know" — it often pattern-matches to something plausible and states it with the same confidence as a fact it actually knows. The fix isn't skipping AI, it's picking the category built for this: a tool with live web access, or a search-grounded assistant that cites what it found. **A** is the exact trap — recent events are the one place a static model's fluent tone is least trustworthy. **B** overcorrects: this is a good AI task, just not for that tool. **D** doesn't work because asking the same ungrounded model to check itself doesn't hand it any new information — it's still reasoning from the same stale training data, so "double-checking" just produces a second confident guess, not a verified one.

</details>

## 2. The employee reviews

An HR colleague wants to summarize a stack of performance reviews — names, salary details, disciplinary notes — and reaches for the free AI chatbot she uses for everything else, to save an afternoon of work.

- **A.** Go ahead — it's just for internal use, so where the data goes doesn't matter.
- **B.** Pause before pasting anything in. Check whether the organization has an approved tool with a data-handling agreement, or strip identifying details first — a free consumer chatbot's terms often allow using your input to improve the model, which is a real exposure for salary and disciplinary data.
- **C.** Paste it in, then delete the input afterward — deleting it removes the risk.
- **D.** Skip AI entirely for this task — anything touching personal information should always be done by hand.

<details><summary>Answer</summary>

**Correct: B.** This is the "avoid or use carefully" case, not a flat yes or a flat no. The right move is checking what you're actually agreeing to — an enterprise tier with a real data agreement, an on-device option, or just redacting names and numbers before you paste anything — see [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) for the fuller checklist. **A** is the trap: "internal use" describes your intent, not what the vendor's terms actually permit once the text leaves your machine. **C** assumes deletion is retroactive — by the time you delete your input, it's already been transmitted and possibly logged or used; you can't un-send it. **D** overcorrects — a properly scoped tool can absolutely help here, so banning AI outright throws away a real time-saver over a solvable problem.

</details>

## 3. The bake sale flyer

You're organizing a neighborhood bake sale and need fifteen punny name ideas plus a short, upbeat flyer blurb. There's no fact to get wrong here — it's pure wordplay and tone.

- **A.** This is a great fit for a general-purpose AI assistant — ask for a big batch of options, skim for the ones that land, and iterate on tone. Verification here is just "do I like this," not fact-checking.
- **B.** Skip AI — creative writing needs a human touch AI can't fake.
- **C.** Use AI, but treat every pun and phrase as a claim you need to verify before using it.
- **D.** This is too trivial to bother with AI — save it for harder problems.

<details><summary>Answer</summary>

**Correct: A.** This is the case the module keeps pointing at as a genuinely strong fit: high volume of options, low cost if a few are bad, and no factual claim to be wrong about. You're the entire quality bar. **B** overstates AI's limits — brainstorming and wordplay are exactly where it's fast and useful, not a weakness to route around. **C** borrows the [verification](/learn/ai-literacy/uncertainty-and-verification) mindset from a domain where it doesn't apply — there's nothing here that can be "true" or "false," so treating puns like facts just adds pointless friction. **D** has it backwards: low-stakes, high-volume tasks are precisely where the time saved is worth the most relative to the (near-zero) risk.

</details>

## 4. The bloodwork results

A friend pastes their recent bloodwork numbers into an AI chatbot and asks whether anything looks concerning. If the AI says it's fine, they're planning to skip the follow-up doctor's appointment.

- **A.** Fine to trust it — AI has absorbed huge amounts of medical literature, probably more than one rushed doctor has memorized.
- **B.** Never use AI for anything health-related, under any circumstance.
- **C.** Use it, and just ask "are you sure?" — if it confirms, that's a good second opinion.
- **D.** AI can be a reasonable first pass — help decode unfamiliar terms, draft questions for the appointment — but this is high-stakes and hard to verify from the outside, so it shouldn't replace the doctor or be treated as the final word on the numbers.

<details><summary>Answer</summary>

**Correct: D.** High-stakes doesn't mean "never touch it," it means the bar for trusting the output unverified gets much higher — sometimes high enough that you shouldn't rely on it as the final answer at all. Using AI to prep smarter questions for the doctor is fine; using it *instead of* the doctor isn't, because it has none of the context (history, other symptoms, an actual exam) that interpretation of bloodwork depends on. **A** mistakes broad training data for correct judgment about one specific person's numbers. **B** overcorrects — it throws away a genuinely useful prep step over a risk that a narrower use avoids. **C** is a trap that shows up constantly: asking a model to confirm itself isn't independent verification, it's just asking the same source the same question again, and models tend to agree rather than push back. See [the verification checklist](/learn/ai-literacy/the-verification-checklist) for what actual verification looks like instead.

</details>

## 5. The weekly reformat

Every Monday you take a raw export of 500 sales rows and retype it into a fixed template — same three columns, same rules, every single week. Lately you've been opening a chat AI tab and pasting in a batch at a time, asking it to reformat each chunk.

- **A.** Keep doing what you're doing — chat AI is the right tool for any reformatting job.
- **B.** This is a good candidate to actually automate — a spreadsheet formula, a template, or a simple "do this every time" tool — rather than re-prompting a chat assistant by hand each week. The rules are fixed and the task repeats identically; that's what automation is for. A chat tool earns its keep on a task that's different each time, not one that's the same every time.
- **C.** Stop using AI for this — repetitive data work should always be done by hand to avoid mistakes.
- **D.** Ask the AI to remember the rules permanently so you never have to explain them again.

<details><summary>Answer</summary>

**Correct: B.** This is the [task-vs-automation](/learn/ai-literacy/task-or-automation) line: a chat assistant is well-suited to something that changes shape every time you do it, but a fixed, identical, recurring transformation is exactly what a formula, template, or small automation handles more reliably — and it does it without you sitting in the loop re-explaining the rules weekly. **A** ignores that reliability and repeatability, not conversational flexibility, are what this job actually needs. **C** doesn't reduce errors — manual retyping is usually where the errors come from — and it throws away a solvable, worth-automating task. **D** misses that most chat tools don't retain memory across sessions by default, and even if one did, "remembering rules" doesn't change the underlying mismatch: this needs a deterministic process, not a conversation.

</details>

## 6. The DMV phone number

You need your local DMV's exact current phone number and hours before you drive over. You open an AI chatbot and ask it directly.

- **A.** Good move — AI is faster than searching yourself and gives you a clean, direct answer.
- **B.** Better to check the DMV's official site or a maps listing directly. This is a simple lookup with exactly one correct, verifiable answer, and a generative model can state a wrong or outdated number with the same confident tone as a correct one — [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine), it's a text predictor, and for facts like this the primary source is faster to trust and just as fast to reach.
- **C.** Ask the AI, then ask it "are you sure that's correct?" as your verification step.
- **D.** Avoid AI and avoid searching online too — call a friend who might know instead.

<details><summary>Answer</summary>

**Correct: B.** When there's a single authoritative source and an exact answer, going straight to that source beats asking a model to reconstruct it from patterns in its training data — hours and phone numbers change, and nothing in a fluent-sounding answer tells you whether it's current. **A** confuses speed with correctness; a wrong answer delivered instantly is still wrong. **C** is the same false-verification trap as questions 1 and 4 — asking the same model to confirm itself isn't an independent check, it's just a second guess from the same source. **D** overcorrects past the point that matters: the issue isn't digital tools in general, it's using a generative model specifically for something that has one exact, checkable answer sitting on an official page.

</details>

## The pattern underneath all six

Notice what repeated: "ask it to double-check itself" was wrong three separate times (Q1, Q4, Q6) — self-confirmation from the same model isn't verification, it's just another sample from the same source. And "don't use AI at all" was wrong every single time it appeared as an option (Q1, Q2's cousin, Q4, Q6) — the real skill is almost never a flat yes/no, it's routing the task to the right category: live-grounded for anything time-sensitive, a vetted/private tool for sensitive data, general-purpose generation for low-stakes creative work, human judgment as the final authority for high-stakes calls, real automation for anything fixed and repeating, and the primary source for anything with one exact answer.

**Related:** [Should I use AI for this? Worked decisions](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions) · [Matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) · [Compare AI tools for one real task](/learn/ai-literacy/compare-ai-tools-for-one-real-task) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) · [The AI literacy master cheatsheet](/learn/ai-literacy/ai-literacy-master-cheatsheet)
