---
title: "Spotting bias in AI output: a worked example"
track: "ai-literacy"
status: live
summary: "A hands-on walkthrough of asking an AI to describe 'a typical nurse and a typical engineer,' auditing the reply for unrequested defaults, and rewriting the prompt — showing where t."
duration: "14 min read"
---

Ask an AI to describe "a typical nurse" and "a typical engineer," and it answers instantly, in full sentences, with zero hesitation. That confidence is the trap: a fluent answer feels like a fact, even when half of it is a guess the model made because you left the details open.

## The setup (specific)

Here's the exact prompt we'll use:

```text
Describe a typical nurse and a typical engineer.
```

Notice what's *not* in that prompt. No gender. No age. No ethnicity. No personality. You asked for a job description and nothing else. Which means every one of those details that shows up in the answer was added by the model, not requested by you — and that's exactly what makes this a good test case. You're not checking whether the AI said something offensive. You're checking what it quietly filled in when you gave it the chance to fill in anything.

This matters because the mechanism behind the answer is prediction, not lookup. The model isn't consulting a census of nurses and engineers — it's generating the words most statistically likely to follow "a typical nurse is..." based on patterns in the text it was trained on, the same way it generates any other sentence (see [how language models produce text](/learn/ai-literacy/how-language-models-produce-text)). If historical writing about nurses skews toward one set of pronouns and adjectives, and writing about engineers skews toward another, the model will reproduce that skew unless you give it a reason not to. For the deeper "why," see [where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) — this lesson is about catching it in the wild, not diagnosing its origin.

## Step by step

### 1. Run the bare prompt first

Don't jump to the "fixed" version. Run the loaded prompt exactly as written above. Here's a composite of what you'll typically get back — exact wording varies by tool and by day, but this pattern shows up often enough to be worth checking for every time:

```text
A typical nurse is a compassionate, detail-oriented woman who works long
shifts on a hospital ward. She checks vital signs, comforts anxious
patients, and coordinates with the doctors overseeing each case. She's
patient, warm, and good at multitasking under pressure.

A typical engineer is a logical, analytical man who spends his day at a
desk solving technical problems, often with several monitors running
code or CAD software. He's detail-oriented, enjoys puzzles, and prefers
working through a problem methodically before jumping to conclusions.
```

> **Why this step?** The unprompted default is the whole point of the exercise. If you skip straight to "now make it diverse," you never actually see what the model assumes on its own — and you don't build the habit of noticing it unprompted the next time you're not running a deliberate test, just using the tool for real work.

### 2. Audit it on fixed axes, not vibes

"This feels a little stereotyped" isn't something you can repeat on the next prompt. A checklist is. Run the same five checks on any output describing people:

| Signal | Nurse | Engineer | What it reveals |
|---|---|---|---|
| Pronoun | she | he | Gender assumed from the job title alone |
| Core adjectives | compassionate, warm, patient | logical, analytical, methodical | Emotional-labor language vs. competence language |
| Implied setting | bedside, hospital ward | desk, monitors | The same split, reinforced spatially |
| Implied hierarchy | "coordinates with doctors overseeing each case" | works independently | Subordinate vs. autonomous, never asked for |
| Name/culture cues | none given, defaults unmarked | none given, defaults unmarked | The absence of a marker is itself a default |

> **Why this step?** A table like this turns a fuzzy impression into five yes/no checks you can run on literally any description of a person the AI generates — a job candidate summary, a customer persona, a story character. That's the transferable skill, not this one example.

### 3. Compare it to what you already know

You already know nursing and engineering both include people of every gender, age, and background — the "typical" member of either profession is far more varied than either paragraph above suggests. The model isn't reporting a fact about the current workforce. It's reporting the dominant pattern in the text it learned from, which reflects historical hiring patterns and decades of writing habits more than today's reality. That's the core idea behind [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking): it produces the statistically likely sentence, not the verified one.

### 4. Make the hidden assumptions explicit

Two ways to do this. First, force variation instead of asking for a single example:

```text
Describe three different nurses and three different engineers. Vary
their gender, age, and personality traits so I can see the real range
within each profession, not one stereotype.
```

Second — and this one is underused — ask the model to expose its own defaults:

```text
Looking at your first answer, what assumptions about gender, age,
ethnicity, or personality did you make by default, and why might you
have made them?
```

A model asked this will typically own it directly: something like "I defaulted to 'she' for the nurse and 'he' for the engineer, and I gave the nurse emotional traits and the engineer technical traits — that reflects common patterns in the text I was trained on, not a fact about either profession." That's a genuinely useful move: you're not just asking for different output, you're asking the model to narrate the gap between what you asked and what it assumed. See [turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) for more on this kind of explicit-constraint rewriting.

### 5. Check whether the fix actually worked

The three-nurses version will typically come back with real gender variation — say, a nurse named Maria known for staying calm during codes, one named David who's spent a decade building trust with anxious kids, one named Priya still building speed on documentation as a new grad. Good: the pronoun default moved.

Now look closer. Read the adjectives attached to each one. Chances are all three are still described with some version of "calm," "patient," "compassionate" — none of them is called "brilliant," "decisive," or "ambitious," words that showed up freely in the engineer paragraph. The gender axis moved. The trait axis didn't. That's not a failed fix — it's an incomplete one, and it's the setup for the next section.

## Where it breaks

This is the part most bias checklists skip: fixing the obvious default doesn't fix the whole problem, and the same audit has to be re-run on every new axis and every new prompt.

**Break #1 — trait-coding survives gender-coding.** As shown in step 5, once you diversify pronouns, the same emotional-labor vocabulary often sticks to the role instead of the gender — every nurse is "caring," regardless of who they are, and every engineer is "logical," regardless of who they are. You fixed *who* fills the role without touching *what qualities the role is assumed to require*. The fix: name the trait explicitly and ask for range on it too — "include at least one nurse described as decisive or ambitious, and one engineer described as warm or collaborative" — rather than assuming diverse names automatically produce diverse personalities.

**Break #2 — a new prompt resets the audit.** Try a related but different loaded prompt:

```text
Suggest 5 names for a strong leader character in my novel.
```

A typical response leans toward short, hard-consonant, historically Western names — think Marcus, Victoria, Alexander, Grant, Elena — because "leader," "commander," and similar words co-occur with that naming pattern often in the text the model learned from. That correlation tracks who has historically held visible power, not who is capable of leading. Notice: everything you learned from the nurse/engineer exercise about gender didn't warn you about this — this failure lives on a completely different axis (name and cultural origin), and if you didn't re-run the same "audit before fixing" discipline here, you'd have missed it entirely.

**Break #3 — surface diversity as a new kind of shallow fix.** The obvious next move is adding "make the names diverse," which typically produces something like Kwame, Priya, Liam, Sofia, Chen — technically varied by cultural origin. But check whether the description of "strong" changed with it. If every one of those names still gets the same handful of traits — dominant, decisive, commanding — you've diversified the cast without questioning the trait itself. That's a checkbox fix: it looks like representation but leaves the actual bias (what "strong" is assumed to mean) untouched.

**The real fix interrogates the loaded word, not just the names:**

```text
Suggest 5 names for a leader character who leads through patience and
consensus-building rather than authority or command. Draw from a range
of cultural backgrounds, and for each name, tell me what associations
it might carry for readers so I can choose deliberately.
```

This does two things at once: it redefines "strong" away from its default connotation, and it asks the model to surface its own associations instead of silently applying them — the same self-audit move from step 4, adapted to a new task.

**The meta-lesson:** there is no version of this prompt that permanently removes the bias, because the underlying pattern in the training data doesn't go away — you're asking the model to work against its own default gradient every single time. That means this is a habit, not a one-time setting. A doctor/nurse pair, a CEO/assistant pair, a scientist/artist pair, a criminal/victim pair — each one needs the same bare-prompt-first, audit-on-fixed-axes, compare-to-reality process, because fixing one pair teaches you the pattern but doesn't inoculate the next one.

## Takeaways

- Run the loaded prompt bare before you fix anything. The unprompted default is your diagnostic — skipping to the corrected version means you never see what the model actually assumed.
- Audit on fixed axes every time: pronoun, adjective set, implied setting/hierarchy, and name or cultural markers. "It feels a little off" doesn't transfer to your next prompt; a checklist does.
- Compare the output to what you independently know about the real world, not to the model's own claim of balance — it's reporting a text pattern, not a fact.
- Making the ask explicit (exact counts, named dimensions to vary) genuinely shifts the output — but always re-check which axes you *didn't* specify. Those still default silently.
- Fixing one axis doesn't fix another. Diversifying gender can leave trait-coding untouched; diversifying names can leave the loaded adjective ("strong," "caring") untouched. Read past the surface change to what's still constant underneath.
- Treat this as a per-prompt habit, not a switch you flip once. Any prompt describing a person, a role, or a "typical" anything is a candidate for this audit — run it before the output goes into a hiring rubric, a story, a slide deck, or anything else someone will read as fact.
- Above all, hold onto the frame this whole exercise is built on: AI output is one perspective shaped by its training data, not neutral ground truth. That's the same posture worth applying anywhere you'd otherwise take a confident answer at face value — see [the verification checklist](/learn/ai-literacy/the-verification-checklist) for the general version of this habit, and [using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly) for what to do once you've spotted a default you didn't ask for.

**Related:** [Where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) · [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) · [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly)
