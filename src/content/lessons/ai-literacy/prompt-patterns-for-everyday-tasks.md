---
title: "Ready-made prompt patterns for common tasks"
track: "ai-literacy"
status: live
summary: "A fill-in-the-blank gallery of seven prompt templates for the tasks beginners actually do — summarizing, emailing, explaining, brainstorming, rewriting, comparing, and rehearsing."
duration: "14 min read"
---

You don't need a prompting course for most of what you'll actually ask AI to do — you need seven templates you can fill in without thinking, and enough judgment to know which one to reach for. This page is that toolkit: one pattern per common task, a filled-in example, and the specific way each one goes wrong.

Every template below shares one habit worth naming up front, covered in more depth in [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly): say what you want back (format, length, audience), not just what the topic is. "Summarize this" and "summarize this in 5 bullets for someone who missed the meeting" produce different qualities of output for the same input, and the gap between them is the entire skill.

## 1. Summarize a long document

**Template**
```text
Summarize the [document type] below in [length/format].
Keep: [what must survive — numbers, dates, decisions, names]
Cut: [what to drop — pleasantries, background you already know]
Audience: [who reads this summary and what they'll do with it]

[paste the text]
```

**Filled example**
```text
Summarize the meeting transcript below in 5 bullet points.
Keep: dollar amounts, deadlines, who owns each action item
Cut: small talk, the tangent about the office move
Audience: my manager, who missed the meeting and needs to know what changed

[transcript pasted here]
```

**How it works:** "summarize" alone lets the model decide what matters, which is exactly the decision you have opinions about. Naming what must survive turns a vague compression task into a specific extraction task.

**When it wins:** you have more text than time — meeting transcripts, long email threads, a contract you need oriented in before a real read, an article you're deciding whether to read in full.

**Failure mode:** the model can compress out a number or a caveat it judged as "detail," and a summary hides the omission by reading fluently either way. Anything with a dollar figure, a date, or a decision in it needs a spot-check against the source — see [the verification checklist](/learn/ai-literacy/the-verification-checklist). For documents too long to fit in one go, look at [chain-of-density summarization](/learn/prompt-engineering/chain-of-density-summarization), which asks for progressively denser passes instead of one lossy compression.

**Cost:** low. Output is shorter than input, so it's cheap to generate — the real cost is the verification pass you owe anything with numbers in it.

## 2. Draft and reply to email

**Template**
```text
Draft a [reply/new email] to [who, relationship] about [topic].
Goal: [what you want to happen after they read it]
Must include: [point 1, point 2, ...]
Tone: [e.g. warm but firm, brief, apologetic]
Length: [e.g. under 150 words]

[if replying, paste the email you're responding to]
```

**Filled example**
```text
Draft a reply to a client asking for a one-week deadline extension.
Goal: agree to it, but make clear it's the last one
Must include: new date (June 12), one line saying this is the final extension
Tone: friendly but firm
Length: under 80 words

Original email: "Hi, could we push the delivery date back? We're still
waiting on sign-off from legal..."
```

**How it works:** email is often as much about calibration as content — will this land as curt, will it sound needy, does it commit you to something. Giving the goal and tone up front lets the model do the calibration work while you supply the facts.

**Failure mode:** the model will invent specifics to fill gaps you didn't cover — a prior commitment, a reason, a date — because a fluent draft needs *something* in every slot. You are the one whose name goes on the send button, so read every factual claim in the draft before it goes out, and never paste a client's confidential details into a tool you haven't checked — see [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai).

**Cost:** low to generate, but it carries the highest personal cost of any pattern here if you skip the read-through, because it goes out under your name, not the AI's.

## 3. Explain something at a chosen reading level

**Template**
```text
Explain [concept] to [audience/level].
Assume they know: [existing background, or "nothing"]
Don't use: [jargon to avoid]
Length: [e.g. 3 sentences, one paragraph]
```

**Filled example**
```text
Explain how compound interest works to a 12-year-old.
Assume they know: basic percentages, saving money in a piggy bank
Don't use: terms like "principal" or "APR" without defining them
Length: 4 sentences, with one concrete example using real numbers
```

**How it works:** "explain X" without an audience gets you the model's default register, which tends toward textbook-neutral — useful to no one in particular. Naming the audience's existing knowledge is what actually calibrates the vocabulary and the analogies, more than "grade level" alone does.

**When it wins:** onboarding a new hire, explaining your job to a relative, simplifying a technical doc for a stakeholder who doesn't need the internals, teaching a kid something you understand but have never had to un-jargon.

**Failure mode:** reading level is a target the model aims for, not a measurement it checks — it can still drop in one term it forgot to define, and analogies simplified far enough to be memorable are sometimes simplified past being true. Read the explanation as if you were the stated audience before you hand it off; [turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) has more on tightening this kind of ask.

**Cost:** low. Short output, and the only real risk is an analogy that oversimplifies — worth one read, not a fact-check.

## 4. Brainstorm options

**Template**
```text
Give me [N] different [options/names/approaches] for [goal].
Constraint: [budget, rule, or limit that can't be broken]
Make them meaningfully different from each other — vary [dimension: cost, tone, risk, effort]
For each: one line on the tradeoff
```

**Filled example**
```text
Give me 6 different taglines for a dog-walking app.
Constraint: under 6 words, no puns about "paws"
Make them meaningfully different — vary tone from playful to professional
For each: one line on who it would appeal to
```

**How it works:** the value of a brainstorm is coverage of the option space, not any single option's quality. The "make them meaningfully different" line is doing the actual work here — without it, models default to giving you six rephrasings of their single favorite idea.

**When it wins:** early-stage thinking where you don't yet know what you want — names, gift ideas, outline structures, approaches to a problem you haven't scoped yet.

**Failure mode:** a clean numbered list of six options reads as though all six were evaluated equally, but nothing here was checked against reality — feasibility, cost, whether the name is already taken. Brainstorm output is raw material, not a shortlist; treat the "best" option as a hypothesis, not a conclusion.

**Cost:** low to generate. The real cost is skipping the variety instruction, which quietly turns a brainstorm into an illusion of six options that are really one.

## 5. Rewrite for tone

**Template**
```text
Rewrite the text below to sound [target tone].
Keep unchanged: [facts, numbers, structure, length]
Don't: [overcorrect direction — e.g. don't sound robotic or arrogant]

[paste the original text]
```

**Filled example**
```text
Rewrite the text below to sound more confident and less apologetic.
Keep unchanged: all dates and numbers, the three bullet points
Don't: make it sound arrogant, or drop the "thank you" at the end

"I just wanted to check if maybe you had a chance to look at the proposal?
No worries if not, just let me know whenever works..."
```

**How it works:** this is a targeted edit, not a rewrite from scratch — naming what must stay fixed keeps the model from "improving" things you didn't ask it to touch.

**When it wins:** the content is right but the delivery is wrong — too apologetic, too stiff, too casual for the reader. Also useful for matching your draft to a house style without losing your own points.

**Failure mode:** tone and meaning aren't as separable as they feel. "More concise" can quietly cut a caveat that was doing real work; "more confident" can turn "I think this is ready" into "this is ready," which is a different claim. Diff the rewrite against the original line by line before you use it — don't just skim for vibe.

**Cost:** low to generate, medium to verify, because meaning-drift here is invisible unless you're actively comparing both versions.

## 6. Compare choices in a table

**Template**
```text
Compare [option A, B, C] as a table.
Columns: [criteria that actually matter to your decision]
Flag with a note anywhere you're not certain — don't guess silently.
```

**Filled example**
```text
Compare Notion, Obsidian, and Google Docs as a table for a small team's
internal wiki.
Columns: cost for 5 users, offline access, learning curve, best for
Flag with a note anywhere you're not certain — don't guess silently.
```

**How it works:** naming your criteria as columns forces both you and the model to be explicit about what the decision actually hinges on, instead of a paragraph that hedges toward "it depends."

**When it wins:** any choice with three or more options and multiple criteria — tools, vendors, plans, apartments, job offers.

**Failure mode:** a table's formatting projects more confidence than a paragraph would for the exact same guess — every cell looks equally certain even when the model is unsure of current pricing or a spec it hasn't verified. The "flag if uncertain" line helps but doesn't fully fix this; treat every factual cell (price, specs, dates) as a claim to check, not a fact already checked. See [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) and, for a full worked comparison, [compare AI tools for one real task](/learn/ai-literacy/compare-ai-tools-for-one-real-task).

**Cost:** medium. This pattern most reliably needs a follow-up verification pass, because a clean grid of cells is the format most likely to be trusted at face value.

## 7. Role-play a practice conversation

**Template**
```text
Role-play as [persona] who [goal/attitude/constraint].
I am practicing [what: a negotiation, a hard conversation, a pitch].
Stay in character through the conversation. After, break character and
give me 2 things I did well and 1 to improve.
```

**Filled example**
```text
Role-play as a skeptical landlord who doesn't want to lower the rent and
raises 3 objections.
I am practicing asking for a $150/month reduction, citing a leak that
took 2 weeks to fix.
Stay in character through the conversation. After, break character and
give me 2 things I did well and 1 to improve.
```

**How it works:** naming a goal and a constraint for the persona (not just "pretend to be a landlord") gives the role-play actual friction — a persona with nothing to defend just agrees with you, which defeats the point of practicing.

**When it wins:** rehearsing a conversation you're anxious about — a negotiation, a difficult family conversation, interview practice — where the value is getting words into your mouth and hearing pushback before the real thing.

**Failure mode:** the persona is built from patterns of what skeptical landlords tend to say, not the specific person you'll actually face — it can be easier or harder to "beat" than reality, which can miscalibrate your confidence rather than build it. It's rehearsal for the shape of the conversation, not a prediction of how yours will go. The break-character feedback is also generic unless you push it to reference specific lines you actually said.

**Cost:** medium — multiple back-and-forth turns take longer to generate than a single-shot draft, though there's little to fact-check since the output is practice, not a claim.

## Decision table

| Approach | Best when | Avoid when | Cost |
|---|---|---|---|
| Summarize a document | Text is longer than your time; you need the substance | Every number/decision genuinely needs a full read anyway | Low (verify numbers) |
| Draft/reply to email | Routine correspondence, or tone matters more than content | You're too angry or too unsure of facts to review the draft honestly | Low (verify before sending) |
| Explain at a reading level | Teaching, onboarding, simplifying for a specific audience | The audience's background varies wildly and one level won't fit anyone | Low |
| Brainstorm options | You don't yet know what you want; value is in coverage | You need one correct answer, not many candidate ones | Low (add variety instruction) |
| Rewrite for tone | Content is right, delivery is wrong | The rewrite might need to change facts, not just voice | Low (diff meaning) |
| Compare in a table | 3+ options, multiple criteria, a real decision to make | Criteria involve current prices/specs you can't independently check | Medium (verify cells) |
| Role-play practice | Rehearsing an anxiety-inducing conversation before it happens | You'd mistake "won" the role-play for "will win" the real one | Medium (time, not accuracy) |

## How to choose

1. **Name the deliverable, not the task.** "Help me with this email" is a task; "draft a reply, under 80 words, agreeing to one more week" is a deliverable. Every template above is really just deliverable-naming with the blanks pre-arranged for you.
2. **Ask where the value sits: generation or precision.** Brainstorming and role-play are valuable *because* they're generative — variety and repetition are the point, and being slightly wrong costs little. Summarizing and comparing are valuable because they're supposed to be precise — that's where verification effort belongs.
3. **When two patterns could both apply, let the input decide.** A long document you need to act on: summarize. A long document you need someone else to understand from scratch: explain. The same content, two different jobs.
4. **Match your worry to the failure mode, not the topic.** If you're worried about a fact, that's a summarize/compare problem. If you're worried about how it lands, that's an email/tone problem. If you're worried about your own performance, that's a role-play problem. The worry tells you the template.
5. **Chain them.** Real tasks rarely use one pattern in isolation — summarize a long thread, then compare the two options it surfaced in a table, then draft the email that acts on the decision. Each output becomes the next prompt's pasted input.

The templates are starting points, not scripts — once you've filled one in a few times, you'll start writing the shape from memory and only reaching for this page when a new task doesn't fit any of the seven. For a condensed version of all of this on one page, see the [everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet); for what "good enough" specificity looks like before you even get to a template, see [give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples).

**Related:** [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) · [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet) · [Prompting quiz](/learn/ai-literacy/prompting-quiz)
