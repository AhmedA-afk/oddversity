---
title: "Where AI's knowledge comes from — and where it stops"
track: "ai-literacy"
status: live
summary: "A concept lesson explaining training data and the knowledge cutoff — why a plain chatbot can confidently invent an answer about recent events or current prices, how that differs fr."
duration: "9 min read"
---

Ask a chatbot what happened in the news this morning, or what a product costs right now, and it might answer instantly and with total confidence — and be flat-out wrong. Not because it's broken. Because of how it learned everything it knows in the first place.

## What it is

An AI language model learns by reading an enormous amount of text — articles, books, code, websites, forum posts — collected up to some point in time. That point is called the **knowledge cutoff**. Once training finishes, the model's internals are frozen. Nothing you type in a conversation changes what it "knows" the way reading a new book would. It isn't quietly browsing the web in the background while it waits for your question, and it isn't updating itself as events happen.

So a plain model's knowledge is really a snapshot, not a subscription. It has broad, deep familiarity with everything up to its cutoff, and close to nothing after it — plus one more gap people forget: it never had access to anything that wasn't public and included in that training text in the first place. Your company's internal wiki, your personal files, a paywalled report, a private group chat — none of that was ever "in" the model, cutoff date or not, unless someone puts it directly into the conversation as context. For how that text actually turns into fluent answers, see [how language models produce text](/learn/ai-literacy/how-language-models-produce-text).

## The mental model

Picture someone who read an entire library, cover to cover — genuinely brilliant, well-read, able to connect ideas across thousands of sources. Then, the day the library closed, they were sealed in a room with no phone, no windows, no mail. You can still have a rich conversation with them. They can explain history, reason through problems, write in any style, recall obscure details from what they read. What they cannot do is tell you who won an award announced this morning, because from their point of view, this morning hasn't happened yet.

Here's the part that trips people up: that sealed-room person doesn't automatically say "I wouldn't know, I've been shut in here." If you ask them a question about the present, their instinct is to answer using the last thing they read that resembles it — a price from before the door closed, a lineup from the last season they knew about — and say it just as fluently as anything else. That's the core thing to hold onto: a plain model isn't a live feed with a delay warning attached. It's a very well-read book, not a search engine, and [it's worth internalizing that distinction](/learn/ai-literacy/ai-is-not-a-search-engine) before you trust it with anything time-sensitive.

Now imagine handing that same person a phone, right before you ask your question. Suddenly they can check today's headlines or look up a live price — but only because you gave them a tool, not because their own memory improved. That's the difference between a plain model and one connected to live search, and it's the difference this whole lesson is really about.

## Why it works this way

Training a model isn't a light, continuous process — it's a large, expensive run done on a fixed batch of collected data, over a stretch of time, ahead of any conversation with you. It has a start and an end. Once it ends, that version of the model is tested, evaluated, and shipped, and it stays that way until someone runs training again with a newer batch of data and releases a new version. There's no step in a normal chat where your question gets folded back into the model's weights — a conversation is a *use* of the trained model, not a retraining of it. This is a deliberate tradeoff, not an oversight: a frozen, well-tested model behaves predictably; a model that rewrote itself from every conversation would not. The loop that actually shapes a model — data in, patterns learned, output out — runs in a separate, offline stage described in [the data → model → output loop](/learn/ai-literacy/data-model-output-loop), long before it ever meets your prompt.

That same reasoning explains the privacy gap too. Training data has to be gathered and included *before* the cutoff to be in there at all — which is precisely why anything private, internal, or newly published after that date is invisible to the base model by default. Giving a model access to more — the current date, a live search result, your company's documents — requires deliberately wiring in an outside tool. That's an addition on top of the model, not a property the model develops on its own.

## A concrete example

Say you ask, plainly: **"What's the current price of the Aurora X200 phone?"** (a made-up product, so the numbers below are illustrative, not real prices.)

A plain chatbot with no tools might answer:

> The Aurora X200 is priced at around $699.

That number isn't a lie exactly — it's a real figure from somewhere in the training data, stated with total confidence and no date attached. But it could be a launch price from over a year before the cutoff, a price that's since dropped, or a price for a region that isn't yours. The model has no way to know which, because it isn't checking anything — it's recalling the most plausible-sounding number pattern it saw during training and presenting it the same way it would present a historical fact.

A version of the same assistant connected to live search, asked the identical question, does something different: it runs a search, reads back a current listing, and can answer something like:

> As of today, it's listed at $649 on the retailer's site — worth double-checking, since prices vary by region and retailer.

Notice the shape of the difference: a date, a source, and a hedge about variation. That's not the model being smarter — it's the model being handed evidence instead of guessing from memory. The exact same gap applies to "who won the award announced this morning" — plain model: silence, a wrong guess, or an answer clearly rooted in an earlier year's news; search-connected model: an actual current answer with something to point to.

## Where it shows up

This gap surfaces constantly, in places you might not expect:

- **News, scores, prices, weather** — anything defined by "right now" is exactly what a frozen snapshot can't hold.
- **Recent releases** — ask about the newest version of a piece of software or a library released after the cutoff, and a plain model may confidently describe features or functions that don't exist, because it's pattern-matching to the last version it actually saw.
- **This year's dates and events** — including, easy to forget, today's date itself. A plain model may not reliably know what "today" is unless the interface tells it.
- **Anything internal or private** — your company's policies, an unpublished project, a personal document. No amount of "cutoff" matters here; it was never public text to begin with.
- **Tool-using assistants** — many modern products pair a language model with search, a database, or your own uploaded files specifically to close this gap. Choosing the right one for the task is its own skill — see [choosing the right AI system](/learn/ai-literacy/choose-the-right-ai-system) and [matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job).

## Watch out for

**Fluent isn't the same as current.** A plain model answers a question about yesterday's game in exactly the same confident tone it uses for a question about ancient history. Tone gives you no signal about whether the underlying fact is fresh or stale — you have to ask that separately, every time something is time-sensitive.

**Don't trust the model's own claim about its cutoff.** If you ask it "what's your knowledge cutoff?", it may answer, but it can get this wrong or be genuinely unsure, since that fact isn't something it "experiences" — it's metadata about itself it may or may not have been told accurately. Check the product's own documentation instead of taking the model's self-report as ground truth.

**A search icon doesn't guarantee a search happened.** Some assistants decide on their own, per question, whether to look something up — and that judgment isn't perfect. It can skip a search on a question that actually needed one, or search and still misread a page. Look for concrete signs that a lookup actually occurred — a cited source, a date, a link — rather than assuming "this product has search" means "this specific answer used it." When in doubt, that's exactly what [verifying facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) is for, and it's worth knowing [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) so a confident, dateless answer reads as a flag rather than a reassurance.

## Where next

The practical takeaway: before you trust an answer, ask yourself whether the question is about something that could have changed since a fixed date, or something that was ever public in the first place. If either answer is "maybe," treat the response as a draft to check, not a fact to repeat — and reach for a tool that can actually look it up.

**Related:** [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine) · [Why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) · [Choosing the right AI system](/learn/ai-literacy/choose-the-right-ai-system)
