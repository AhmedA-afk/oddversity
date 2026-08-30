---
title: "Quiz: privacy, bias, and ethics"
track: "ai-literacy"
status: live
summary: "A six-question scenario quiz testing judgment on what's safe to paste, document provenance, subtle stereotyping in AI output, where bias actually comes from, disclosing AI use at w."
duration: "10 min read"
---

These six are all judgment calls, not lookups — read the scenario, pick an answer, then check the reasoning behind all four options, not just the one you picked. The point isn't memorizing a rule; it's noticing which instinct fires first and whether it's the right one.

## 1. What's actually safe to paste?

You're mid-task in a general AI chat tool — not something your company vetted, just the free tool in another tab. Four things are sitting in your clipboard today. Which one is fine to paste in as-is?

- **A.** The angry customer email you need help replying to — it has the customer's full name, email address, and order number in the signature.
- **B.** A paragraph from your company's unreleased Q3 roadmap, so AI can help you tighten the wording.
- **C.** The press release your company published on its own website last month, so AI can help you adapt it for a different audience.
- **D.** Your teammate's self-review notes, which they shared with you privately before your 1:1 with them.

<details>
<summary>Answer</summary>

**Correct: C.** It's already public — your company put it on its own website for anyone to read — and it contains no one's personal data and no secret. Nothing changes by having a third-party tool also see it. That's the actual test for "safe to paste": is it already public, and is it free of both personal data and confidential business information? See [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) for the fuller checklist.

**A** — contains another person's identifiable information (name, email, order number). Once you paste it, you've handed that customer's data to a system whose retention and training practices you don't control — even though your intent (getting help with a reply) is completely reasonable.

**B** — "unreleased" is exactly the property that makes this sensitive, independent of whether it names anyone. Confidential business information doesn't need a person attached to it to be off-limits.

**D** — not yours to share. It was given to you for one specific purpose — prepping for a conversation with your teammate — not for general redistribution to another system.

</details>

## 2. Whose document is this, really?

A colleague sends you her draft proposal ahead of tomorrow's review meeting, so you can give her feedback in person. You're swamped, so you consider pasting the whole thing into an AI tool and asking for feedback on her behalf. What's the right question to ask yourself first?

- **A.** Is the writing good enough that AI feedback would even help?
- **B.** Does the document have a "Confidential" watermark or footer on it?
- **C.** Do I have the right to share someone else's unpublished work with a third-party tool, regardless of whether it's labeled confidential?
- **D.** Will the AI's feedback be better than what I could give myself?

<details>
<summary>Answer</summary>

**Correct: C.** This is a provenance question, not a quality question: who made this, and did they authorize it going to a third party. She shared the doc with you for one purpose — your personal read before a meeting — not for redistribution to any system, human or AI. If you want AI's help, ask her first, or work from the structural question ("how do I evaluate a proposal like this one") without pasting her actual content. More on this in [data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy).

**A** — writing quality has nothing to do with whether you're allowed to share it.

**B** — this is the tempting one, because it feels like a real check. But absence of a label isn't permission. Most sensitive documents in ordinary work — a draft, a set of notes, an internal deck — are sensitive by default and only get watermarked when someone remembers to. Provenance is the real test, not decoration on the file.

**D** — same error as A: the quality of the eventual output doesn't establish your right to submit the input.

</details>

## 3. The bio that stereotypes without meaning to

You give an AI tool three facts — name, job title (nurse), country of origin (Philippines) — and ask for a two-sentence professional bio for a company directory. It comes back describing her as "warm and naturally nurturing, perfectly suited to patient care" — a trait you never mentioned or asked about. What actually happened, and what's the fix?

- **A.** The model hallucinated a fact about her personality; the fix is to double-check every biographical claim against a source before publishing.
- **B.** The model drew on a statistical association in its training data — this job, and patterns tied to gender and nationality, tend to co-occur with "nurturing" language — and reproduced it as if it were a fact about her; the fix is to strip out any trait or character judgment the model added that you didn't supply.
- **C.** This is the model being deliberately programmed to stereotype certain nationalities, and should be reported as a bug.
- **D.** It's a flattering description, not a harmful one, so it's fine to leave in.

<details>
<summary>Answer</summary>

**Correct: B.** The model isn't stating a fact about her — it's filling in "what usually goes with these words" from the patterns it learned, and those patterns often encode real stereotypes about gender, nationality, and occupation. The fix isn't just fact-checking; it's treating any added character or trait language as a flag, since you gave it none. Walk through a case like this end to end in [spot bias in AI output: a worked example](/learn/ai-literacy/spot-bias-in-ai-output-worked-example).

**A** — wrong diagnosis. A hallucination is an invented *fact* — a wrong date, a credential she doesn't have. This is different: no false individual fact, but a stereotyped assumption dressed up as a personal detail. Fact-checking alone won't catch it, because there's no record to check it against — the model didn't get anything "wrong," it pattern-matched.

**C** — assumes deliberate intent. What's actually happening is a byproduct of statistical patterns in training data, not a targeted decision by anyone. That distinction matters for your response: you fix your prompt and review the output, you don't go hunting for someone to blame.

**D** — minimizes the problem. A "flattering" stereotype is still a stereotype — it reduces an individual to a group assumption instead of describing her. Positive-coded bias is actually the harder case, because it's the one people wave through.

</details>

## 4. "It's just math, it can't be biased"

A coworker argues: "AI doesn't have opinions or feelings, it's just predicting text — so it can't actually be biased." What's the most accurate response?

- **A.** They're right — without beliefs, there's no bias, only correct or incorrect predictions.
- **B.** They're wrong — the people who built the model deliberately coded in their own biases.
- **C.** They're half right: the model doesn't hold beliefs, but it still learned statistical patterns from real-world text, including skewed and stereotyped ones, so it can produce biased output without "intending" anything.
- **D.** They're wrong — AI is measurably more biased than the average human, since it's trained on the entire internet.

<details>
<summary>Answer</summary>

**Correct: C.** This is the mental model the whole module rests on: bias isn't a belief a system holds, it's a property of the patterns it learned. Training data is generated by people, in a world with real historical and structural imbalances — who held which jobs, whose writing got published, whose face shows up in which context — and a system trained to predict "what comes next" reproduces those imbalances by default, with no intent required. That's what makes bias something you check for systematically instead of something you wait to feel offended by. See [where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from).

**A** — conflates two different things. "No opinions" doesn't mean "no systematic skew." Bias here means a pattern in the output, not a personal belief, so a system with no beliefs can absolutely still have it.

**B** — the tempting, conspiracy-flavored answer. It assumes deliberate intent, when the far more common (and better-supported) mechanism is pattern-learning from lopsided data. The distinction matters practically: the fix for "the training data was skewed" is auditing outputs and adjusting how you use the tool; the fix for "someone coded in prejudice on purpose" would be entirely different.

**D** — an unfounded comparative claim dressed up as a fact. Whether AI is "more biased than a human" isn't something you can state with confidence, and it's also not the useful question. What matters practically is that AI bias is systematic and repeats at scale — a separate concern from where it ranks against a person.

</details>

## 5. Do you tell your manager you used AI?

You used AI heavily on a client-facing report — it built the outline, wrote first-pass paragraphs, and helped tighten the language. You checked every number against the source data and rewrote the sections that felt off. Your manager asks, "did you write this yourself?" What's the right move?

- **A.** Say yes — you reviewed, verified, and revised it, so it's genuinely your work now.
- **B.** Tell her you used AI throughout the drafting process, and be ready to say specifically what you checked and changed.
- **C.** Don't bring it up unless she asks the exact words "did you use AI," since the content itself is accurate.
- **D.** Say you "used AI for everything," without going into specifics, to avoid a longer conversation.

<details>
<summary>Answer</summary>

**Correct: B.** She asked you a direct question, so "do you disclose" is already answered — yes. What's left is *how*: being specific about what was AI-drafted and what you personally verified is what makes the disclosure useful, rather than a compliance checkbox. It also protects you — AI-written text has a texture, and if she later asks about a paragraph you can't defend, a vague or technically-true answer now reads as having misled her. More on this tradeoff in [using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly).

**A** — the tempting one, because it conflates two true-sounding but separate claims: "I own the accuracy of this" (true — you verified it) and "I wrote it myself" (not true, and it's literally what she asked). Ownership of quality and honesty about process aren't the same thing, and answering as if they were is what causes trouble once it surfaces later.

**C** — misreads the scenario. This isn't a case of unprompted disclosure of a private process; you were asked directly. "Unless asked directly" doesn't apply when you were, in fact, asked directly.

**D** — technically true but useless. It gives her no way to know what to double-check versus trust outright. The specificity — what you verified, what you rewrote — is the part that actually does the work of disclosure.

</details>

## 6. Who's responsible when the tool does it, not you?

Your team uses an AI tool to do a first pass on resumes for an open role. After a few weeks you notice it's consistently filtering out anyone whose resume mentions a multi-year caregiving gap or lists a women's college — a pattern nobody explicitly asked it to apply. Who's responsible for the outcome?

- **A.** The AI vendor — they built the model, so any bias in its behavior is on them to fix.
- **B.** No one, really — this kind of pattern is an unavoidable cost of using AI for a task like this.
- **C.** You and your team, because you chose to deploy this tool for a consequential decision and are responsible for auditing its outputs for exactly this kind of pattern before acting on them.
- **D.** The candidates — their resumes are what triggered the pattern.

<details>
<summary>Answer</summary>

**Correct: C.** Using AI doesn't transfer responsibility for a decision to the tool or the company that built it. If you deploy a system to make or influence a consequential call about real people — hiring, lending, screening — you're accountable for checking it behaves acceptably before you rely on it, and for stopping if it doesn't. That's the same standard you'd apply to a spreadsheet formula that silently miscounted results; the fact that this one is AI doesn't lower the bar. This is the flip side of question 4: that one was about *mechanism* (how bias gets in), this one is about *who owns the consequence*. See [using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly).

**A** — shifts all responsibility to the vendor. Vendors share some responsibility for what they ship, but that doesn't erase yours for choosing to point a specific tool at a specific high-stakes decision without checking it first.

**B** — the defeatist, tempting option. "Unavoidable" is doing a lot of work here — the pattern was avoidable through auditing before deployment and monitoring after. Treating it as an inevitable cost is exactly the reasoning that lets biased systems ship unexamined.

**D** — obviously backwards once it's stated plainly, but it's a real pattern of thought worth naming: "the data said so" is a way of laundering a systemic filtering decision your team chose to automate as if it came from the candidates themselves.

</details>

**Related:** [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) · [Where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) · [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) · [Using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly)
