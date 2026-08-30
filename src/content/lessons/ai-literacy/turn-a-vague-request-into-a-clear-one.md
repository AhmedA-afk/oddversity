---
title: "Worked example: fixing a vague prompt"
track: "ai-literacy"
status: live
summary: "A step-by-step worked example that takes the prompt 'help me with my resume' through three rounds of added specificity, showing the actual mediocre-to-good output at each stage."
duration: "11 min read"
---

"Help me with my resume" is a real request — it's just missing everything the AI would need to do it well. Watch what happens when you feed it the same three things a human career coach would ask you for, one at a time, and where even a "good" prompt still needs a check before it goes out the door.

## The setup (specific)

You're applying for a Marketing Coordinator opening at a literacy nonprofit — call it Larkspur Literacy Project. The posting says they want someone to grow their social media presence, manage email campaigns to their donor list, and support event promotion; Canva and Mailchimp experience is "a plus." Right now you're a Social Media Assistant at a different organization, Brightpath Community Center, and your current resume is two years stale.

You have three real achievements sitting in your head that never made it onto paper:

1. You grew Brightpath's Instagram following from 3,200 to 21,000 in 11 months by launching a weekly content calendar and partnering with 6 local micro-influencers.
2. You redesigned the monthly donor email, lifting open rate from 19% to 34% and click-through from 2% to 7%.
3. You organized Brightpath's annual fundraising gala, raising $52,000 against a $35,000 goal — 49% over target — while finishing $1,200 under budget.

None of that is in your prompt yet. That's the whole experiment: add it in stages and watch the output change.

## Step by step

### Round 1: the vague prompt

```text
help me with my resume
```

What comes back:

```text
Here's a general resume structure you can use:

Contact Info — Name, phone, email, LinkedIn

Summary — A 2-3 sentence overview of your experience and career goals.
Example: "Results-driven professional with a proven track record of
success seeking to leverage skills in a dynamic new role."

Experience — List your jobs in reverse chronological order. For each,
include 3-5 bullet points describing your responsibilities. Use strong
action verbs like "managed," "led," "developed," and "implemented."

Education — Degree, school, graduation year.

Skills — List relevant hard and soft skills.

A few general tips:
- Keep it to one page if you have less than 10 years of experience
- Use a clean, professional font
- Proofread carefully for typos
- Tailor your resume to each job you apply for
```

This isn't wrong. It's also completely interchangeable — you could hand this exact output to a plumber, a paralegal, or a new grad, and it would fit all three equally badly. Notice the last tip: "tailor your resume to each job you apply for." The model knows that's good advice. It just can't follow it, because you haven't told it what job.

> **Why this step?** A language model turns your prompt into a prediction of what text should come next, based on patterns across everything like it it's seen — see [how language models produce text](/learn/ai-literacy/how-language-models-produce-text). "Help me with my resume" matches millions of generic resume-help documents and almost none of your actual situation, so the statistically safest completion is the generic one. This is [pattern prediction](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) doing exactly what it's built to do — the fix isn't a better model, it's a less average prompt.

### Round 2: add the job you're applying for

```text
help me with my resume. I'm applying for this role:

"Marketing Coordinator — Larkspur Literacy Project. We're looking for
someone to grow our social media presence, manage email campaigns to
our donor list, and support event promotion. Experience with Canva
and Mailchimp a plus."

I'm currently a Social Media Assistant at Brightpath Community Center.
```

What comes back:

```text
Given the role, here's a structure that emphasizes what Larkspur is
hiring for:

Summary — Marketing professional with social media and email
marketing experience, seeking to grow community engagement as
Marketing Coordinator at Larkspur Literacy Project.

Experience
Social Media Assistant, Brightpath Community Center
- Managed social media accounts to increase engagement and followers
- Assisted with email marketing campaigns to grow open and
  click-through rates
- Supported event promotion and marketing materials

Skills — Social media management, email marketing, Canva, Mailchimp,
event promotion, content calendars

This hits the keywords from their posting (social media, email
campaigns, event promotion, Canva, Mailchimp) — but the bullets under
Experience are still placeholders. I don't have your actual numbers
or results yet. Want to give me a few so I can make these specific?
```

Better, and it knows exactly why it's stuck: it can mirror the job posting's language, but it can't manufacture your track record. "Managed social media accounts to increase engagement" is a shape with no content in it.

> **Why this step?** You didn't add facts about you here — you added facts about the *target*. That's enough to narrow the vocabulary, the section emphasis, and the keywords (which matters if an applicant-tracking system is scanning for exact terms from the posting), but relevance and substance are two different problems. This is the difference between turning a vague request into a clear one and actually [giving the AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) — round 2 did the first, not yet the second.

### Round 3: add your achievements and the format

```text
Here are my top three achievements, with real numbers:

1. Grew Instagram following from 3,200 to 21,000 in 11 months by
   launching a weekly content calendar and partnering with 6 local
   micro-influencers.
2. Redesigned the monthly donor email, lifting open rate from 19%
   to 34% and click-through from 2% to 7%.
3. Organized the annual fundraising gala, raising $52,000 against a
   $35,000 goal (49% over target), $1,200 under budget.

Format: one page, reverse-chronological, plain bullet points starting
with action verbs, quantify every bullet, no summary paragraph or
graphics — this needs to pass through an ATS.
```

What comes back:

```text
[Your Name]
[Phone] | [Email] | [City, State]

EXPERIENCE

Social Media Assistant — Brightpath Community Center | [Start–End]
- Grew Instagram following from 3,200 to 21,000 (556% increase)
  over 11 months by launching a weekly content calendar and
  partnering with 6 local micro-influencers
- Redesigned the monthly donor email, lifting open rate from 19%
  to 34% and click-through rate from 2% to 7%
- Organized the annual fundraising gala, raising $52,000 against
  a $35,000 goal (49% over target) while finishing $1,200 under
  budget

EDUCATION
[Degree, school, year]

SKILLS
Social media management, email marketing, content calendars,
event coordination
```

That's a resume you could actually send — specific, quantified, formatted the way you asked, no filler summary paragraph pretending to be a personality. The only placeholders left ([Your Name], [Start–End]) are things it genuinely doesn't know and correctly didn't guess.

> **Why this step?** Facts and format are the two remaining ingredients the model can't invent on its own: your history is raw material, and layout is a constraint on how that material gets arranged. Give it both and there's nothing left for it to fill in with averages. This is the payoff of specificity — three short additions turned a document that fit anyone into one that only fits you.

## Where it breaks

Say you push once more: "make the bullets punchier." Here's a realistic version of what comes back:

```text
- Led a team of 5 in growing Instagram following from 3,200 to over
  25,000 using Meta Business Suite and Canva, a 680% increase in
  under a year
```

Read that slowly against what you actually gave it. "Led a team of 5" — you never said that. "Over 25,000" — you said 21,000; the number moved. "Meta Business Suite and Canva" — Canva was in the *job posting*, not in anything you said you personally used. "680% increase" — that's not sloppy math, it's internally consistent with the *new*, wrong follower count ((25,000 − 3,200) / 3,200 ≈ 680%), which is almost worse: the fabrication is self-consistent enough to look verified.

None of this is malicious. Asked to make a bullet "punchier," the model pattern-matches to what punchy resume bullets typically contain — leadership scope, named tools, bigger round numbers — because that's what "punchy" looks like across the resumes it's drawing on. It has no internal flag that says "this clause came from the user" versus "this clause is genre-typical filler." It's optimizing for *sounds like a strong bullet*, not for *true*. That's the same mechanism behind [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) even when it's making something up — a [hallucination](/learn/ai-literacy/what-a-hallucination-really-is) doesn't come with a hedge attached.

The fix is to say, explicitly, what "punchier" is not allowed to touch:

```text
Make the bullets punchier, but don't change any numbers, tools, or
scope of responsibility from what I gave you. If you think something
should be added, flag it as a separate suggestion — don't fold it
into the bullet as if it were a fact.
```

```text
- Grew Instagram following from 3,200 to 21,000 (556% increase) over
  11 months by launching a weekly content calendar and partnering
  with 6 local micro-influencers

Suggestion (not included above — confirm before adding): if you
personally used Meta Business Suite or Canva to run this, naming the
tool could help with ATS keyword matching. Let me know and I'll
add it.
```

Same request, same intent, but now the model separates "rewritten from your facts" from "here's an idea, your call" — instead of quietly merging the two. This is why a resume, a bio, or anything with your name on it still gets read line by line before it goes anywhere; see the [verification checklist](/learn/ai-literacy/the-verification-checklist) for the general habit and [catching a hallucination](/learn/ai-literacy/catch-a-hallucination-worked-example) for more on spotting exactly this kind of confident, consistent-sounding invention.

## Takeaways

- A vague prompt gets you the statistical average of everything like it — safe, generic, and useless for anything specific to you.
- Each concrete addition narrows the output differently: the target role fixes relevance, your real achievements fix substance, the format fixes structure. You need all three; any one alone leaves gaps.
- "Make it better" or "punchier" is an open invitation to embellish. Treat every revision request as a fresh chance for the model to add something you never said.
- Whenever accuracy matters — resumes, bios, cover letters, anything that represents you — say explicitly "only use the facts I've given you" and ask for unconfirmed additions to be flagged, not merged in.
- Read the final version the way you'd fact-check a claim someone else made about you, because that's exactly what it is.

### Steal this template

```text
Help me write/rewrite [document] for [specific goal or role].

Context:
- Target: [job title, company, audience, or purpose]
- Key requirements or keywords: [paste the relevant lines]

My real facts (use only these — don't add or infer anything I
haven't listed):
1. [Fact/achievement with a real number or result]
2. [Fact/achievement with a real number or result]
3. [Fact/achievement with a real number or result]

Format:
- [Length, structure, tone, sections to include/exclude]

If you need a detail I haven't given you, write [ASK: ...] instead
of guessing. If you're revising, don't change any numbers, tools, or
scope from what's above — flag suggestions separately.
```

Swap the bracketed lines for whatever you're actually working on — a bio, a project update, a cover letter — and you've replaced "help me with X" with something specific enough to be worth answering.

**Related:** Turn a vague request into a clear one · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Catch a hallucination: worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [Everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet)
