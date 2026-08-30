---
title: "Narrow vs. General AI in Practice"
track: "ai-foundations"
status: live
summary: "A worked example that scores a warehouse route optimizer, a chess engine, and a 2026 frontier chat LLM on breadth, transfer, and autonomy — then breaks the LLM's autonomy score on "
duration: "16 min read"
---

"Narrow vs. general" gets taught as a light switch — flip it and you've got AGI. Put three real 2026 systems on the same three-axis scorecard and the switch turns into three separate dials, and the system that looks most "general" on paper turns out to have the shakiest dial of all.

If you haven't read [Narrow AI vs. General AI](/learn/ai-foundations/narrow-ai-vs-general-ai) yet, that page defines the spectrum. This one builds an actual instrument for measuring where a system sits on it, runs three real systems through it, and then — this is the part that matters — shows you exactly where the instrument lies to you.

## The setup

Three systems, all genuinely deployed in 2026, all "AI" by any reasonable definition:

1. **A warehouse route optimizer.** The kind of system that runs in fulfillment centers: given today's orders, the warehouse layout, and the current robot/truck fleet, it produces pick paths and delivery routes. Under the hood it's typically a constraint solver or metaheuristic — think Google's OR-Tools doing vehicle routing — searching over a graph for a low-cost path that satisfies capacity and deadline constraints. The objective function is hand-written by engineers. Nothing about it is learned in the machine-learning sense; the "intelligence" is search over a well-defined formalism.
2. **A chess engine.** Modern engines pair a search algorithm (alpha-beta or Monte Carlo tree search) with a neural network evaluation function trained through self-play — the same [reinforcement learning](/learn/ai-foundations/reinforcement-learning-basics) idea behind AlphaZero and its descendants. The engine has been superhuman for years. Its entire universe is a 8x8 board and a legal-move generator.
3. **A frontier chat LLM.** A 2026 GPT-5/Claude/Gemini-class transformer, pretrained on next-token prediction over a huge, broad text-and-code corpus — that pretraining is what makes it a [foundation model](/learn/ai-foundations/foundation-models-explained) — then instruction-tuned and RLHF'd into something that follows a chat turn. Input and output are both "any string," so the surface area of tasks it can attempt is enormous.

Here's the rubric we'll score all three on. Each axis runs 1 (fully narrow) to 5 (fully general):

| Axis | 1 — narrow | 5 — general |
|---|---|---|
| **Breadth of task** | Solves one fixed task in one fixed formalism | Handles open-ended, qualitatively different tasks with no re-architecture |
| **Transfer** | Every new instance needs re-solving or retraining from scratch | Competent zero-shot in domains it never explicitly saw |
| **Autonomy** | Produces a suggestion; a human decides and acts on it | Runs unsupervised for extended periods and verifies its own effects |

The numbers below are a teaching rubric I'm assigning, not a published benchmark — treat them as reasoned estimates you could argue with, not ground truth.

## Step by step

### Step 1: score the warehouse optimizer

- **Breadth = 2.** It solves routing, and with reformulation it can do adjacent problems (slotting, scheduling) — but it categorically cannot draft an email or explain a policy. It's narrow to "combinatorial optimization over logistics graphs."
- **Transfer = 2** across task types, but there's a subtlety worth sitting with: it transfers *within* its formalism extremely well. Feed it a brand-new warehouse layout and a different truck fleet, and the same solver handles it — because the mechanism is "solve whatever graph you're handed," and a new warehouse is just new input data, not a new task. That's real generalization, just bounded to one formalism.
- **Autonomy = 4.** Once deployed, it replans continuously as orders arrive and dispatches without a human approving each route. That's genuine unsupervised operation.

> **Why this step?** The transfer score is the one people get wrong first. "It only does routing" sounds narrow, and it is — but conflating "narrow task" with "can't generalize" is exactly the mistake this lesson exists to correct. The optimizer generalizes beautifully across *instances* of its one task. That's a different axis than generalizing across *task types*, and the rubric keeps them separate on purpose.

### Step 2: score the chess engine

- **Breadth = 1.** One game. Even Chess960 needs a different opening book, not a different task.
- **Transfer = 1.** The self-play process that produced superhuman chess doesn't transfer to Go, let alone to warehouse routing — a fresh network trained from scratch is needed for anything outside chess.
- **Autonomy = 5.** It plays an entire game, move to move, with zero human input, and it never needs to "check its work" against reality because the game state is the entire world it operates in.

> **Why this step?** Notice autonomy = 5 here, higher than the LLM will score below. That should feel odd — a system with almost no breadth beats one with enormous breadth on "acting independently." The reason is the closed formalism: chess has a complete, unambiguous state and a formally defined success criterion. Autonomy is cheap when the world you're autonomous *in* is fully specified. Keep that thought — it's the hinge the next section turns on.

### Step 3: score the frontier LLM

- **Breadth = 5.** Same weights, no retraining, and it drafts code, explains a proof, translates a contract, and writes a poem — the task is set entirely by the prompt.
- **Transfer = 4.** It routinely handles combinations of instructions nobody wrote a training example for. Not perfect — it's uneven, better on some novel combinations than others — but genuinely zero-shot competent in a way neither of the other two systems is.
- **Autonomy = 3** — a single chat turn produces a complete, multi-step answer without hand-holding, which looks like real autonomy. Hold onto that "3"; the next section is going to take it apart.

Put the three scorecards side by side:

```python
scorecard = {
    "warehouse_optimizer": {"breadth": 2, "transfer": 2, "autonomy": 4},
    "chess_engine":        {"breadth": 1, "transfer": 1, "autonomy": 5},
    "frontier_llm":        {"breadth": 5, "transfer": 4, "autonomy": 3},
}

def generality_index(scores):
    return sum(scores.values()) / len(scores)

for system, scores in scorecard.items():
    idx = generality_index(scores)
    print(f"{system:20s} B={scores['breadth']} T={scores['transfer']} "
          f"A={scores['autonomy']}  avg={idx:.2f}")
```

```
warehouse_optimizer  B=2 T=2 A=4  avg=2.67
chess_engine         B=1 T=1 A=5  avg=2.33
frontier_llm         B=5 T=4 A=3  avg=4.00
```

By this single number, the LLM is the most "general" system here — not by a little, either: nearly 50% higher than the optimizer, and the chess engine is a clear last. If you stopped right here, you'd conclude "general AI" basically means "the chat model," and the other two are relics of the narrow-AI era.

That conclusion is the trap. It's built entirely on one number, averaged from three axes that don't actually mean the same thing across systems — and the axis doing the most work to inflate the LLM's score, autonomy, is the one measured least honestly.

## Where it breaks

Take that autonomy = 3 and put it under load with the same warehouse scenario from Step 1. Suppose you wire the frontier LLM in as a dispatcher's assistant, chatting with drivers over a shift, tracking what's been dispatched where. A truck breaks down early in the shift; the LLM is told, and a substitute truck is rerouted to cover. Hours later, near the end of the conversation, a driver asks whether the original truck is still running its route.

The LLM has no database. Its only "memory" of the shift is whatever conversation history still fits in its context window — see [context window mechanics](/learn/llm-foundations/context-window-mechanics) and [tokens, context, and cost](/learn/ai-foundations/tokens-context-cost) for how that budget actually works. Simulate the budget getting tight over a long shift:

```python
CONTEXT_BUDGET_EVENTS = 4  # stand-in for a token budget, kept tiny to make the point visible

shift_log = []

def log_event(event):
    shift_log.append(event)
    context_window = shift_log[-CONTEXT_BUDGET_EVENTS:]  # only the tail survives
    return context_window

events = [
    "dispatch(truck_1, route_A)",
    "dispatch(truck_2, route_B)",
    "truck_1 breakdown reported",
    "reroute(truck_3, route_A)",
    "dispatch(truck_4, route_C)",
    "dispatch(truck_5, route_D)",
    "dispatch(truck_6, route_E)",
    "driver asks: is truck_1 still on route_A?",
]

window = None
for e in events:
    window = log_event(e)

print(window)
```

```
['dispatch(truck_4, route_C)', 'dispatch(truck_5, route_D)',
 'dispatch(truck_6, route_E)', 'driver asks: is truck_1 still on route_A?']
```

By the time the question arrives, the breakdown and the reroute have scrolled out of the window entirely. The model isn't wrong about truck_1 — it has *no information about truck_1 at all*. It will either guess, or pattern-match to "trucks that got dispatched stay on their route" and answer confidently and incorrectly, which is the same mechanism behind [why LLMs hallucinate](/learn/ai-foundations/why-llms-hallucinate): it's not lying, it's completing a plausible continuation from whatever context it actually has.

> **Why this step?** This is the exact failure mode the average score hid. The warehouse optimizer's autonomy = 4 comes from a system that *keeps real state* — the current position of every truck lives in a database it queries, not in a rolling window of recent chat. The LLM's autonomy = 3 came from watching it produce one good multi-step answer in one turn and assuming that skill extends across a shift. It doesn't, for a structural reason: a transformer call is stateless. Every response is derived fresh from whatever's in the prompt, and once something falls out of that prompt, it is gone, not "forgotten and recoverable" — gone. [What LLMs can and cannot do](/learn/ai-foundations/what-llms-can-and-cannot-do) covers this limit in general; here you're watching it actually cost you a truck.

The fix is not a bigger context window — that only raises the event count where the same failure recurs. The fix is to stop treating the model's context as its memory:

```python
# Give the model a real store to read and write, the same way the
# warehouse optimizer keeps state in a database instead of "remembering" it.

warehouse_state = {
    "truck_1": {"status": "broken_down", "route": None},
    "truck_3": {"status": "en_route", "route": "route_A"},
}

def query_truck(truck_id):
    return warehouse_state.get(truck_id, "unknown")

def apply_dispatch(truck_id, route):
    warehouse_state[truck_id] = {"status": "en_route", "route": route}
```

Wire the model up so it answers "is truck_1 still on route_A?" by calling `query_truck("truck_1")` instead of re-deriving an answer from a truncated chat log. This is the [agent](/learn/ai-foundations/ai-agents-vs-chatbots) pattern — an LLM plus tools plus external state plus a control loop — and it's worked through in more depth in the [agents vs. chatbots worked example](/learn/ai-foundations/agents-vs-chatbots-worked-example).

But look at what you actually built: an LLM that is now reliably autonomous *exactly* inside the schema someone hand-wrote (`truck_id`, `status`, `route` — nothing else exists). That's the warehouse optimizer's whole model of the world, just with a chat interface bolted onto it. The raw model's autonomy score was inflated because a single good turn looked like standing operation; the tool-wrapped version's autonomy is real, but it's real in a domain exactly as narrow as the system it's now sitting next to. None of this shows up on a leaderboard benchmark, which is part of why [what benchmarks miss](/learn/ai-foundations/benchmarks-and-what-they-miss) is worth reading before you trust a single generality number for anything.

## Takeaways

- **"General" is at least three numbers, not one.** Averaging them into a single index (as the code above does) is a useful gut-check but actively hides the thing you need to see: a system can be a 5 on one axis and a 2 on another, and those are different facts, not one blended fact.
- **Autonomy is cheap inside a closed formalism.** The chess engine's autonomy = 5 and the warehouse optimizer's autonomy = 4 both come from operating in a world with a complete, verifiable state. The LLM's raw autonomy score looked competitive only because one good turn was mistaken for standing operation — it wasn't measuring the same thing.
- **Breadth is the axis a demo shows you; autonomy and transfer are the axes production shows you.** The LLM's 5-4-3 looks dominant until the "3" gets stress-tested by anything longer than one turn.
- **Wrapping an LLM in tools doesn't make it general — it makes it narrow on purpose, deliberately, in a scope you chose.** That's not a criticism; it's the actual engineering move, and it's the same move the warehouse team already made when they wrote the optimizer's constraint model by hand.
- Next time something "feels general" because it handled an impressively broad prompt, ask which of the three axes that impression is actually about — breadth almost always, autonomy almost never, unless someone can show you the state it's tracking outside the conversation.

**Related:** [Narrow AI vs. General AI](/learn/ai-foundations/narrow-ai-vs-general-ai) · [What LLMs Can and Cannot Do](/learn/ai-foundations/what-llms-can-and-cannot-do) · [AI Agents vs. Chatbots](/learn/ai-foundations/ai-agents-vs-chatbots) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [Why LLMs Hallucinate](/learn/ai-foundations/why-llms-hallucinate) · [Benchmarks and What They Miss](/learn/ai-foundations/benchmarks-and-what-they-miss)
