---
title: "When your data is the price you pay"
track: "ai-literacy"
status: live
summary: "An intuition-building lesson that extends 'if it's free, you're the product' to AI conversations, teaches provenance (knowing where content came from and who has rights to it) thro."
duration: "9 min read"
---

You already know the deal with free apps: if you're not paying, you're the product. AI adds a twist that's easy to miss — the product isn't just your attention anymore, it can be the actual words you typed, and there's no label anywhere telling you where anything in the exchange came from or who has the right to it.

## Start with the stew pot, not the vending machine

The mental model most people default to for a free AI chat tool is a vending machine: you put something in (attention, ad views, maybe a few dollars), it dispenses an answer, transaction closed. That container is wrong for what's actually happening, because the exchange isn't one-directional and it isn't sealed.

Picture a communal stew pot in a shared break room instead — free, self-serve, always simmering. You walk up and ladle out a bowl. Two things are true of that pot that are never true of a vending machine:

- You have no idea what's already in it. Whose recipe the base broth started as, whether an ingredient came from someone who only meant to share it with the person cooking that day, whether something in there is a problem for someone's allergy. No label, no ingredient list. That's a provenance problem.
- If you stir something in — your own stock, a spice you brought from home — it stops being retrievably "yours." It diffuses into the batch, and everyone who dips a ladle in after you gets a trace of it.

Free AI tools work both ends of that same pot. What you get back often has no clean lineage you can trace. What you put in — your prompt, your pasted document — can become part of the base the next version of the tool is built from, if the provider trains on it. Free removed the price tag from the transaction. It didn't remove the transaction.

## Walk it through: what actually happens when you paste

Say you're at work with ten minutes before a call, and you paste a client's contract into a free chatbot to get a quick summary. Here's the sequence, step by step:

1. You paste the text. From your side this feels like typing into a very smart notepad — nothing visibly "leaves" your computer.
2. The text is sent to the provider's servers to generate a response. This isn't optional; there's no version of "use a free chatbot" that keeps the text local to your machine.
3. You get your summary back. The interaction feels finished. Most people's attention stops right here.
4. But the input often doesn't vanish when the window closes. Many free, consumer-facing tools retain conversations for some period, use them to check for abuse or measure quality, and — unless you've turned off an "improve the model" style setting, or you're on a plan that explicitly excludes it — the text can enter the pool used to train future versions.
5. Training isn't a photocopier. Your exact clause essentially never comes back out verbatim to a stranger later (there's more on why below). What actually shifts is statistical — the model's sense of "what contract language looks like" nudges slightly in the direction of what you fed it, mixed with everything else in an enormous batch.
6. Separately, and often more consequentially: the raw text sits stored somewhere for some window of time, reachable by the provider's staff, systems, and legal obligations — a subpoena, a security incident, a human reviewer checking a flagged conversation. That exposure exists whether or not the text is ever used for training at all.

The sequence reveals something worth sitting with: whatever breach of confidentiality happens, happens at step 1 — not at step 4, not at step 6. The moment the contract left your machine for a server you don't control, under terms you didn't negotiate, you lost the ability to guarantee what happens to it next. Whether anything visibly bad ever occurs downstream is a completely separate question from whether you kept your side of a confidentiality promise. "Nothing bad happened" and "I didn't breach the agreement" are not the same claim — an NDA or client engagement letter usually promises you'll control who sees the material, and you handed control to a third party the second you hit enter.

## Provenance: the label the stew pot doesn't have

Provenance is a simple idea wearing a formal-sounding word: knowing where something came from, and who has rights to it — the same job a chain of custody does for evidence, or a title history does for a used car. For AI, provenance runs in two directions, and free tools tend to erase it in both.

**Output provenance.** When a model hands you a paragraph, a figure, or a code snippet, it usually can't tell you — and doesn't actually know — which source shaped that answer: a public textbook, a paywalled article, a forum post, or in principle another user's earlier conversation. You're drinking from the pot with no ingredient list. That gap is exactly why [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) matters as its own topic — you can't cite what the model can't itself trace.

**Input provenance.** When you paste something into that same pot, you're not only risking your own information — you're making a rights decision on someone else's behalf. The lease belongs to your friend and their landlord. The contract belongs to your client and your employer. If you don't personally have the authority to say "this can go into a third party's system," pasting it isn't a shortcut. It's you making that call for people who never agreed to it.

For the fuller mechanics of how provenance and a specific provider's actual policy interact — retention windows, opt-outs, what "training" legally means in a terms-of-service document — see [data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy). This lesson builds the reflex; that one is the reference you check before you rely on a specific tool's promises.

## The wrong intuition: "it's a text box, not a person"

Here's the intuition almost everyone carries by default, and it costs people more than they realize: *a chat box feels private because there's no visible person on the other end.* You'd never fax a client's contract to a stranger, forward it to a random email address, or read it aloud in a crowded café. But pasting it into a free chatbot doesn't trip the same alarm, because the interface looks like a search bar or a notes app — a tool, not a channel to other people.

> The correction: if you'd hesitate to email a document to a stranger at that company, feel the same hesitation pasting it into that company's free product. Same company, same servers, same eventual set of humans and systems with access — just a friendlier-looking box in front of it.

The fix isn't "never use free AI tools." It's noticing that the interface hides the transaction; it doesn't remove it. A chat box with no visible recipient is still a form submission to a company's infrastructure. The friendliness of the UI tells you nothing about what happens after you hit enter — it was designed to feel effortless, not to signal risk accurately.

## When the analogy breaks — and the habit that survives it

Push the stew pot far enough and it misleads you in three specific ways worth knowing, because overcorrecting into fear is its own failure mode:

1. **Not every pot is communal.** Paid and enterprise tiers, and most API access with the training toggle off, work more like a private pot with your name on it and a lid — the provider commits in writing not to train on your input and often to delete it on a defined schedule. If that's your setup, a large share of the risk this lesson describes doesn't apply. The free tier and the paid tier of the exact same product can have genuinely different data terms, which is exactly why it's worth [comparing what you actually get](/learn/ai-literacy/free-vs-paid-ai-what-you-get) instead of assuming either way.
2. **Mixing isn't literal.** In a stew pot, your broth is physically diffused into the next person's bowl. Training isn't that — the model doesn't store your document and hand out excerpts of it. It's closer to your text nudging a statistical average inside an enormous batch, during a training run that might not happen for months, if ever. Verbatim leakage of one specific pasted document back out to a random stranger is a real but narrow failure mode, not the everyday one. The everyday risk is duller: stored logs, staff access, breach exposure, legal discovery — all of which follow from mere retention, with or without training ever touching your text.
3. **The pot doesn't know what it served you, and asking it won't fix that.** You can't recover provenance by asking the model "where did you get this?" — it will answer fluently and still not actually know. A confident-sounding source is not the same as a verified one.

None of that is a reason to fear the paste button. It's a habit, not paranoia: run one quick check before you hit enter, the same reflex you already have for email attachments and photocopies.

- **Whose is it?** If the honest answer is "my client's," "my employer's," or "someone who trusted me with this," you don't have unilateral rights to relocate it — even to a tool, even for a good reason.
- **What tier am I actually on?** Free consumer chat, or a paid setup with a stated no-training, limited-retention policy? Check the current terms for that specific plan rather than assuming — they differ, and they change.
- **Would I send this as a plain email to that company?** If the paste would feel like a bigger deal in email form, that feeling is accurate information, not overreaction.
- **Can I get most of the value with less exposure?** Strip names, swap real figures for placeholders, paste only the clause you have a question about, or describe the shape of the problem instead of handing over the document.

If any of those give you pause, that's the check doing its job. For the concrete list of what categories of data and documents this covers, see [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai); for the full mechanical life cycle of a request, see [what happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type). The goal was never to distrust every free tool — it's to make "whose is this, and where is it about to go" as automatic as looking both ways before you cross.

**Related:** Your data can be the price · [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) · [Where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) · [Free vs. paid AI: what you get](/learn/ai-literacy/free-vs-paid-ai-what-you-get) · [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) · [What happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type)
