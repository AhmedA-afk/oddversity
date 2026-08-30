---
title: "What happens to what you type into AI"
track: "ai-literacy"
status: live
summary: "A concept lesson explaining the real pipeline your words follow when you type into an AI tool — server, storage, possible human review, possible training use — and why free consume."
duration: "9 min read"
---

You paste your symptoms into a free chatbot at 2 a.m. because it's faster than waiting for a doctor, or you drop a client's draft contract into an AI tool to get a quick summary before a call. In both cases, the moment you hit enter, that text stops being only yours — and knowing exactly where it goes is the difference between using AI safely and finding out the hard way.

## What it is

When you type something into an AI tool — a chatbot, a coding assistant, a "summarize this" box built into some app — that text leaves your device and travels to a server owned by whichever company built the tool. That's not a shortcut or an accident; it's structural. Today's capable AI models are too large to run on your phone or laptop, so the company runs them on its own machines, and your words have to get there to be processed at all. That's true even for AI features that feel local, like one built into your email client or your IDE.

From there, four things can happen to your text, and which ones actually happen depends entirely on the product and the tier you're using:

1. It's transmitted to the company's servers (this part is universal).
2. It's stored, at least temporarily — in logs, in your account's chat history, sometimes for years.
3. It may be read by a human — not because someone is watching you personally, but because safety teams sample conversations to catch abuse, and quality teams sample conversations to see where the model does badly.
4. It may be used as training data — folded into the dataset used to fine-tune or build a future version of the model, so that patterns in what you wrote (usually not your literal words, but the patterns in them) shape how the model responds to other people later.

None of these four is universal law. What determines them is the product's terms of service and privacy policy — a document that genuinely differs from product to product, and often differs between the free and paid version of the *same* product. That's the fact this whole lesson turns on: AI isn't one privacy regime. It's dozens of different companies, each writing their own rules about your text, and you agree to those rules — usually without reading them — the moment you hit enter.

## The mental model

Don't picture the text box as a diary you're writing in. Picture it as a form you're handing across a counter to a company employee. The trip your words take looks like this:

```text
You type something
        |
        v
It reaches the company's servers      <- always true; this is how the service runs
        |
        v
It gets stored / logged                <- true almost everywhere, at least short-term
        |
        v
Is it read by a human?                 <- sometimes: safety review, abuse checks, quality sampling
        |
        v
Is it used to train future models?     <- depends entirely on the product and your settings
```

The first two stops are close to unavoidable — they're just what "sending a message to a hosted AI service" means. The last two stops are policy choices, not technical necessities, and they're exactly where "free tool" and "paid tool" tend to diverge (more in [Free vs. paid AI: what you actually get](/learn/ai-literacy/free-vs-paid-ai-what-you-get)).

A useful rule of thumb, borrowed from how you'd treat a real form at a real counter: assume anything you type could be read by an employee of that company, stored indefinitely, and reused — unless the specific product you're using tells you otherwise in writing. That's not paranoia, it's just reading the form before you sign it. See [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) for how to actually go find that "in writing" part for a tool you use.

## Why it works this way

None of this is arbitrary — each stop on that pipeline exists for a reason, and the reason tells you when to worry and when not to.

- **It has to reach their servers** because the model is the product. A company that trains and hosts a capable model has sunk enormous cost into it; letting it run only on your device would mean giving that asset away. So your text goes to them, gets processed on their hardware, and the answer comes back to you.
- **It gets stored** for mostly boring operational reasons: so you can scroll back through your own chat history, so the company can debug a bug you reported, so they can investigate abuse, and in some jurisdictions, because certain records are legally required to be retained for a period.
- **It sometimes gets read by a human** because automated safety filters aren't good enough alone. Companies run trust-and-safety and quality-review teams who sample real conversations — usually a small, often anonymized slice — to catch things the model got dangerously wrong or that slipped past automated moderation.
- **It sometimes trains future models** because that's often literally how a free product pays for itself. If you're not paying with money, real conversations are frequently part of what you're paying with — they're a valuable, hard-to-manufacture resource for building the next version of the model. It's the same logic that runs most of the free internet, just applied to a chat box instead of a newsfeed (see [Your data can be the price](/learn/ai-literacy/your-data-can-be-the-price)).

Paid, business, and enterprise tiers exist partly *because* companies buying AI tools for their employees need to say no to that last point — client confidentiality, trade secrets, or regulatory obligations make "your data might train future models" a dealbreaker. So the same company that trains on free-tier conversations will often sign a contract promising the opposite to its paying business customers: no training on inputs, a defined and usually short retention window, sometimes even "zero data retention" as an explicit contract term. That's not generosity — it's the product business customers are actually willing to pay for.

## A concrete example

Take the two images from the top of this lesson and walk them through the pipeline.

**Person A, free tier:** pastes their full medical history — medication list, a recent diagnosis, a family history of a condition — into a free consumer chatbot to ask "what questions should I bring to my next appointment?" That text reaches the company's servers, gets logged in their chat history and the company's backend, is a candidate for human review if anything trips a safety filter, and — unless this specific product has an opt-out toggle for training in its settings and Person A found and used it — is a candidate to be folded into a future training run. A year later none of that exact text is likely to resurface verbatim to a stranger, but the *pattern* — this is what a person describing this condition sounds like — has become part of what shaped a later model.

**Person B, paid business tier:** pastes a client's draft contract into the business version of the same company's tool, under an account their employer set up with an enterprise agreement, to get a plain-language summary before a call. The first hop looks identical — it still reaches the company's servers, because that's how the service works. But the contract attached to the business tier typically says: not used for training, retained only for a stated window, and often excluded from routine human review outside narrow abuse investigation. Same company, same underlying model, same first stop — a genuinely different fate for the text after that, because a different piece of paper governs it.

The lesson isn't "free tools are unsafe and paid tools are safe." It's that the tier and the specific policy attached to your account determine the answer — not the fact that "it's AI."

## Where it shows up

This isn't limited to the obvious chatbot window. The same pipeline runs whenever you type into anything with an AI feature behind it:

- A customer-support widget that drafts your complaint before you send it.
- A coding assistant you paste proprietary source code or an API key into.
- A meeting-notes tool that transcribes and summarizes a call, confidential business details included.
- A resume- or cover-letter-writing tool you feed your full work history and personal details into.
- A browser extension with an AI sidebar that reads whatever page you're on — including an open banking tab or your inbox.
- An AI bot bolted onto your company's Slack or Teams, which may or may not actually be covered by your employer's data agreement with that vendor.

In every one of these, the same four-stop pipeline from the mental model applies — you're just less likely to notice it because it doesn't look like "typing into a chatbot."

## Watch out for

- **A private browser window doesn't lock down the server.** Incognito mode only stops your device from keeping a local record. It does nothing to the copy that already reached the company's servers the moment you hit enter — that copy follows the company's policy, not your browser settings.
- **"My company has an enterprise agreement" doesn't cover you if you used the free version.** An employee who opens the free, personal version of a chatbot on a work laptop — because it's already logged in, or because a paid seat wasn't provisioned yet — sits fully outside whatever contract their employer negotiated. The protection lives on the account and tier, not on the device or the employer.
- **"Not used for training" isn't the same promise as "not stored" or "never seen by a human."** These are three separate settings a privacy policy can mix and match, and a product can honestly say yes to one and no to the other two. A "temporary chat" that isn't saved to your history can still be logged briefly for abuse detection. Read for the specific claim, not the general vibe of the paragraph — the same habit covered in [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) applies here too.

## Where next

The practical question this sets up is simple: given all of that, what should you actually avoid typing, and how do you check a specific tool's real policy before you trust it with something sensitive? [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) turns this into a concrete checklist, and [Your data can be the price](/learn/ai-literacy/your-data-can-be-the-price) goes deeper on the trade you're actually making every time you use a free tier.

**Related:** [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) · [Free vs. paid AI: what you actually get](/learn/ai-literacy/free-vs-paid-ai-what-you-get) · [Your data can be the price](/learn/ai-literacy/your-data-can-be-the-price) · [What not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai) · [Using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly)
