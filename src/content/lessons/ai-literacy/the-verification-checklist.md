---
title: "Cheatsheet: the verification checklist"
track: "ai-literacy"
status: live
summary: "A printable six-question checklist plus red-flag list for verifying any AI answer before you act on it or pass it along."
duration: "7 min read"
---

Run this before you hit send, publish, or act on anything an AI wrote. Six questions, one red-flag list, thirty seconds if the stakes are low and twenty minutes if they aren't.

## The six questions

Ask these in order. Each one can end the check early — a "low stake, no checkable claims" answer needs nothing further.

| # | Question | If yes | If no |
|---|---|---|---|
| 1 | What's the stake if this is wrong? | Match effort to stake (table below) | Skim and move on |
| 2 | Are there checkable claims in here, or just judgment calls? | Go to Q3 for the checkable ones | Check the reasoning, not a source — see [judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) |
| 3 | Are there specifics — names, dates, numbers, quotes, citations? | List them, verify each one | Lower risk, but re-scan for silent specifics |
| 4 | Have I confirmed with a source independent of this AI? | You're close to done | Not verified yet — don't treat it as fact |
| 5 | Does this touch anything after the model's knowledge cutoff? | Treat as unverified no matter how confident it sounds | Cutoff isn't the risk here |
| 6 | If this goes out with my name on it, am I the one who checked it? | Ship it | Check it first, or don't ship it |

## Q1: match effort to stake, not to how confident the AI sounds

Confidence is not a signal — models sound the same whether they're right or fabricating (see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident)). Stakes are the signal. Start here, then measure against how wrong-and-costly a mistake would actually be:

| Stake | Example | Default verification effort — start here, then measure |
|---|---|---|
| Low | Brainstorm, first draft, private note to yourself | Skim for plausibility. No source-checking needed. |
| Medium | Blog post, internal doc, advice to a friend | Spot-check the specific claims. One independent source is enough. |
| High | Report you're publishing, a number you'll present, a decision with a real cost | Verify every specific claim against a primary source. |
| Critical | Legal, medical, financial, safety, anything irreversible, anything affecting someone else without their own check | Verify every claim *and* get a second qualified human to look at it. |

## Q2: sort claims into two buckets

Not everything in an AI answer needs a citation. Sort first:

- **Checkable facts** — a date, a law, a price, a formula, a quote, "X happened," "Y is true." These have a real answer somewhere. Verify them.
- **Judgment calls** — "you should probably," "the better approach is," "most teams find." These are synthesis, not fact. You check the *reasoning*, not a source — does the argument actually hold, given your situation.

Treating a judgment call like a fact ("it said I should, so I should") skips the thinking you're actually there to do. Treating a checkable fact like a judgment call ("seems reasonable, moving on") is how wrong dates and fabricated numbers make it into final work — see [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is).

## Q3: pull the specifics out on purpose

Specifics hide inside fluent prose. Don't scan for them by eye — make the model surface them for you. Paste this right after the answer you're checking:

```text
List every specific claim in your answer above: names, dates, numbers,
statistics, quotes, and citations. For each one, say whether you're
confident it's accurate or you're estimating/reconstructing it.
```

This doesn't make the list trustworthy — the model can be wrong about its own confidence too — but it turns "read the whole answer again" into a short, checkable list. Full walkthrough: [catch a hallucination, worked example](/learn/ai-literacy/catch-a-hallucination-worked-example). Then check each item against something outside the conversation — see [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) and, for task-specific tactics, [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type).

## Q4: what actually counts as an independent source

This is the step people fake most often. Rank what you're using:

| Source | Counts as independent? |
|---|---|
| Primary source (the law itself, the original paper, the vendor's docs, the dataset) | Yes — this is the check |
| Reputable secondary source (a source you know isn't just echoing the AI) | Yes, if it clearly predates or is independent of this conversation |
| Asking the same AI to double-check itself | **No** — same training data, same blind spots, same failure mode restated with more confidence |
| Asking a *different* AI and seeing if it agrees | **No** — agreement between two models trained on overlapping web data is not independent confirmation |
| A search result the AI summarized for you, that you didn't open | **No** — you verified the summary, not the claim |

If nothing in your check was outside the AI's own output, you haven't verified anything yet — you've just asked twice.

## Q5: the cutoff question is a yes/no gate, not a vibe check

Every model has a point after which it knows nothing — see [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops). Ask directly:

- Does this involve "current," "latest," "as of today," a recent version number, a live price, an ongoing event, or something that could have changed since the model's training data was collected?

If yes, the model is either guessing, pattern-completing from stale data, or (if it has live search) only as good as what it retrieved *this turn* — check that retrieval step too, don't assume it happened. Either way: treat the claim as unverified by default, independent of how it's phrased.

## Q6: the signature test

Last question, and the one that decides whether any of the above actually happens: **if this went out over your name — to a boss, a client, a doctor, a court, a friend making a real decision — would you be the one explaining it if it's wrong?**

If yes, you own the verification. Not the AI, not "it seemed right," not "I assumed someone would catch it." Forwarding an AI-drafted specific claim under your own name, unchecked, is the actual failure mode this whole checklist exists to prevent — it's the difference between AI as a drafting tool and AI as an unaccountable author. More on this split: [using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly).

## Red flags — stop and verify hard

These categories fail quietly and cost the most. Treat any of them as an automatic override of whatever effort level Q1 gave you — verify hard regardless of how low-stakes the surrounding task felt.

| Red flag | Why it's dangerous | What "verify hard" means here |
|---|---|---|
| Citations, case law, papers, or quotes | Models generate plausible-looking references that don't exist, or attach a real title to the wrong author/finding | Open the actual source. If you can't find it in under two minutes, assume it's fabricated. |
| Current events, "latest," recent versions | Past the knowledge cutoff, or stale by the time you read it | Confirm with a source dated after the claim, not another AI answer |
| Precise statistics with no source ("73% of," "on average X days") | Fake precision is a classic confidence tell — real uncertain estimates get hedged, fabricated ones get suspiciously exact | Ask for the source of the number, then check that source exists and says what's claimed |
| Legal, medical, or financial advice | High stakes, jurisdiction- and person-specific, wrong-by-default without your full situation | Get a licensed human to check it before anyone acts on it |
| Facts about a specific named person | Bios, credentials, legal or employment history are common hallucination targets and can cause real harm if wrong | Verify against a source that isn't the AI and isn't about to be shown to that person unchecked |
| Math or unit conversions embedded in prose | Arithmetic errors hide inside fluent sentences — see [when AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong) | Redo the calculation yourself, separately, with a calculator or code |

## The printable version

```text
VERIFICATION CHECKLIST — run before you ship an AI answer

[ ] 1. STAKE: low / medium / high / critical  ->  effort matches table
[ ] 2. CLAIMS: checkable facts separated from judgment calls
[ ] 3. SPECIFICS: names/dates/numbers/quotes/citations listed and checked
[ ] 4. SOURCE: verified against something independent (not the same AI, not another AI)
[ ] 5. CUTOFF: nothing here depends on "current," "latest," or post-cutoff info
        without being checked live
[ ] 6. OWNERSHIP: if it fails, I'm the one who checked it — not the AI

RED FLAGS -> stop, verify hard, no matter the stake level:
[ ] citations / quotes / case law
[ ] current events or "as of today" claims
[ ] precise stats with no given source
[ ] legal / medical / financial advice
[ ] facts about a specific named person
[ ] math or unit conversions inside prose
```

If every checked box on the top six is genuine and none of the red flags apply unaddressed, ship it. If you're skipping a box because checking feels like it'll take too long, that's usually the box that mattered.

**Related:** [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [Fact-check an AI answer, step by step](/learn/ai-literacy/fact-check-an-ai-answer-step-by-step) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [Judging and verifying quiz](/learn/ai-literacy/judging-and-verifying-quiz)
