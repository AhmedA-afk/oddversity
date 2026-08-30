---
title: "Why More Tokens Can Hurt"
track: "context-engineering"
status: live
summary: "Attention is a finite resource, so relevant-but-redundant tokens compete with the ones that actually matter."
duration: "6 min read"
---

If someone told you "adding more true, on-topic information made the answer worse," your first reaction is probably disbelief. The intuition behind context rot needs a better mental model than "more information, more good" — and there's a familiar situation that already teaches it.

## The analogy: a meeting with a fixed hour

A one-hour engineering standup with five blockers on the agenda has room for real discussion of each one — roughly twelve minutes apiece, enough to actually work through a decision. Now cram forty update items into the same hour. Every single item is still legitimate, on-topic, something someone genuinely needed to say. But now each one gets ninety seconds, and the five blockers that actually needed a decision get the same thin slice as the "FYI, deployed a config change" items.

The meeting didn't get more useful by adding agenda items. It got shallower per item. Nothing was removed — every topic still got its turn — but the depth of attention any one topic received shrank in proportion to how many other topics were competing for the same fixed hour.

A model's attention works the same way inside a fixed context window: it isn't a shelf that holds more the bigger it gets. It's a fixed budget that gets sliced thinner every time you add a candidate for it to consider.

## Walking it through

**Step 1.** Five items, one hour: roughly twelve minutes each. Every blocker gets a real discussion, decisions come out clearly. This is a small, focused context — a model given only the facts it needs behaves the same way, confidently locating and using each one.

**Step 2.** Add five more items, all genuinely relevant. Ten items, six minutes each. The original five aren't wrong or gone, but the depth applied to each one has already been cut in half. In a model, this is what happens when you add a second batch of on-topic retrieved documents: nothing in the first batch was removed, but the model's attention now has to be split across twice as many candidates.

**Step 3.** Add twenty more "FYI"-style items — real, related, but not decision-critical. Thirty items, two minutes each. Now even the items that need a real decision get skimmed. Something important sitting at position seventeen of thirty is easy to miss entirely — this is the same mechanism behind [lost in the middle](/learn/context-engineering/lost-in-the-middle), where position compounds the volume problem instead of being a separate issue.

**Step 4.** Someone proposes trimming the agenda back to the five items that actually need a decision. Discussion time per item jumps back up. Nothing important was lost by cutting — the twenty-five items that got removed weren't carrying decisions, they were carrying competition. The five that mattered actually get *more* attention with twenty-five fewer things around them, not less.

That last step is the counterintuitive part worth sitting with: removing content that is true and on-topic can *improve* the outcome, because what mattered was never whether the removed content was valid — it was whether it was competing for a shared, finite resource that the important content needed more of. This is the same logic behind [signal-to-noise in context](/learn/context-engineering/signal-to-noise-in-context): the question isn't "is this true," it's "does this earn its share of a limited budget."

## The wrong intuition this corrects

The natural assumption is: *the only danger is including something false or off-topic — if everything I add is true and relevant, more is strictly safe.* That's wrong, and the meeting analogy shows exactly why. Every item on the forty-item agenda was true and relevant. The damage came from volume, not validity. Three documents that all correctly describe the same refund policy, included together, don't triple your certainty about the policy — they triple the number of things competing for attention, without adding a single new fact. Cut two of the three duplicates and keep one, and the surviving fact usually gets *found and used* more reliably, not less, purely because it now has less to compete against. If you ran that as an ablation — ten total context chunks with three redundant copies of the same policy versus ten chunks with only one copy and two more genuinely different chunks in their place — the second version tends to come out ahead, and it's not because the redundant copies were wrong. They just weren't buying anything, and they were still costing attention.

## When the analogy breaks

The meeting has a moderator dividing time evenly and mechanically. A model's attention isn't divided that way — it's *learned*, and it's strongly biased toward the start and end of the context regardless of item count (see [lost in the middle](/learn/context-engineering/lost-in-the-middle) again). So doubling the number of items doesn't cut everyone's "airtime" exactly in half the way a real clock would; content at the edges keeps a disproportionate share, content in the middle loses more than its even split would suggest.

The analogy also implies pure competition with no upside to more speakers. That's not always true for a model: several sources that genuinely *agree* on the same answer can raise the model's confidence rather than just taking up space — a second, independent-looking confirmation is closer to corroboration than to competition. Whether a given addition acts like a distracting fortieth agenda item or a helpful second witness is task-dependent, and it's exactly why you measure it rather than assume it in either direction — see [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps).

Finally, a real meeting has no equivalent of triage before the meeting starts. A context pipeline does — filtering out the twenty "FYI" items before they ever reach the model, rather than including them and hoping attention sorts it out, is usually the highest-leverage fix available. See [Relevance Filtering](/learn/context-engineering/relevance-filtering) for how that triage actually gets built.

**Related:** [Context Rot Explained](/learn/context-engineering/context-rot-explained), [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [Signal-to-Noise in Context](/learn/context-engineering/signal-to-noise-in-context), [Relevance Filtering](/learn/context-engineering/relevance-filtering), [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps)
