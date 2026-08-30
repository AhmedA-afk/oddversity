---
title: "Why You Evaluate Before You Ship"
track: "prompt-engineering"
status: live
summary: "The prompt that nails your three demo inputs isn't the prompt your users will run - evaluation finds that out before they do."
duration: "6 min read"
---

"It worked when I tried it" is usually the last thing someone says before a prompt breaks in production. The gap between those two moments is what this whole module is about.

## What it is

Evaluation means running a prompt over inputs that represent what your users actually send - not the two or three you happened to type while writing it - and checking the outputs against explicit expectations. [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics) covers the basic shape: a test set, a scoring method, a bar to clear. This lesson is about the habit underneath that shape - why skipping it feels safe, and why it isn't.

A demo is an anecdote. An eval is a sample. Only one of those tells you what happens the next thousand times.

## The mental model

When you write a prompt, you naturally test it against inputs already in your head - the happy path, maybe one edge case you thought of on purpose. That's selection bias with a keyboard: you choose inputs you expect to work, then feel reassured when they do. It isn't dishonest, it's just how testing-by-hand always goes, in code or in prompts.

Picture your prompt's behavior as a function over the full space of inputs it will meet in production. Three demo inputs sample three points from that space. If the function were smooth everywhere, three points might genuinely represent it. Language model behavior isn't smooth - a rephrasing, a missing field, an unusual format can flip an output from correct to wrong, because you're conditioning next-token prediction on a different string, not calling the same code path with different arguments. Three points tell you almost nothing about the shape of the whole thing.

## Why it works this way

This isn't a flaw in any particular model - it follows from what a prompt actually is. A prompt doesn't branch on input the way an `if/else` does; it conditions a probability distribution, and inputs that look similar on the page can land in very different parts of that distribution for reasons invisible in the prompt text. The only way to know how a prompt behaves across your real input distribution is to run it across a sample of that distribution and look at the results - not to reason about it from the wording, and not to trust that passing on a few inputs implies passing on the rest.

## A concrete example

Say you're writing a prompt that extracts a due date from an invoice email:

```
Extract the payment due date from this email.
Return it as YYYY-MM-DD, or the literal string "null" if no due date is stated.

Email:
{email_text}
```

You test it on the email sitting in your inbox:

> "Thanks for your business! Payment is due by March 15, 2026."

Output: `2026-03-15`. Clean. You ship it.

Then someone runs it against 20 real invoice emails pulled from support tickets - not cherry-picked, just the next 20 that came in - and checks each output by hand:

| # | What the email actually says | Model output | Correct? |
|---|---|---|---|
| 1 | "due by March 15, 2026" | `2026-03-15` | yes |
| 2 | "net 30 from receipt" (no receipt date anywhere in the email) | `2026-03-15` (invented) | no |
| 3 | "15/03/2026" (day-first format) | `2026-03-15` | yes |
| 4 | "please remit at your earliest convenience" (no date stated) | `null` | yes |
| 5 | invoice date and due date both present, due date unlabeled | wrong date picked | no |
| ... | 15 more, mixed | | |
| 20 | "03/05/2026" (could be March 5 or May 3, no other clue) | `2026-03-05` (guessed) | no |

Four of twenty fail: 4/20 = 20%. Every failure touches something the single demo input never exercised - a relative date with no anchor, an ambiguous numeric format, two competing dates in one email. The prompt wasn't broken. It was untested against the shape of inputs it would actually meet.

## Where it shows up

The pattern repeats everywhere prompts ship: a classifier that nails the labeled examples in the spec doc but stalls on a ticket mentioning two problems at once; a summarizer that's crisp on short articles and rambling on long ones; a support prompt that's polite in English and oddly blunt in a second language. In every case the failure mode was already sitting in the input distribution - it just wasn't in the three inputs someone tried by hand.

## Watch out for

- **Picking your own test inputs.** If you write the prompt and hand-pick the inputs that check it, you'll subconsciously pick ones it handles well. Pull real inputs from logs, tickets, or a sampled corpus instead of typing new ones from memory.
- **Small samples hide real failure rates.** A 20% failure rate needs somewhere around 15-20 cases before you'd reliably even notice it - three inputs can't surface a problem that only shows up on one case in five.
- **A passing demo plus a plausible story isn't evidence.** "It should handle that, the instructions are clear" is a hypothesis, not a result. The only way to confirm it is to run the case and look.

## Where next

[Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) turns "we should test this on real inputs" into an actual labeled set you can run and rerun - the concrete next step once you've accepted that a demo isn't enough.

**Related:** [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics), [Evaluate Prompts with Datasets, Rubrics, and Regression Tests](/learn/prompt-engineering/prompt-evaluation), [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Why Prompts Steer Next-Token Prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction), [Prompting Is Not Deterministic Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming)
