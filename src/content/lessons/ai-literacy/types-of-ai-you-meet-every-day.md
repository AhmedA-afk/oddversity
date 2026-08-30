---
title: "The kinds of AI you already use"
track: "ai-literacy"
status: live
summary: "A guided tour of the six kinds of AI a non-technical person runs into daily — chatbots, image generators, recommendation feeds, autocomplete/spam filters, voice assistants, and nav."
duration: "11 min read"
---

You already use AI a dozen times before lunch. The feed that greets you, the route your map picks, the word your keyboard finishes for you, the email that never made it to your inbox — all of it. "AI" is doing a lot of work as a label, because it covers systems that don't work alike, don't fail alike, and don't deserve the same amount of trust.

Here's the fast version, before the detail: what each one predicts, and what it predicts it from.

| Type | Predicts | From |
|---|---|---|
| Chatbots / assistants | The next word in a reply | Your prompt + patterns in huge amounts of text |
| Image generators | Pixels matching a description | Your prompt + patterns in image-caption pairs |
| Recommendation feeds | What you'll click or watch next | Your past behavior + similar users' behavior |
| Autocomplete / spam filters | Your next word / "is this unwanted?" | Your typing habits / labeled examples of spam |
| Voice assistants | What you meant to ask | Your speech, matched to a fixed set of commands |
| Navigation | Fastest route and ETA | Live + historical traffic and road data |

> Every row in that table is "find a pattern in data, predict the next likely thing." That's the one trick "AI" actually means. This track focuses specifically on the first row — chatbots and assistants built on language models — because that's the kind you type a real question into and can most easily mistake for something it isn't. If you want the full "what is this trick, really" answer before going further, [what AI actually is](/learn/ai-literacy/what-ai-actually-is) covers it directly.

Below is each type on its own terms: how it works, when it earns its keep, how it breaks, and roughly what it costs to run.

## Chatbots and assistants (ChatGPT, Claude, Gemini)

**How it works:** given everything typed so far, it predicts the most probable next word, one at a time, trained on a huge cross-section of text. There's no lookup happening — it's [pattern prediction, not retrieval](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking), and the mechanics of how that produces coherent paragraphs are worth understanding on their own — see [how language models produce text](/learn/ai-literacy/how-language-models-produce-text).

**When it wins:** open-ended tasks where you can read the output and judge it — drafting, explaining, rephrasing, brainstorming, turning messy notes into structure. Anything where "roughly right, then you edit" beats "blank page."

**Failure mode:** it will state something false with the exact same confident tone as something true, because fluent and correct are two different properties and it's only directly optimizing for the first. This is the hallucination problem, and it's the reason verification is its own skill, not an afterthought.

**Relative cost:** highest in this list. A large model runs live, end to end, for every single message you send. Free tiers exist but are usually rate-limited or quietly running a smaller model than the paid tier.

## Image generators (Midjourney, DALL-E, Stable Diffusion)

**How it works:** the same trick as a chatbot, aimed at pixels instead of words — predict an image that matches a text description, trained on enormous sets of image-caption pairs.

**When it wins:** fast visual drafts, style exploration, concept art, mockups — anywhere "close enough to react to" is the actual goal, not a final asset.

**Failure mode:** it struggles with anything that requires exact counting or exact reproduction — hands, text rendered inside the image, a specific real person's face, a company's actual logo. It's generating something plausible-looking, not retrieving something real, which is the same root failure as a chatbot's hallucination, just visible instead of textual.

**Relative cost:** priced per image or per generation credit in most tools; higher resolution and more refinement passes cost more. Heavier per-request compute than text, since it's iterating over a whole image rather than one token at a time.

## Recommendation feeds (Netflix, TikTok, Spotify, YouTube)

**How it works:** predicts what you're likely to watch, click, or listen to next, based on your history and the history of people whose behavior has looked like yours before.

**When it wins:** catalogs too large to browse yourself. Genuinely good at surfacing one thing you'd probably like out of thousands you'd never scroll to.

**Failure mode:** it's optimizing for engagement, not for what's good for you, and those two things quietly diverge. Feedback loops narrow what you're shown over time, and whatever reliably gets a reaction — including outrage — gets reinforced. This is worth connecting to [where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) and to the more general [garbage-in-garbage-out data loop](/learn/ai-literacy/garbage-in-garbage-out-the-data-loop): the feed is trained on what you already did, so it keeps giving you more of what you already did.

**Relative cost:** cheap at scale relative to anything generative — mostly scoring against a precomputed index rather than generating fresh content per request. Bundled free into a product you're already paying for.

## Autocomplete and spam filters

**How it works:** two different jobs wearing the same shirt. Autocomplete predicts your next word or phrase from your typing habits and common patterns. A spam filter predicts the probability a message is unwanted, from patterns in its words, sender, and structure compared against previously labeled spam.

**When it wins:** narrow, well-defined predictions with a mountain of historical examples to learn from. This is the type of AI that has quietly worked well for over a decade — well before "AI" became the word everyone reached for.

**Failure mode:** autocomplete nudges you toward the generic, predictable phrasing rather than what you actually meant to say. Spam filters occasionally bury something legitimate that resembles spam structurally (a newsletter, an email packed with links) and occasionally let through spam crafted specifically to dodge the pattern it learned.

**Relative cost:** very cheap. Often small enough to run on-device, no data center round trip required.

## Voice assistants (Siri, Alexa, Google Assistant)

**How it works:** predicts what you meant to ask — turning your speech into text, then that text into one of a fixed set of intents — and hands the result to a narrower system underneath: a timer, a search, a smart-home command.

**When it wins:** short, structured requests from a small universe of possible answers. Set a timer, play a song, turn off a light — cases where "probably what you meant" is easy to get right.

**Failure mode:** falls apart fast on anything open-ended, because under the voice layer it's usually not a full conversational model — it's matching your intent against a fixed menu of things it knows how to do, and off-menu requests get a shrug or a web search read aloud.

**Relative cost:** low per interaction, bundled into a device or subscription you already own. The speech-to-text step adds some overhead, but nowhere near a full chatbot conversation's cost.

## Navigation (Google Maps, Waze)

**How it works:** predicts the fastest route and your arrival time from live and historical traffic, the road network, and the positions of other users currently on it.

**When it wins:** getting from A to B, which is about as checkable an objective as AI ever gets — you find out within the hour whether it was right.

**Failure mode:** garbage in, garbage out, applied to roads: a closure that hasn't been reported yet, a one-way street mapped wrong, a "shortcut" that's technically faster but cuts through a residential street it shouldn't. Same underlying lesson as the feed above — the prediction is only as current as the data feeding it.

**Relative cost:** low — continuous background computation, free as part of an app you already have installed.

## Decision table

Use this the next time you're not sure whether to trust something an AI system just told you, or whether reaching for one is even the right move.

| Approach | Best when | Avoid when | Cost |
|---|---|---|---|
| Chatbots / assistants | The task is open-ended and you can verify the answer yourself | You need a guaranteed-current fact and can't check it | High — full model runs per message |
| Image generators | You need a fast visual draft, not a final exact asset | You need exact text, exact counts, or a real specific likeness | Medium-high — per image/credit |
| Recommendation feeds | You're choosing from a catalog too big to browse | You want to see the full range of options, not just what's "safe" for you | Low — scoring, not generating |
| Autocomplete / spam filters | The prediction space is narrow and well-labeled | The message is unusual enough to sit outside its training patterns | Very low — lightweight, often on-device |
| Voice assistants | The request is short and structured | The request is open-ended or ambiguous | Low — bundled with device/service |
| Navigation | You have a clear A-to-B objective | Underlying map/traffic data is stale or sparse for your area | Low — continuous background compute |

## How to choose

When you're not sure what kind of AI you're actually looking at, or how much to trust it, run this in order:

1. **Name what it's predicting.** Not "is this AI good," but literally: next word, next click, fastest route, spam or not? That single question tells you what it can and can't be right about.
2. **Name what it's predicting from.** Your own history, everyone's aggregate behavior, or a snapshot of text/images from training time? Data that's stale, narrow, or not about you specifically is where it goes wrong.
3. **Check if you can verify the output cheaply.** Navigation and spam filters self-verify almost instantly — you find out within minutes. A chatbot's factual claim or an image's realism does not self-verify; that's on you, and it's the whole subject of [judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output).
4. **Match the stakes to the failure mode above.** A wrong song suggestion costs nothing. A hallucinated fact in something you publish costs your credibility. Same underlying trick, very different consequences.
5. **If it's the text-and-chat kind, treat it as a fast, well-read intern, not an oracle.** That's the specific mental model the rest of this track builds on.

**Related:** [what AI can and can't do](/learn/ai-literacy/what-ai-can-and-cant-do-overview) · [choosing the right AI system](/learn/ai-literacy/choose-the-right-ai-system) · [matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) · [what using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs)
