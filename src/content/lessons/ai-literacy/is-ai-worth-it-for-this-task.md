---
title: "Is AI worth it here? A cost-benefit walkthrough"
track: "ai-literacy"
status: live
summary: "A worked cost-benefit walkthrough across three real tasks — thank-you notes, a legal clause, and vacation brainstorming — that turns 'should I use AI for this?' into a concrete cal."
duration: "14 min read"
---

Saturday morning, three things on your list: twenty thank-you notes, one contract clause that reads oddly, and a long weekend you haven't planned yet. All three feel like "just ask AI" moments — but the right call is different for each one, and you can actually calculate why.

## The setup (specific)

Here's the whole afternoon:

- **20 thank-you notes.** You just got married. Each one needs to mention the actual gift and sound like you, not like a form letter. Priya gave you a stand mixer, your uncle Ray gave cash with a card, Dana and Miko gave hiking poles because they know you just got into it. Seventeen more like that.
- **One contract clause.** A client sent a 3-month freelance agreement. Buried in it is an indemnification clause you don't fully understand, and you're supposed to sign by Monday.
- **Vacation ideas.** You have 4 days off in November and roughly $800 to spend. You want somewhere warm-ish and you haven't picked a destination yet.

Before touching a model, it helps to have one small piece of math in your pocket. Think of AI here the way you'd think of [delegating to a very fast, very confident intern](/learn/ai-literacy/prompting-is-delegating-to-an-eager-intern): the intern will hand something back almost instantly, but *your* job doesn't end until you've decided how much to trust it. That decision has a shape:

```
Net value = Time saved − Time spent verifying − Risk cost

Time saved     = time to do it yourself − time to prompt + get an AI answer
Verifying      = time to actually check the answer is good enough to use
Risk cost      ≈ (chance a bad answer slips through anyway) × (cost if it does)
```

Three numbers, one subtraction. The rest of this walkthrough is just running that arithmetic honestly on all three tasks — which, done honestly, is [rarely as free as it feels](/learn/ai-literacy/what-using-ai-actually-costs) in the moment you're staring at a fast, fluent answer.

## Step by step

### Step 1 — Write down the manual baseline first

Before generating anything, estimate how long each task takes you *without* AI:

| Task | Manual time (M) |
|---|---|
| 20 thank-you notes, ~4 min each | 80 min |
| Reading the clause yourself, unsure, maybe googling terms | 45 min |
| Browsing a couple of travel sites, texting a friend for ideas | 25 min |

> **Why this step?** If you estimate "time saved" *after* looking at a slick AI answer, you'll round the baseline up to make the comparison flattering. Anchoring it first keeps the rest of the math honest.

### Step 2 — Run the thank-you notes

One prompt, reused for all 20:

```text
Write a warm, specific 3-sentence thank-you note for each person below.
Mention their actual gift. Sound like me: casual, a little funny, not stiff.

- Priya — stand mixer
- Uncle Ray — cash + card
- Dana & Miko — hiking poles (we just got into hiking)
```

A few of the 20 that come back:

```text
Priya — The stand mixer has already ruined three of my measuring cups and
I regret nothing. Thank you for knowing I needed this before I did.

Uncle Ray — Thank you for the card and the very generous cash — it's
already earmarked for the "we own zero furniture" fund. Means a lot you
made the trip.

Dana & Miko — The hiking poles could not have been better timed, we used
them the first weekend and immediately understood why hikers won't shut
up about them. Thanks for gearing us up.
```

Now the numbers:

- **A (AI time):** 8 min to write the prompt, seconds to generate all 20.
- **Time saved = M − A = 80 − 8 = 72 min.**
- **V (verify):** 8 min to read all 20 — you already know every gift and every person, so this is proofreading, not research.
- **R (risk):** near zero. Worst case is a clunky sentence, caught in the same read-through, fixed in seconds. Nothing here is irreversible.
- **Net = 72 − 8 − 0 ≈ 64 min saved.** This is the clear win: high volume, low stakes, and verification is cheap because *you already know the right answer* for every item — you're just checking the AI matched it.

### Step 3 — Run the legal clause

The clause, more or less as written:

```text
Contractor shall indemnify, defend, and hold harmless Client from and
against any and all claims, damages, liabilities, costs, and expenses
(including reasonable attorneys' fees) arising out of or related to
Contractor's performance of the Services, regardless of whether such
claims arise from the negligence of Client.
```

Before pasting anything from a real contract into a public AI tool, worth a beat on [what not to paste](/learn/ai-literacy/what-not-to-paste-into-ai) — a client's contract language is exactly the kind of thing to run through a private or enterprise tool, not a random free chatbot, if the agreement has any confidentiality terms at all.

Prompt:

```text
Is this indemnification clause standard for a freelance contract?
What should I watch out for before signing?
```

- **A:** 3 min.
- **Time saved = 45 − 3 = 42 min** — looks great so far.
- **V:** 15–20 min if you carefully cross-check the AI's claims against the literal text, sentence by sentence (shown in the next section).
- **R:** this is the term that matters here, and it's not small. You're not a lawyer, so even a careful re-read from you can't fully catch a legal red flag you don't know exists. There's a real, non-trivial chance a subtle misreading gets past both the AI *and* your own check — and the cost if it does isn't measured in minutes, it's measured in whatever this clause exposes you to in a signed, binding agreement.

Even rough numbers make the point: a "small" chance of missing something times a "not small" dollar exposure produces an expected cost that swallows 42 minutes whole. **Net turns negative once R is counted honestly** — not because verifying took long, but because [being wrong here is expensive and hard to catch](/learn/ai-literacy/uncertainty-and-verification), and it doesn't un-happen once you've signed.

### Step 4 — Run the vacation brainstorm

Prompt:

```text
Give me 12 warm-weather, 4-day vacation ideas for around $800 total,
leaving from the US. One sentence each on why it fits.
```

A few of the 12:

```text
1. Puerto Vallarta, Mexico — short flights from most US hubs, mild and
   sunny in November, budget hotels line the malecón.
2. Algarve, Portugal — off-season rates in November, mild weather, no
   visa needed for US travelers for stays under 90 days.
3. San Juan, Puerto Rico — no passport required, direct flights are
   common, and it's warm through the fall.
```

- **A:** 2 min.
- **Naive time saved = 25 − 2 = 23 min.** Looks like an easy win, same shape as the thank-you notes.
- **The trap:** items 1–3 aren't just ideas, they're wrapped in specific claims — flight prices, visa rules, weather. Those are exactly the kind of confident, plausible-sounding specifics a model can [get wrong without any sign it's guessing](/learn/ai-literacy/catch-a-hallucination-worked-example). If you shortlist your top 4 and verify each fact properly — actual flight prices, actual current entry rules, actual November weather — that's roughly 10 minutes a destination, **40 minutes of verification**, more than doing the whole brainstorm yourself.
- **Net, done honestly = 23 − 40 = −17 min.** The idea-generation step won; the fact-checking it invited lost more than that back.

## Where it breaks

The vacation case is a silent leak. The legal clause is a loud failure worth seeing in full.

Ask the model to summarize the clause, and a plausible answer comes back:

```text
This looks like a fairly standard mutual indemnification clause used in
service agreements. It requires you to cover costs if your work causes
a claim against the client — common and generally reasonable for
freelance contracts.
```

Read that against the actual text and two things are wrong:

1. **It isn't mutual.** The clause as written only has Contractor indemnifying Client — nothing runs the other way. "Mutual" is a factual misread of the plain text sitting right there.
2. **"Generally reasonable" buries the actual risk.** The clause says you're on the hook *"regardless of whether such claims arise from the negligence of Client."* That's not standard boilerplate — it means you could be liable even for the client's own screwups, with no cap mentioned. A confident, calm summary made an unusually aggressive term sound routine.

If you stopped there and signed, you'd have accepted uncapped liability for someone else's negligence on the strength of a summary that got the clause's basic shape wrong.

**The fix — force it to show its work against the text you already have:**

```text
Quote the exact phrase from the clause that supports each claim you make.
Then tell me: (1) is this one-sided or mutual, based only on the words
above, and (2) what should I specifically ask a lawyer before signing?
This is not a substitute for legal advice.
```

Forced to cite the literal text, a re-run correctly flags that only one party indemnifies, and that the negligence carve-out is unusual — because now checking its claim is just matching a quote to the paragraph in front of you, not trusting a paraphrase. That's the general move for anything where you can't independently judge correctness: make [verification a matching exercise](/learn/ai-literacy/the-verification-checklist), not a trust exercise.

**The vacation fix is a different shape — split the job in two.** Ask for ideas *without* embedded facts:

```text
Give me 12 warm-weather 4-day vacation destination names for ~$800,
leaving from the US. Names only, no supporting details.
```

Now there's nothing to verify at the ideas stage — a destination name isn't a factual claim, it's a preference, and picking one costs you nothing to get "wrong." You still research flights, visas, and weather for your actual top choice before booking — but you'd have done that research regardless of who suggested the destination. The AI never needed to do the fact-lookup part; asking it to was what created 40 minutes of cleanup.

## Takeaways

| Task | Time saved | Verifying | Risk | Net |
|---|---|---|---|---|
| Thank-you notes | 72 min | 8 min (cheap — you know the facts) | ~0 (reversible, low stakes) | **+64 min — clear win** |
| Legal clause | 42 min | 15–20 min | large (binding, hard to self-check) | **negative — not worth the risk** |
| Vacation ideas | 23 min | 40 min if AI supplies "facts" | low, but verification cost dominates | **negative until you split ideas from facts** |

The heuristic in one line: **Net = time saved − time verifying − risk cost**, and the third term isn't optional just because it's the hardest to number. Two questions do most of the work in practice:

- **Do you already know the right answer, and are you just checking the AI matched it?** That's cheap verification (the thank-you notes). If you'd have to *research* whether it's right, that's expensive verification, and it scales with however many claims you asked for (the vacation facts).
- **If a wrong answer slips through, is it cheap and reversible, or expensive and final?** A clunky sentence is the former. A signed contract is the latter — and no amount of time saved upfront buys back a bad signature.

For anything in that second bucket — legal, financial, medical, anything you can't take back — AI's job is to get you oriented and hand you better questions, not to be the last check. Use it to translate, summarize, and prep; keep the actual call with whoever's judgment you'd trust if there were real money on the line.

**Related:** [Should I use AI for this? Worked decisions](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions) · [Matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) · [The real limits of AI today](/learn/ai-literacy/the-real-limits-of-ai-today) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type)
