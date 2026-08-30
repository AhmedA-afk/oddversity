---
title: "Matching the right AI tool to the job"
track: "ai-literacy"
status: live
summary: "An intuition-first lesson using a 'staffing desk' analogy (generalist, generalist-with-a-phone-line, specialist, junior/senior) to teach how to route a task to the right category o."
duration: "11 min read"
---

## Picture a staffing desk, not a single genius

Here's the mental model that actually holds up: don't think of "AI" as one assistant of varying quality. Think of it as a **staffing desk**. Every time you have a task, you're deciding who from the bench to call — and the desk has more than one kind of hire on it.

On this bench you've got:

- **The generalist** — read an enormous share of what's publicly written, reasons well across almost any topic, but stopped reading on a fixed date and has never seen your inbox, your codebase, or today's news. This is a plain chatbot with no tools switched on.
- **The generalist with a phone line out** — same person, same reasoning, but they can now dial out mid-conversation to check a live listing, a current price, today's headlines. This is a chatbot with web/browsing access turned on.
- **The specialist** — hired for exactly one craft: turning text into an image, transcribing audio, reviewing code. Narrower than the generalist, sometimes clumsy at small talk, but better at their one job than the generalist will ever be, because that's all they were built to do.
- **The junior vs. the senior** — a free-tier hire (rate-limited, an older or smaller model, no priority) and a paid-tier hire (faster, a stronger model, higher usage caps). Same "org," different level of hire.

You already have half of this map from /learn/ai-literacy/choose-the-right-ai-system, which covers the first cut — chatbot vs. search vs. specialized system. This page is about the moment right before you type anything: which hire do you actually call, and why does guessing wrong cost you more than you'd think.

## Walk the desk: four requests come in

Run the simulation with me. Four tickets land on your desk this morning.

**Ticket 1: "Summarize this article I'm pasting in."** Everything the task needs is *in the conversation* — you're supplying the text. Call the plain generalist. No phone line needed, no specialist needed. This is the cheapest, fastest hire and it's plenty.

**Ticket 2: "What's the current exchange rate and has this airline had delays this week?"** The generalist's knowledge is frozen at a training cutoff — see /learn/ai-literacy/where-ai-knowledge-comes-from-and-stops for why. Ask them anyway and they will often guess fluently rather than say "I don't know," which is exactly the failure mode in /learn/ai-literacy/why-ai-sounds-so-confident. This ticket needs the generalist *with the phone line* — live web access — or better, an actual current source. Worth remembering too: a chatbot with browsing isn't a search engine wearing a costume; see /learn/ai-literacy/ai-is-not-a-search-engine for how it still summarizes and can still misread what it fetched.

**Ticket 3: "Turn this product description into a hero image for the landing page."** No amount of reasoning fixes this — the generalist, phone line or not, cannot paint. This is a job for the specialist: an image-generation tool, purpose-built for exactly this output.

**Ticket 4: "Is this refund policy in our internal handbook, and what does it say?"** This is the one people route wrong most often. It's not really a *current-info* problem — it's a *private-info* problem. The generalist, even with a phone line, has never seen your handbook and the public internet doesn't contain it. Handing that document to a general chatbot to answer from also means handing your internal handbook to whatever service you're using — a decision covered in /learn/ai-literacy/what-not-to-paste-into-ai. The right hire here isn't "smarter," it's one that's actually been given the document, through a tool built for that.

Notice what decided each routing. Not "which one is the best AI." Not "which one is newest." It was always: *what does this task need that the plain generalist doesn't have.*

## The wrong instinct: reach for the smartest name you know

Here's the intuition almost everyone starts with, and it's wrong: **"the most capable general model can substitute for all four hires."** If you've used one strong chatbot and it impressed you, it's natural to assume it's your one tool for everything — research, images, transcripts, private-document lookups, all of it.

It fails in a specific, predictable way. A powerful generalist with no web access will answer Ticket 2 anyway, fluently and wrong, because fluent, confident guessing is what these models do by default when they don't know — see /learn/ai-literacy/ai-as-pattern-prediction-not-thinking for why that's the actual mechanism, not a bug that gets patched out. It will describe an image for Ticket 3 instead of producing one. And on Ticket 4, it will do the worst thing of all: answer *confidently* from general knowledge about "typical" refund policies, which is fluent, plausible, and about your company specifically wrong.

The failure isn't that the model is weak. It's that capability and access are different axes. A brilliant generalist who's been out of contact for months is still brilliant — and still wrong about anything that happened while they were out of contact, no matter how brilliant they are. Raw reasoning power doesn't manufacture information the tool was never given.

## What was actually true: two questions, asked first

Once you see the routing in the four tickets, the actual decision rule is just two questions, asked *before* you open any chat window:

> **1. Does this need current or private information the tool doesn't already have?**
> **2. How much does a wrong answer cost me if I don't catch it?**

Question 1 tells you *which category* of tool: plain generalist, generalist-with-web-access, or a system actually connected to your private data. If the answer is "no, everything needed is general knowledge or text I'm supplying," a plain chatbot is genuinely enough — don't overspend effort routing further. If the answer is "yes, it needs today's data or my own files," you need the phone line or a tool built to see those files, and a plain chatbot will fail silently rather than refuse.

Question 2 tells you *how much verification effort to budget*, independent of which tool you picked. A wrong guess about which movie a quote is from costs you nothing — you'll notice or you won't care. A wrong number in a client invoice, a wrong claim in a document going to your boss, or wrong code touching production costs real time and real trust to unwind. This is the same stakes-based thinking as /learn/ai-literacy/should-i-use-ai-for-this-worked-decisions and it doesn't change based on which tool answered — high-stakes output gets checked using the tactics in /learn/ai-literacy/verification-tactics-by-task-type regardless of whether a specialist or a generalist produced it.

The two questions are independent of each other, and that's the part people miss. A task can need zero current info and still be high-stakes (drafting a legal-sounding clause from general knowledge). A task can need live info and be low-stakes (checking today's weather before a walk). Route on question 1, then set your verification effort on question 2 — don't let a confident-sounding answer to a low-stakes-feeling question skip the check that question 2 says it needs.

## Turn it into a checklist

Before you open a tool, run this in your head — it takes about as long as reading it:

- **Is everything the task needs already in front of me or in general public knowledge?** → plain chatbot, general tier is fine.
- **Does it need today's/this week's information?** → chatbot with web access switched on, or a live source — not the plain generalist.
- **Does it need a document, dataset, or fact that lives only inside your organization or your files?** → a tool actually connected to that data, or you paste in the specific excerpt yourself (mind /learn/ai-literacy/what-not-to-paste-into-ai first).
- **Is the output a different medium than text — an image, an audio transcript, working code?** → a specialized tool built for that output, not a generalist describing what it would do.
- **If this is wrong and I don't catch it, what does it cost?** → set your verification budget now, before you read the answer and get talked into trusting it.

A worked pass through a few real requests:

| Request | Needs current/private info? | Cost if wrong | Route to |
|---|---|---|---|
| "Explain how compound interest works" | No | Low | Plain chatbot |
| "What did our competitor announce this morning?" | Yes, current | Medium | Web-access chatbot |
| "Draft a reply using our cancellation policy" | Yes, private | High | Tool connected to your docs, or you paste the exact policy text |
| "Turn my meeting recording into notes" | No, but wrong medium | Medium | Transcription tool |
| "Review this function for a bug before I ship it" | No | High | Coding-focused tool, then you verify — see /learn/ai-literacy/when-ai-gets-numbers-and-math-wrong for why "it sounds right" isn't proof for logic either |

## The free-vs-paid twist on the same desk

The junior/senior hire fits the same frame, with one nuance worth holding onto: **a paid tier is not automatically "the smart version" of the free one.** Sometimes it is a genuinely stronger model. Often, though, what you're paying for is *more of the same hire's time* — higher message limits, faster responses, priority access, longer memory of the conversation — rather than a categorically better reasoner. That means the two questions above still decide your *category* of tool first; paying more doesn't buy you live web access or private-document connection if the tier you picked doesn't include those features at all. Check what a tier actually includes rather than assuming price tracks capability one-for-one — that's the deeper dive in /learn/ai-literacy/free-vs-paid-ai-what-you-get.

## Where the hiring analogy breaks

Push the analogy past this point and it starts lying to you in three specific ways — worth knowing before you lean on it too hard:

**A human specialist knows the edge of their own competence; the AI specialist often doesn't.** Hire a real transcriptionist and they'll tell you when the audio's too garbled to trust. An AI transcription tool will frequently hand you a clean, confident transcript of words that were never actually said. The generalist-with-a-phone-line has the same gap — it can fetch a live page and still misread or misquote what's on it. "Has access to current info" and "will accurately report it" are not the same guarantee, which is why question 2's verification step doesn't get waived just because you picked the fancier tool.

**The "junior vs. senior" framing implies the free hire is simply less capable at everything — it's not that clean.** Sometimes the free tier is the same underlying model with less compute or a shorter memory allotted to it, not a dumber employee. Sometimes it's an older model entirely. You can't tell which from price alone, so the checklist question ("what does this actually include") still has to be asked separately.

**There's no office culture holding these hires accountable to each other.** A real staffing desk has hires who'd flag a colleague's bad handoff. AI tools don't cross-check each other by default — if the web-access chatbot fetches a stale page, nothing downstream catches that for you. You're the one closing that loop, every time, which is the whole point of building the verification habit rather than the tool-picking habit alone.

Use the desk to route fast. Don't use it to skip checking the work once it's routed.

**Related:** /learn/ai-literacy/choose-the-right-ai-system · /learn/ai-literacy/free-vs-paid-ai-what-you-get · /learn/ai-literacy/compare-ai-tools-for-one-real-task · /learn/ai-literacy/should-i-use-ai-for-this-worked-decisions · /learn/ai-literacy/is-ai-worth-it-for-this-task · /learn/ai-literacy/verification-tactics-by-task-type
