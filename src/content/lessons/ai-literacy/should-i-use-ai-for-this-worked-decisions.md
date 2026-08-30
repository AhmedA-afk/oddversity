---
title: "'Should I use AI for this?' — five real decisions"
track: "ai-literacy"
status: live
summary: "A worked-example lesson that walks through five real decisions — a tricky email, a kid's medication dose, a wedding toast, freelance taxes, and a 40-page report — reasoning out lou."
duration: "12 min read"
---

Same five minutes, same laptop, same AI tool open in a tab — and the right call is different every single time. The skill isn't "should I use AI," it's noticing which of four things is actually at stake before you type anything.

## The setup (specific)

It's a Tuesday. Five things are sitting in your queue:

1. A client is upset about a missed deadline and you need to reply today.
2. Your kid has a fever, the bottle in the cabinet has a dosing chart on it, and you want a second opinion on the number.
3. You're giving a toast at your sister's wedding in two weeks and you have nothing written.
4. It's tax season, you freelanced on the side this year, and you got a 1099 you don't fully understand.
5. Someone handed you a 40-page vendor security report and wants your take by end of day.

Every one of these is "type a request, get text back." That surface similarity is the trap. What actually differs between them is four things, and naming them out loud is the whole exercise:

- **Stakes** — if the output is wrong and you act on it anyway, what happens? Something you edit twice and send, or something you can't take back?
- **Verifiability** — can you check the answer against a real source, in less time than it'd take to just do the task carefully yourself? If checking costs as much as doing, AI didn't save you anything.
- **Privacy** — does answering this well require handing over something you wouldn't want stored, read, or trained on somewhere else?
- **Judgeable** — do *you* personally know enough to tell a good answer from a bad one, or would a confidently wrong answer look exactly like a right one to you?

[/learn/ai-literacy/task-or-automation](/learn/ai-literacy/task-or-automation) asks a different question — whether a task is worth turning into a repeated, automated workflow at all. This is upstream of that: for this one instance, right now, should AI touch it, and how hard do you have to check its work afterward. Let's run all five through the same four questions.

## Step by step

### 1. The email to the upset client

- **Stakes:** medium — a bad email damages a relationship, but you read it before it sends. Fully reversible up to the click.
- **Verifiability:** not applicable in the usual sense — there's no fact to check, it's tone and framing, and you're the one who knows if it lands.
- **Privacy:** depends what you paste in. Keep contract numbers and specifics out unless you know the tool's data policy — see [/learn/ai-literacy/what-not-to-paste-into-ai](/learn/ai-literacy/what-not-to-paste-into-ai).
- **Judgeable:** yes, completely. You know this client, this history, your own voice. Nobody is better positioned to grade this output than you.

Verdict: **use it**, as a drafting tool, then edit hard.

```text
PROMPT:
Write an email to a client whose delivery is now two weeks late
because a vendor component slipped. Give the new date (Sept 12),
offer a small credit, keep it short, don't over-apologize.

DRAFT (first pass):
Subject: Update on Your Project Timeline

Hi Jordan,

I want to be upfront: our vendor's component is now two weeks
behind schedule, which pushes delivery to September 12th. I know
this isn't the update you were hoping for, and I want to
acknowledge that directly. To help make this right, we're applying
a 10% credit to this phase of the work. Please let me know if you'd
like to discuss further.
```

That draft is fine, not great — and the fix isn't a better prompt, it's you. Cut "I know this isn't the update you were hoping for" (it apologizes for a feeling instead of stating a fact) and add the one sentence only you can write, because you're the one who knows the plan: *"We've already reprioritized the QA pass so the 12th has buffer built in — you won't be waiting on us twice."* The AI can produce structure and tone. It cannot produce information it doesn't have.

> **Why this step?** This is the easy case, and it's worth seeing clearly so the harder cases stand out by contrast: low stakes because it's reversible, and you're a qualified judge because you know the situation better than any tool does. Those two conditions together mean "AI drafts, you edit" is close to strictly better than either extreme.

### 2. The fever and the dosing question

- **Stakes:** high. Dosing errors for a small child are not "reword it and resend."
- **Verifiability:** low, for you, in the moment — the correct number depends on exact weight, exact concentration of what's actually in your bottle, and current guidance, none of which you can independently confirm against the AI's answer without doing the check yourself anyway.
- **Privacy:** not the deciding factor here.
- **Judgeable:** no. A wrong number and a right number are typed in the same confident font. This is the core problem — see [/learn/ai-literacy/the-single-most-important-skill-judging-output](/learn/ai-literacy/the-single-most-important-skill-judging-output).

Verdict: **avoid it for the number itself.** Use AI, if at all, to help you understand a term on the label or to phrase a question for the pharmacist — not to compute the final dose. The full breakdown of exactly how this fails is below, because it's the clearest case in this lesson for *why* "judgeable" matters more than confidence.

### 3. The wedding toast

- **Stakes:** low-to-medium — socially embarrassing if it's bad, but nobody's hurt.
- **Verifiability:** not applicable — it's not a factual claim, it's a piece of writing that either lands or doesn't.
- **Privacy:** mild — you're feeding it real family history. Not confidential in a legal sense, but worth knowing what happens to it afterward; see [/learn/ai-literacy/your-data-can-be-the-price](/learn/ai-literacy/your-data-can-be-the-price).
- **Judgeable:** yes, very — you know your sister, the room, and what tone fits, better than anyone.

Verdict: **use it**, but the failure mode here is different from the email: not wrongness, genericness.

```text
BEFORE (asked to "write a wedding toast for my sister"):
"As I look back on our journey together, I'm reminded that
distance means nothing when the bond runs deep. She has always
been my rock, and I know she'll be an amazing wife..."
```

That could be read at literally anyone's wedding. Now feed it something only you know:

```text
AFTER (given: "she drove six hours through a snowstorm to bring me
soup when I had the flu freshman year, and never let me forget it"):
"Ask anyone in this room what my sister is like under pressure and
they'll say something admirable. I'll tell you what she's actually
like: six hours, through a snowstorm, because I sounded pathetic on
the phone. She still brings it up. I still haven't heard the end of
it. That's the whole marriage advice I've got for you, [partner] —
she will show up, and she will never once let you forget it."
```

> **Why this step?** The lesson isn't "AI writes bad toasts," it's that a request with no specific input produces a specific-shaped output with generic content. You're the source of the one ingredient that makes writing feel true — a real, particular detail — and no amount of re-prompting substitutes for supplying it.

### 4. The freelance taxes

- **Stakes:** real money and, in the worst case, a filing error — but it ranges. "What is a Schedule C" is low-risk. "How much do I owe" is higher-risk.
- **Verifiability:** split. The *structure* of tax law (how self-employment tax is calculated, what a deduction category means) is stable and easy to check against IRS instructions. The *exact current numbers* — brackets, caps, thresholds — change yearly, and a model's training data has a cutoff; see [/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops).
- **Privacy:** high concern — real income figures and client names are exactly what [/learn/ai-literacy/what-not-to-paste-into-ai](/learn/ai-literacy/what-not-to-paste-into-ai) is about. Don't paste your actual 1099 into a general chat tool.
- **Judgeable:** partially — you can tell if an explanation of a *concept* makes sense. You can't tell if a *number* is this year's number without checking a primary source.

Verdict: **use it to learn the concept, verify the specific figure.** Here's the mechanism worth understanding — self-employment tax is a stable, well-documented calculation (net earnings are multiplied by a factor, then by a percentage), so you can sanity-check any tool's arithmetic yourself:

```python
# Illustrative structure only — the underlying percentages are set by
# law and the wage base cap changes yearly. Confirm current figures
# against IRS instructions or software before filing anything.
net_profit = 60_000
net_earnings_factor = 0.9235   # long-standing structural constant
se_tax_rate = 0.153            # combined rate, applies up to a cap that changes yearly

se_tax = net_profit * net_earnings_factor * se_tax_rate
print(round(se_tax, 2))  # 8477.73
```

The two constants in that formula have been stable for a long time — that's the part AI is reliably useful for explaining. The part that drifts is the income cap where one piece of that rate stops applying, and that's exactly the number a model trained months or years ago can get wrong while sounding just as certain about it as it does about the stable part.

> **Why this step?** This is the pattern to carry forward: split the question into "how does this work" (verify once, trust the mechanism) versus "what's the number today" (verify every time, no exceptions). Treating a whole domain as equally risky wastes your verification effort on the parts that didn't need it.

### 5. The 40-page vendor report

- **Stakes:** medium — a bad summary feeds a real decision (do we use this vendor), but it's not itself the final action.
- **Verifiability:** high — the source document exists, is fixed, and every claim in a good summary should trace back to a page.
- **Privacy:** depends on the report's confidentiality — check before pasting a vendor's security disclosures into a public tool.
- **Judgeable:** partially — you can judge whether the summary's structure covers what matters. You can't tell, by reading the summary alone, whether a specific claim inside it is accurate.

Verdict: **use it, with verification built into the request.**

```text
PROMPT:
Summarize this report in 6 bullets. For each bullet, cite the page
number the claim came from.

SUMMARY (excerpt):
- Vendor completed SOC 2 Type II certification in March (p. 14)
- Data is encrypted at rest and in transit (p. 22)
- No critical findings in the most recent penetration test (p. 31)
```

Don't forward that yet. Pick the one or two claims your decision actually rests on — here, the SOC 2 line is doing the real work — and open the PDF to page 14. Search for "SOC 2" with find-in-document. Does the sentence actually say what the bullet says, or did the summary round "in progress" up to "completed," or move a date? That's a two-minute check against a specific, findable source — see [/learn/ai-literacy/verification-tactics-by-task-type](/learn/ai-literacy/verification-tactics-by-task-type) — not a re-read of all 40 pages.

## Where it breaks

Back to the medication question, because it's the case where "sounds right" and "is right" separate the furthest.

Say two bottles of the same liquid medicine sit in your cabinet, both real products, formulated at different strengths per milliliter — call them Formula A at 160 mg per 5 mL and Formula B at 80 mg per 5 mL. That's not a made-up hazard: mismatched concentrations between similarly-labeled children's and infant formulations of common medicines is a well-known real-world source of dosing errors, which is exactly why pharmacists double-check concentration, not just the weight-based target dose.

Now you ask: *"My kid weighs 30 lbs, how many mL should I give?"*

A model has to do several silent steps to answer: convert 30 lbs to about 13.6 kg, apply a per-kg target dose, then convert that milligram target into milliliters — which requires knowing *which bottle you have*. If it assumes Formula A's concentration and your bottle is actually Formula B, the output is off by exactly 2x. And the answer it gives you —

```text
Based on your child's weight, give 6.8 mL.
```

— looks identical whether that assumption was right or wrong. There's no visual tell. No hedge in the tone. A number that's double what it should be reads exactly as confident as the correct one, because confidence in language model output tracks how plausible the *sentence* sounds, not how correct the *number* underneath it is — see [/learn/ai-literacy/why-ai-sounds-so-confident](/learn/ai-literacy/why-ai-sounds-so-confident).

**The fix isn't a better prompt.** It's recognizing that this task fails the judgeable test — you cannot independently score this answer — which means the fix has to happen outside the conversation: read the concentration off your actual bottle, use the dosing chart printed on that specific box (that's the manufacturer's ground truth, matched to the exact formulation you own), or call your pharmacist or a nurse line and give them the weight and the bottle in front of you. Once you've done that, asking the AI added no verified value — you did the verification by doing the task directly. That's the tell for an "avoid" case in general: if checking the answer costs the same effort as just doing it right the first time, skip the middle step.

## Takeaways

Here's the same five decisions, side by side:

| Decision | Stakes | Verifiable? | Privacy risk | Can you judge it? | Verdict |
|---|---|---|---|---|---|
| Client email | Medium, reversible | N/A (tone, not fact) | Low-medium | Yes | Use it, then edit in what only you know |
| Medication dose | High, hard to reverse | No, not by you, not quickly | Low | No | Avoid — verify against the physical bottle or a pharmacist |
| Wedding toast | Low-medium | N/A (creative) | Low-medium | Yes | Use it — supply the specific detail yourself |
| Freelance taxes | High for exact figures | Split: mechanism yes, current numbers no | High | Partial | Use for concepts, verify every specific number |
| 40-page report | Medium | Yes, against the source | Depends on confidentiality | Partial | Use it, verify the load-bearing claims |

The checklist that generalizes past all five:

1. **Name the stakes before you type the prompt.** Reversible-and-minor and irreversible-and-costly need completely different amounts of scrutiny on the exact same kind of question.
2. **Ask what "checking" would even look like.** If there's no ground truth you can point to, you're the ground truth — lean on your own judgment. If there is one, plan to check it, and check the specific thing your decision hinges on, not everything.
3. **Never trade privacy for convenience without noticing you did it.** Real names, real numbers, real medical or financial specifics deserve a second thought about where they're going.
4. **Be honest about whether you can grade the output.** Fluent and correct look exactly the same from the outside. If you can't independently tell them apart on this topic, the confidence in the answer tells you nothing.
5. **If verifying costs as much as doing it yourself, that's your answer** — skip straight to doing it yourself.

None of these five decisions needed a different tool. They needed four questions asked out loud before the first prompt, and the honesty to notice when the answer to "can I tell if this is right" was no.

**Related:** [/learn/ai-literacy/task-or-automation](/learn/ai-literacy/task-or-automation) · [/learn/ai-literacy/uncertainty-and-verification](/learn/ai-literacy/uncertainty-and-verification) · [/learn/ai-literacy/the-verification-checklist](/learn/ai-literacy/the-verification-checklist) · [/learn/ai-literacy/is-ai-worth-it-for-this-task](/learn/ai-literacy/is-ai-worth-it-for-this-task) · [/learn/ai-literacy/matching-the-ai-tool-to-the-job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) · [/learn/ai-literacy/catch-a-hallucination-worked-example](/learn/ai-literacy/catch-a-hallucination-worked-example)
