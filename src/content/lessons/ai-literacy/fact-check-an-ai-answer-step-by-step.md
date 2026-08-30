---
title: "Fact-checking an AI answer, step by step"
track: "ai-literacy"
status: live
summary: "A worked example that takes a realistic AI answer to 'what documents do I need to renew my passport, and how long does it take,' verifies it claim by claim against the live travel."
duration: "12 min read"
---

Ask an AI what documents you need to renew a passport and you'll get a clean, confident, well-formatted answer in about two seconds. The government's own answer takes longer to find and reads worse — bureaucratic, buried in accordions, split across six different pages. But it's the one that's actually true today, and "today" matters more than you'd think for an answer like this.

Below is a realistic AI answer to that exact question, checked line by line against the live U.S. State Department site. Some of it is correct. Some of it was correct — a year or two ago. And a couple of lines are the kind of wrong that sounds more authoritative than the truth.

## The setup

Here's the scenario: you're a U.S. citizen, an adult, holding a valid ten-year passport that was issued six years ago, undamaged, in your current legal name. You've got a trip coming up and you ask an AI assistant a plain, practical question.

**Prompt:** "What documents do I need to renew my passport, and how long does it take?"

**AI answer:**

To renew a U.S. passport, you'll need:

- A completed Form DS-82 (the passport renewal application)
- Your most recent U.S. passport, undamaged, which serves as your proof of citizenship
- A certified copy of your birth certificate as backup proof of citizenship
- One 2x2 inch passport photo taken within the last 6 months
- A check or money order for the $130 renewal fee, payable to the U.S. Department of State
- If you've legally changed your name, a certified copy of the marriage certificate, divorce decree, or court order showing the change

You're eligible to renew by mail as long as your current passport was issued within the last 10 years and you were at least 18 when it was issued.

As for timing: standard processing currently takes about 6-8 weeks, and expedited service costs extra but takes 2-3 weeks. Online renewal exists but is still a limited pilot program, so most people will need to print the DS-82 form and mail it in with the documents above.

That's ten distinct, checkable factual claims wearing the costume of one tidy paragraph. That costume is the whole problem — it reads as a single confident unit, so it's tempting to accept or reject it as one. Don't. Below is the actual verification pass, done against travel.state.gov, checked today.

## Step by step

### Step 1: Cut the answer into individual claims

Before opening a browser, list every discrete factual assertion separately. Not "the document section" — each bullet, and each clause inside a sentence that has more than one fact in it.

1. Form DS-82 is the renewal application
2. Submit your most recent, undamaged passport as proof of citizenship
3. Also submit a certified birth certificate as backup proof of citizenship
4. One 2x2 inch photo, taken within the last 6 months
5. $130 renewal fee for the passport book
6. Include legal name-change documents if applicable
7. Eligible to renew by mail if issued within the last 10 years and you were 18+
8. Standard processing takes 6-8 weeks
9. Expedited service takes 2-3 weeks, for an extra fee
10. Online renewal is still a limited pilot

> **Why this step?** Bundle the claims together and you'll grade "the passport section" as a whole — see five things check out, decide it's basically solid, and act on the two that don't. Verification happens at the level of a single fact or it doesn't really happen. This is the same discipline covered in [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources): one claim, one check.

### Step 2: Sort each claim by how likely it is to have changed

Before you check anything, guess which claims are stable and which are volatile. It changes how suspicious you should be of each one.

- **Stable facts** — form names, photo dimensions, document formats. These don't move year to year.
- **Policy numbers** — fees, eligibility windows, age cutoffs. These change, but on a slow, deliberate government schedule.
- **Operational numbers** — processing times, which programs are live vs. piloted. These shift with staffing, demand, and season, sometimes within months.

> **Why this step?** An AI's knowledge has a cutoff, but that cutoff doesn't hit every fact equally. A form name from 2019 is still a form name today. A processing-time figure from 2019 is almost certainly wrong today. Sorting first tells you where to spend your skepticism — this is the mechanism behind [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops).

### Step 3: Find the primary source, not a summary of it

For this question, that's travel.state.gov — specifically the pages that answer each claim directly: "Renew Your Passport by Mail," "Passport Fees," "Get Your Processing Time," and "Renew Your Passport Online." Not a travel blog, not a forum thread, not the AI re-explaining itself when asked "are you sure." An answer restating its own claim isn't a second source.

### Step 4: Check every claim, one at a time

Here's what each claim above actually resolves to, checked against the live site today:

| # | Claim | Verdict | What travel.state.gov actually says |
|---|---|---|---|
| 1 | Form DS-82 is the renewal application | **Right** | Confirmed — DS-82 is the standard form for renewal by mail or online. |
| 2 | Submit your most recent, undamaged passport as proof of citizenship | **Right** | "Renew by Mail" lists this as a required step; the old passport itself is the citizenship evidence. |
| 3 | Also submit a certified birth certificate as backup | **Plausible but wrong** | The renewal-by-mail steps have no citizenship-evidence requirement at all. A birth certificate is only required for first-time applicants filing Form DS-11, who don't have a prior passport to submit. This is a real-document requirement, borrowed from the wrong scenario. |
| 4 | 2x2 inch photo, taken within the last 6 months | **Right** | Standard, longstanding passport photo requirement, unchanged. |
| 5 | $130 renewal fee for the passport book | **Right** | Matches the official State Department passport-fee page — but verify the current amount yourself, since published fees change over time. |
| 6 | Include name-change documents if applicable | **Right** | Listed as an explicit step: "Provide other documents if you are changing your name." |
| 7 | Eligible if issued within last 10 years and you were 18+ | **Plausible but wrong** | Actual rule: issued within the **last 15 years**, and issued when you were **16 or older** (plus undamaged and matching name). The AI seems to have welded "passports are valid for 10 years" onto the renewal-eligibility window, and rounded 16 up to a more "adult-sounding" 18. Neither number is the real cutoff. |
| 8 | Standard processing takes 6-8 weeks | **Outdated** | Live "Get Your Processing Time" page (updated April 16, 2026): current routine processing is **4-6 weeks**. 6-8 weeks was a real, publicly stated figure for a while as pandemic-era backlogs eased — just not this year's number. |
| 9 | Expedited service takes 2-3 weeks, for an extra fee | **Right** | Confirmed: 2-3 weeks, and the fee is specifically $60. |
| 10 | Online renewal is still a limited pilot | **Outdated** | The live "Renew Your Passport Online" page describes a full public program at opr.travel.state.gov, open to any eligible citizen for routine service. That was true of the 2022 pilot. It isn't the current state of the program. |

Notice claims 8 and 9 sit in the *same sentence* of the original answer, and one is stale while the other still holds. That's the point of checking clause by clause instead of sentence by sentence — an AI answer doesn't go wrong or right as a unit.

> **Why this step?** This is where [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) becomes concrete. Claims 3 and 7 aren't nonsense — they're real requirements from a real, adjacent process (first-time applications), stated with total confidence in the wrong context. That's a more dangerous failure than an obviously made-up fact, because it survives a skim. See [catch a hallucination, worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) for the same pattern in a different domain.

### Step 5: Ask whether the verified number even answers your question

Claim 8's corrected version — "4-6 weeks routine processing" — is itself true but incomplete for someone booking travel. The processing-time page also states mailing your application in takes up to 2 weeks, and mailing the finished passport back takes up to 2 more. Add it up:

```
2 weeks   (mail to the agency)
+ 4-6 weeks (routine processing)
+ 2 weeks   (mail back to you)
= 8-10 weeks, door to door
```

The AI's number wasn't fabricated and, once corrected, isn't even wrong — it's just answering "how long does processing take," not "how long until I have a passport in hand," which is the question a traveler is actually asking.

> **Why this step?** A verified fact can still be the wrong fact for your decision. Checking accuracy and checking relevance are two different passes — this is the gap [the verification checklist](/learn/ai-literacy/the-verification-checklist) calls out separately for exactly this reason.

## Where it breaks

Suppose the reader in this scenario didn't have a passport issued six years ago — theirs was issued **17 years ago**. Every single "Right" verdict above is still, in isolation, a true statement about how passport renewal works. And none of it applies to this person.

Because their passport is older than the 15-year cutoff, they don't file DS-82 by mail at all. They apply in person with Form DS-11, they genuinely do need a birth certificate (the exact document the AI wrongly told the *renewal-eligible* reader to send), they pay a separate $35 execution fee, and the total cost is $165, not $130.

You can verify every clause in an answer perfectly and still walk away wrong, if the answer was quietly written for a branch of the process you're not actually in. The AI's paragraph reads as universal — "here's how passport renewal works" — when it's really conditional: "here's how renewal works *if you qualify for it*," with the condition sitting in one sentence easy to skim past. Multi-path government and legal processes are exactly where this bites: renewal vs. first-time vs. lost-or-stolen vs. minor vs. name-change-only each have their own document list, and a general-sounding question gets a general-sounding — and silently scoped — answer.

**The fix:** verify the branch before you verify the list. Before checking a single document, isolate and confirm the eligibility condition against the source, in its own pass, and only then trust anything hanging under it.

There's a second, quieter way this breaks: the numbers you just checked correctly, right now, will drift. "4-6 weeks, per the page updated April 16, 2026" is not a fixed constant — it's a live number the State Department updates as travel season and staffing change. Six months from now that page could say 5-7 weeks and be perfectly current, while your notes from today say 4-6 and are perfectly stale. Verifying isn't an inoculation you get once. A fact you confirmed correctly in March isn't a fact you've confirmed today — check [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) for why this applies to your own notes and screenshots just as much as it applies to the AI's training data.

## Takeaways

Copy this for any consequential AI answer, not just passports:

1. **Split the answer into individual claims.** Verify facts one at a time, never "the gist" of a paragraph.
2. **Find and check the eligibility or branch condition first**, before trusting anything listed under it. A perfectly verified answer to the wrong branch is still wrong.
3. **Classify each claim** — stable fact, policy number, or operational number — before you check it. Expect AI to be shakiest on the operational ones, since those are what shift fastest between its training cutoff and today.
4. **Check the primary source directly**, not a summary, a forum post, or the AI restating its own claim back to you.
5. **Note the source page's own "last updated" date.** It tells you how fresh the ground truth itself is — a site's fee page, eligibility page, and processing-time page can each carry different update dates, so check the freshness of the exact page you're relying on.
6. **Distinguish "wrong" from "outdated" from "true but answering a different question."** They call for different responses: correct the fact, refresh the fact, or reframe the question.
7. **Re-check anything time-sensitive right before you act on it.** A verification you ran once doesn't stay valid — this is the whole idea behind [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type).

None of this makes the AI answer useless — it got the form name, the photo spec, the fee, and half the timing right, for free, in two seconds. It just isn't done being useful until you've done steps 1 through 7 on the parts that matter.

**Related:** [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) · [Where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) · [Run a real task end to end with verification](/learn/ai-literacy/run-a-real-task-end-to-end-with-verification)
