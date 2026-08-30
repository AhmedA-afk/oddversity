---
title: "Asking Nicely vs a Physical Rail"
track: "structured-outputs"
status: live
summary: "Prompting is a suggested route the model can wander off; constrained decoding is a corridor it cannot physically leave."
duration: "5 min read"
---

Two ways to keep a model on format, and only one of them is actually a constraint.

## The analogy

Prompting a model to return valid JSON is giving someone driving directions: "take the highway, then exit at Main Street." A capable driver follows it almost every time. But nothing about the car, the road, or the laws of physics stops them from taking a different exit if something along the way seems more interesting — a strongly worded sign doesn't change what's physically reachable from the driver's seat.

Constrained decoding is a walled corridor. There's exactly one way through, and every other direction is a wall, not a suggestion. The person inside doesn't need to want to stay on the path — they can't leave it even if they try.

## Walking it step by step

Picture the same request handled both ways.

**Prompted:** "Respond only with JSON matching `{name, age}`, nothing else." The model generates its response token by token, free to pick anything at each step. Most of the time it complies, because the instruction is clear and the model is generally good at following clear instructions. But at every single step, the *option* to write `"Sure, here's the info:"` first, or to add a `note` field, or to wrap the object in a markdown fence, is still sitting right there in the probability distribution — sometimes ranked low, sometimes (with an unusual prompt, a long context, an adversarial input) ranked high enough to win.

**Constrained:** the same request, but now a grammar compiled from `{name, age}` is doing the sampling alongside the model. At the token right after `{`, the only legal continuations are the start of `"name"` or `"age"` (in whichever order the schema fixes) — every other token, including the start of "Sure" or a markdown backtick, has its logit forced to `-inf` before the model ever samples. See [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive) for exactly how that masking is computed. The model isn't choosing to comply here — compliance is the only reachable outcome.

## The wrong intuition to correct

The tempting shortcut is: "if I just word the prompt firmly enough — all caps, threats of failure, five examples of the exact format — that's basically as good as a real constraint." It isn't, and the reason is structural, not a matter of trying harder. No amount of wording changes which tokens are *reachable* at generation time; it only reshapes which ones are *likely*. A stern prompt lowers the odds of a violation. A rail removes the outcome from the space of possible outcomes. Under distribution shift, an unusual input, a very long context that dilutes the instruction, or just enough scale that a small per-request probability adds up — the "likely" side eventually loses, and it does so exactly when you're not watching for it.

The second wrong intuition, going the other way: assuming a physical rail means the content is now trustworthy. It doesn't. The corridor guarantees *shape*, not *destination* — see [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained) for exactly which parts of a schema the wall actually enforces, and which ones still need a check on the other side.

## When the analogy breaks

A walled corridor still has to lead somewhere real, and building one costs something. Three places the metaphor stops being clean:

- **Someone has to build the wall.** Constructing the rail means compiling a grammar from your schema and running it inside the decoding loop — which means you need access to that loop. A model reached purely through a hosted chat-completion endpoint with no logit access, or through a third party with no schema-constrained option, only ever gets you the suggested-route version, no matter how the prompt is worded. This is exactly the cost/access tradeoff covered in [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you).
- **A corridor can lead to a wrong room.** Masking guarantees the model reaches *a* valid destination, not the *correct* one. A schema-valid `{"customer_id": "99999999"}` is still a hallucinated ID if nothing checks it against reality — that's the job of [validation, not decoding](/learn/structured-outputs/the-validation-layer).
- **A narrow corridor can force a bad answer out the only door available.** If the rail is built too tight — forcing an answer field before there was room to reason, for instance — it can produce something technically valid and substantively wrong, which is the whole subject of [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction).

**Related:** [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive), [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees), [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet)
