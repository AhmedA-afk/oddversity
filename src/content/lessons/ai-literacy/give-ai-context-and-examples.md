---
title: "Show, don't just tell: giving AI context and examples"
track: "ai-literacy"
status: live
summary: "A worked example replying to a customer complaint shows how pasting the real email and one sample reply transforms AI output — and exposes the specific way few-shot examples can le."
duration: "11 min read"
---

A blank instruction forces the model to guess at your business, your customer, and your voice, all at once. Paste in what's actually true and show it what "good" sounds like, and most of that guessing disappears.

## The setup

You run support solo for a small handmade-candle shop. This email just came in:

```text
Subject: Order #48213 — very disappointed

Hi,

I ordered the Lavender Fields gift set two weeks ago as a birthday
present for my sister, and paid an extra $12.99 for expedited
shipping. The tracking page has said "label created" for nine days
and the package hasn't moved. I emailed your support address twice
this week and never heard back.

Because of this I had to buy a backup gift last-minute, so the whole
point of the order is gone. At the very least I'd like the $12.99
shipping fee refunded. I'm also reconsidering whether I'll order from
here again.

Dana T.
```

You have five minutes between other things to get a reply out. Here's a real decision you've already made: you'll refund the $12.99 shipping fee, and you genuinely don't know when the package will move, so you won't promise a date. That's it — that's the whole resolution. Everything else is about *how* you say it.

One housekeeping note before you paste anything anywhere: a real complaint email often carries a full name, a physical address, or order and payment details. Strip anything you don't need before it goes into an AI tool — see [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) for what's worth redacting even in a low-stakes case like this one.

## Step by step

### Step 1: Just describe the situation

The instinct when you're rushed is to skip pasting anything and just describe the problem:

```text
Write a reply to a customer who's upset that their order is late.
```

Output:

```text
Dear Customer,

We sincerely apologize for any inconvenience caused by the delay in
your order. We understand how frustrating this must be and want to
make it right. As a gesture of goodwill, we have issued a refund of
$15 to your original payment method and are expediting a replacement
shipment.

Please let us know if there is anything else we can do.

Best regards,
Customer Support Team
```

This is the vague-request problem from [turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) showing up in a new place: no order number, no name, no gift, no mention of the two failed emails. It even invents specifics — a $15 refund and a replacement shipment — that have nothing to do with Dana's $12.99 or your actual decision. It's not lying to you; it's filling gaps you left open, which is exactly how a [hallucination](/learn/ai-literacy/what-a-hallucination-really-is) gets made. You didn't give it Dana's facts, so it manufactured plausible-sounding ones.

> **Why this step?** You need to see the failure mode before the fix means anything. "Just paste the email" sounds obvious in hindsight, but the reason it matters is concrete: every specific in this output is either missing or made up.

### Step 2: Paste the actual complaint

Same request, but now the real email goes in with it:

```text
Reply to this customer complaint:

Subject: Order #48213 — very disappointed

Hi,

I ordered the Lavender Fields gift set two weeks ago as a birthday
present for my sister, and paid an extra $12.99 for expedited
shipping. The tracking page has said "label created" for nine days
and the package hasn't moved. I emailed your support address twice
this week and never heard back.

Because of this I had to buy a backup gift last-minute, so the whole
point of the order is gone. At the very least I'd like the $12.99
shipping fee refunded. I'm also reconsidering whether I'll order from
here again.

Dana T.
```

Output:

```text
Dear Dana,

Thank you for reaching out regarding order #48213. We sincerely
apologize for the delay in the delivery of your Lavender Fields gift
set and for the lack of response to your previous emails. We
understand this was intended as a birthday gift for your sister and
regret that the delay impacted that occasion.

We will be processing a refund for your order in full, along with a
complimentary gift as an apology for the inconvenience. Please allow
5-7 business days for this to reflect on your statement.

We value your business and hope to serve you again in the future.

Warm regards,
Customer Support Team
```

Real progress: the order number, the gift, the two unanswered emails are all in there now. But two things are still wrong. First, the voice — "Thank you for reaching out," "We value your business" — reads like a template, not a person who read the email. Second, and more important: it invented a resolution again. A full refund plus a complimentary gift is not what you decided. Pasting the complaint gave it the *facts of the problem*, but you never told it your *decision*, so it filled that gap too — same failure as step 1, just narrower.

> **Why this step?** This is the part people skip past too fast: pasting context fixes what the model knows, not what it decides. If you don't state the resolution yourself, it will still guess one — it just guesses more plausibly now that it has real details to guess from.

### Step 3: Add an example of the tone you want

You have a reply your manager Sam sent last month for a different complaint — a cracked jar — that customers responded well to:

```text
Hi Priya,

You're completely right to flag this — a cracked jar isn't what we
want turning up on your doorstep. I've packed a replacement with
extra padding and it goes out today with tracking; you should have it
by Thursday. I've also refunded the $6.50 shipping you paid on the
original order, no need to send anything back.

Thanks for the photos, and for your patience while we sorted it out.

Sam
```

You paste both the complaint and this example together:

```text
Here's a complaint I need to reply to:

[Dana's complaint — as above]

Here's a reply I sent for a similar issue last month that customers
responded well to. Write my reply to Dana in the same style:

[Sam's example reply — as above]
```

Output:

```text
Hi Dana,

You're completely right to flag this — a package that stalls for nine
days on a gift order isn't the experience we want you to have. I've
packed a replacement with extra padding and it goes out today with
tracking; you should have it by Thursday. I've also refunded the
$6.50 shipping you paid on the original order, no need to send
anything back.

Thanks for your patience while we sorted it out.

Sam
```

Read that fast and it looks like the win: warm, direct, specific, structurally identical to Sam's reply, and — correctly — it dropped the "thanks for the photos" line since Dana didn't send any. That's a genuinely good sign; it's adapting, not copy-pasting blindly.

> **Why this step?** An example does something a description can't: it shows the pattern instead of naming it. You could try to describe "warm, brief, leads with acknowledgment, ends with a concrete fix, signs off casually" and still get something stiff, because [language models predict what continues a pattern](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) rather than parsing a list of adjectives. One well-chosen sample email did more work than three sentences of style instructions would have.

## Where it breaks

Now go line by line against Dana's actual email and your actual decision.

- **"I've packed a replacement... it goes out today... by Thursday."** There's no replacement to pack — Dana's issue is a stalled *original* package, not a broken item. You also don't have a delivery estimate. This line is invented.
- **"refunded the $6.50 shipping."** Dana paid $12.99. The $6.50 belongs to Priya's order, three sentences up in the example you pasted.
- **Signed "Sam."** You're Jess. Sam is the colleague whose old email you pasted as a style reference.

Would you have caught all three on a fast re-read before hitting send? That's the actual risk here, not that the output is obviously bad — it isn't. It's fluent, warmly toned, and structurally perfect, which is exactly what makes the wrong dollar amount and the invented promise easy to miss.

Here's why it happened: you told the model *what* to write about (Dana's complaint) and *what to imitate* (Sam's reply), but you never told it that Sam's reply was for tone only, not for facts. Nothing in your prompt drew that line, so the model didn't either — it kept predicting the most likely continuation of "a reply that looks like this one," and the likeliest continuation of a reply that mentions a replacement and a dollar figure is *some* replacement and *some* dollar figure. The nearest ones it had seen were Priya's. That's the same [pattern-completion](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) behavior that made step 3 work so well — it's not a separate flaw, it's the same mechanism cutting both ways.

**The fix** is to say explicitly which parts of the example are structure and which parts are throwaway, and to give it the real facts yourself instead of leaving them to be inferred:

```text
Here's a complaint I need to reply to:

[Dana's complaint]

Here's an example of the tone and structure I want — but ignore its
specific details (names, dollar amounts, and the resolution). Use it
only as a style guide:

[Sam's example reply]

The actual facts for this reply:
- My name is Jess.
- The only thing I can offer right now is refunding the $12.99
  expedited shipping fee.
- I don't have a new delivery estimate yet, so don't promise one.
```

Output:

```text
Hi Dana,

You're completely right to flag this — a package that stalls for nine
days on a gift order isn't the experience we want you to have. I
don't have a new delivery estimate yet, but I've refunded the $12.99
expedited shipping fee you paid, since that's the one part of this we
can fix right away.

Thanks for your patience, and I'm sorry the timing cost you the
original gift moment with your sister.

Jess
```

Same warmth, same structure Sam's reply taught it — but now every fact traces back to something you actually said, and nothing traces back to Priya's cracked jar. Before this goes out, run the same three-point check you just did on the broken version — name, dollar figure, any promised action or date — against the source email. That's the whole method behind [the verification checklist](/learn/ai-literacy/the-verification-checklist): not reading the whole draft with equal suspicion, but checking the specific claims that could be wrong in ways you wouldn't notice from tone alone.

## Takeaways

- **Paste the real material.** A description of a situation is a lossy summary; the actual email has the details a summary drops — and the model can't recover what you never gave it.
- **One example beats a paragraph of adjectives.** Showing "write it like this" transmits a pattern that describing "warm but brief, direct but not curt" usually doesn't land as precisely.
- **Context supplies facts, not decisions.** Pasting the complaint told the model what happened. It still needed you to say what you were going to *do* about it — otherwise it invents a resolution, both times you left the gap open.
- **An example can leak content, not just style.** If you don't tell the model which parts of your sample are structure and which are throwaway specifics, it may reuse names, numbers, and promises from the sample instead of just its shape. Separate the two explicitly.
- **The best output is the one worth double-checking most.** Step 3's flawed draft was more convincing than step 1's obviously generic one, precisely because it sounded right. Fluency isn't evidence of accuracy.
- **This generalizes past customer replies.** The same paste-plus-example move works for meeting notes, status updates, code review comments, or anything else where you have a real input and a sample of the output you want — see [prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) for more of the same shape.

**Related:** [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) · [Prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks)
