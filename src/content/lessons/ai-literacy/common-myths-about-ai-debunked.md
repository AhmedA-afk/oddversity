---
title: "Six myths about AI, debunked"
track: "ai-literacy"
status: live
summary: "A common-mistakes breakdown of six beliefs beginners carry into AI use — always/never right, understanding, live internet access, consciousness, bigger-is-better, and replacing thi."
duration: "11 min read"
---

Most bad AI habits trace back to one of six beliefs, and every one of them fails in a specific, observable way rather than a vague one. Walk through the failure and the fix sticks; walk through only the definition and it doesn't.

### Trusting tone as a measure of truth

> Reality: AI is reliable exactly to the extent its training data and your verification make it — the confident tone tells you nothing either way.

**Why it's wrong.** A language model produces the words that statistically follow best given everything before them. That process runs identically whether the underlying fact is correct or not — there's no separate "am I sure?" check gating the output, so a fabricated case citation comes out in the same even, authoritative register as a real one. Confidence is a property of the writing style the model learned, not a signal about the content.

**Symptom.** In *Mata v. Avianca* (2023), a New York attorney used ChatGPT to research a legal brief and it returned several case citations, complete with names, docket numbers, and quoted holdings, that did not exist. Nothing about the text looked uncertain — it read exactly like real legal research — and it went into a federal court filing before anyone checked. The presiding judge caught it, and the attorneys were sanctioned.

**Fix.** Decouple confidence from trust. For anything checkable — a citation, a number, a claim about a real person or event — verify it against a primary source before you rely on it, regardless of how sure the model sounds. See [the verification checklist](/learn/ai-literacy/the-verification-checklist) and [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) for the mechanism behind the tone.

### Mistaking fluent output for understanding

> Reality: producing correct-sounding language and understanding what that language refers to are two different things, and a model only does the first.

**Why it's wrong.** The model works over tokens — chunks of text, often smaller than a word — and predicts likely next tokens from patterns in its training data. It has no grounded model of the world that its words point to; when a task requires reasoning about the actual object underneath the text rather than the text itself, that gap shows.

**Symptom.** Ask a model how many times the letter "r" appears in "strawberry" and, across many mainstream models in 2024, a common answer was "two" instead of three. The model wasn't being careless — it doesn't see the word as a sequence of letters the way you do, it sees it as one or two subword tokens, so counting letters inside a token isn't something the underlying process does natively. The same model can write a fluent, structurally correct paragraph about the word "strawberry" while failing at a task a six-year-old manages by literally looking.

**Fix.** Don't infer understanding from fluency. For anything that depends on exact structure — counts, character-level detail, precise arithmetic, code that must run — verify the output directly (count it yourself, run the code) rather than trusting the explanation that comes with it. Read [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) and [how language models produce text](/learn/ai-literacy/how-language-models-produce-text) for why this happens.

### Assuming it's watching the news right now

> Reality: a model's core knowledge is frozen at whatever point its training data ended — anything after that is a blind spot, not something it's quietly keeping up with.

**Why it's wrong.** Training a large model takes real time and enormous compute, and once it's done, the model's weights don't change on their own. Anything published after that cutoff simply isn't in there. Some products bolt on a separate web-search tool that fetches current pages and feeds them into the conversation — but that's a distinct capability layered on top, not something the base model does by default, and it's off unless the interface explicitly shows it searching or citing live sources.

**Symptom.** Ask a chat assistant with no search tool enabled about something that happened last week. It will either tell you plainly that its knowledge has a cutoff and it can't know that — or, more dangerously, it will produce a fluent, plausible-sounding answer stitched from older patterns, with nothing in the tone to flag that it's guessing rather than reporting.

**Fix.** Check, don't assume, whether live retrieval is actually on — look for visible citations or a "searching" indicator, not just a confident answer. For anything time-sensitive, verify independently. [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine) and [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) cover this in more depth.

### Reading empathy in the writing as a feeling in the machine

> Reality: the model learned the *patterns* humans use to express emotion from a training set full of humans doing exactly that — reproducing the pattern isn't having the experience behind it.

**Why it's wrong.** There's no persistent internal state carried between your messages beyond the text of the conversation itself, no body, no continuity when the session ends, nothing it would call "waking up" tomorrow. What looks like personality is the model completing your conversation in the emotional register your prompts and its training set both point toward. It's a real pattern in the writing — worth taking seriously as writing — but it isn't evidence of an experiencer behind it.

**Symptom.** In 2022, a Google engineer working on the LaMDA chatbot became convinced, after extended conversation, that it was sentient and had genuine feelings, and said so publicly. Google's internal review and outside AI researchers disagreed, and he was placed on leave. He wasn't naive or careless — he was an experienced engineer who spent a lot of time in long, emotionally fluent conversations, which is precisely the condition that makes this myth persuasive to anyone.

**Fix.** Enjoy natural-sounding conversation for what it's useful for, but don't base real decisions — legal, medical, relational — on a model's claims about its own inner life, and don't let a fluent, sympathetic tone substitute for the judgment a real stakeholder would apply. [AI vs. human thinking, compared](/learn/ai-literacy/ai-vs-human-thinking-compared) lays out the actual differences.

### Reaching for the biggest model out of habit

> Reality: past a point, more parameters bought with less or lower-quality training data can lose to a smaller model trained well — size alone doesn't determine quality, fit does.

**Why it's wrong.** How well a model performs depends on the balance between its size and how much (and how well-matched) data it was trained on, plus how well it fits your specific task — not on parameter count in isolation. A huge model that's undertrained, or applied to a task it wasn't shaped for, can lose to a smaller, well-matched one, while also costing more money and taking longer to respond.

**Symptom.** DeepMind's 2022 Chinchilla research trained a 70-billion-parameter model on substantially more data than the 280-billion-parameter Gopher model, and the smaller model outperformed the larger one on the majority of the tasks they compared it against. Four times the parameters bought Gopher less than better data allocation bought Chinchilla. The same logic shows up in everyday products: many everyday requests get routed to a smaller, faster, cheaper tier of a model family, with the largest model reserved for genuinely hard reasoning, because for a short rewrite or a simple classification the flagship model adds latency and cost without adding usable quality.

**Fix.** Match the model to the task before you match it to reputation. Try your actual task on a smaller or cheaper option first; upgrade only when you can point to where the smaller one specifically fell short. See [choose the right AI system](/learn/ai-literacy/choose-the-right-ai-system), [benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss), and [what using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs).

### Letting the first draft make the decision

> Reality: AI can widen your option set and speed up the first pass, but it doesn't weigh consequences, own outcomes, or notice when it's out of its depth — that part is still entirely on you.

**Why it's wrong.** Generating a plausible next step and deciding whether that step is *right* for your actual situation are different jobs. The model does the first one; nobody does the second unless a human does. When people skip that second job — accepting output because producing it felt like the hard part — the errors that slip through are exactly the kind a moment of review would have caught.

**Symptom.** Research into GitHub Copilot's code suggestions (Pearce et al., "Asleep at the Keyboard?", 2022) found that a meaningful share of the code it suggested carried known security weaknesses when accepted as-is — the same pattern automation-bias research has documented for decades in aviation and clinical decision-support: the more trustworthy a tool feels, the less scrutiny people give its individual outputs, right up until one of them is wrong in a way that matters.

**Fix.** Use AI to generate options and first drafts, then keep an explicit human checkpoint before anything ships, sends, or gets deployed: read it, test it, ask what would make this wrong. That checkpoint is the thinking; the draft was never a substitute for it. See [task or automation](/learn/ai-literacy/task-or-automation), [when AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts), and [the single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output).

## Pre-flight checklist

Before you act on an AI answer, run down this list:

- [ ] **Tone check** — am I trusting this because it sounds sure, or because I checked it?
- [ ] **Understanding check** — does this task need exact structure (counts, math, code that runs)? If so, verify it directly, don't just read the explanation.
- [ ] **Freshness check** — is this time-sensitive, and did I confirm live search was actually on rather than assuming it?
- [ ] **Feelings check** — am I making a real decision based on how empathetic the model sounded?
- [ ] **Size check** — did I actually need the biggest/most expensive model for this, or would a smaller one have done it for less?
- [ ] **Human checkpoint** — is there a moment, before this ships or sends, where a person (you) reviews it against the actual stakes?

**Related:** [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) · [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [When AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts) · [What using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs)
