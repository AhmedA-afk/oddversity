---
title: "Learning From Reward in a 4x4 Grid"
track: "ai-foundations"
status: live
summary: "A worked example that runs a Q-learning agent through two literal episodes on a 4x4 gridworld with a +1 goal and a -1 pit, hand-verifying every table update, making epsilon-greedy "
duration: "14 min read"
---

[reinforcement-learning-basics](/learn/ai-foundations/reinforcement-learning-basics) gives you the vocabulary — state, action, reward, policy. This page runs the loop by hand: two real episodes on a 4x4 grid, one real mistake, one real success, and the one number in a table that actually changes each time.

## The setup

Sixteen cells, addressed as `(row, col)` with `(0, 0)` at the top left:

```text
S  .  .  .
.  P  .  .
.  .  .  .
.  .  .  G
```

- **Start** `S = (0, 0)`.
- **Goal** `G = (3, 3)`: entering it ends the episode with reward `+1`.
- **Pit** `P = (1, 1)`: entering it ends the episode with reward `-1`.
- Every other move: reward `0`. Walking into a wall just keeps you in place (no penalty, no move wasted).
- Four actions per step: `up`, `down`, `left`, `right`. The environment is deterministic — the only randomness in this whole page is in how the agent *chooses* an action, never in what happens once it picks one.

The thing you're actually training is a table called `Q`, with one entry per (state, action) pair — 16 states × 4 actions = 64 numbers, all starting at `0.0`. `Q(s, a)` is the agent's current guess at "if I take action `a` from state `s`, and act well from then on, how much total future reward do I end up with?" Here's the whole environment and the update rule, runnable as-is:

```python
GRID_SIZE = 4
GOAL = (3, 3)
PIT = (1, 1)
START = (0, 0)

ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}
ACTION_LIST = list(ACTIONS)

def step(state, action):
    dr, dc = ACTIONS[action]
    r, c = state
    nr, nc = r + dr, c + dc
    if not (0 <= nr < GRID_SIZE and 0 <= nc < GRID_SIZE):
        nr, nc = r, c                    # bumped a wall, stay put
    next_state = (nr, nc)
    if next_state == GOAL:
        return next_state, 1.0, True
    if next_state == PIT:
        return next_state, -1.0, True
    return next_state, 0.0, False

Q = {(r, c): {a: 0.0 for a in ACTION_LIST}
     for r in range(GRID_SIZE) for c in range(GRID_SIZE)}

ALPHA = 0.5   # learning rate — deliberately large so updates are visible by hand
GAMMA = 0.9   # discount factor

def q_update(s, a, r, s_next, done):
    best_next = 0.0 if done else max(Q[s_next].values())
    td_error = (r + GAMMA * best_next) - Q[s][a]
    Q[s][a] += ALPHA * td_error
    return td_error
```

That update line is the entire lesson in one expression:

```text
Q(s, a)  <-  Q(s, a) + alpha * ( r + gamma * max_a' Q(s', a') - Q(s, a) )
```

You nudge the current guess toward "the reward you actually got, plus a discounted guess at how good things look from wherever you landed." This is Q-learning specifically: the bootstrap uses `max` over the next state's actions — the best available move — not whatever move you actually take next. That's what makes it *off-policy*: the update doesn't care how you explore, only about the shape of the table at `s'`.

## Step by step

### Episode 1: a real mistake

Every entry of `Q` reads `0.0`. At `(0, 0)`, `up` and `left` bump into walls (reward `0`, stay put); `down` and `right` are real moves (also reward `0`, since neither lands on a terminal cell). All four look identical: `0.0`.

> **Why this step?** With a table full of zeros, "greedy" and "random" are the same policy — there's no signal yet to exploit. Whatever action gets picked first is exploration, whether or not you dress it up with an epsilon.

Say the coin flip picks `right`, then `down`:

```python
s = START
for a in ["right", "down"]:
    s_next, r, done = step(s, a)
    q_update(s, a, r, s_next, done)
    print(f"{s} --{a}--> {s_next}  r={r:+.1f}  Q[{s}][{a}] -> {Q[s][a]:+.3f}")
    s = s_next
    if done:
        break
```

```text
(0, 0) --right--> (0, 1)  r=+0.0  Q[(0, 0)][right] -> +0.000
(0, 1) --down--> (1, 1)  r=-1.0  Q[(0, 1)][down] -> -0.500
```

> **Why this step?** The first update computes to zero even though the move was fine — the bootstrap target was `max` over a row of zeros, so there was nothing to pull the number anywhere. The second update is where the mistake actually registers: stepping into the pit gives `r = -1`, there's no "afterward" to bootstrap from (`done = True`), so `Q((0,1), down)` moves half the distance from `0.0` to `-1.0`. Notice exactly what got blamed: not the state `(0, 1)`, not the path that led there — specifically the *action* `down`, taken *from* `(0, 1)`. Q-values live on (state, action) pairs precisely so one bad outcome doesn't poison a state you might still want to pass through.

### Episode 2: avoiding the mistake, then a real success

New episode, same table (it persists — that's the whole point of learning). At `(0, 0)` all four actions are still tied at `0.0`, so it's still a coin flip. Say `right` comes up again. But now at `(0, 1)`, the table isn't uniform anymore: `up`, `left`, and `right` are `0.0`; `down` is `-0.5`. A greedy — or mostly-greedy — policy steers around it:

```python
s = START
for a in ["right", "right", "down", "down", "down", "right"]:
    s_next, r, done = step(s, a)
    q_update(s, a, r, s_next, done)
    print(f"{s} --{a}--> {s_next}  r={r:+.1f}  Q[{s}][{a}] -> {Q[s][a]:+.3f}")
    s = s_next
    if done:
        break
```

```text
(0, 0) --right--> (0, 1)  r=+0.0  Q[(0, 0)][right] -> +0.000
(0, 1) --right--> (0, 2)  r=+0.0  Q[(0, 1)][right] -> +0.000
(0, 2) --down--> (1, 2)  r=+0.0  Q[(0, 2)][down] -> +0.000
(1, 2) --down--> (2, 2)  r=+0.0  Q[(1, 2)][down] -> +0.000
(2, 2) --down--> (3, 2)  r=+0.0  Q[(2, 2)][down] -> +0.000
(3, 2) --right--> (3, 3)  r=+1.0  Q[(3, 2)][right] -> +0.500
```

Five updates land on zero again, for the same reason as before — every bootstrap target along an unexplored corridor is `max` over more zeros. Then the last step lands on the goal: `Q((3,2), right)` moves from `0.0` to `0.5`. That's "learning from reward" in the most literal sense available: a real number, in a real cell of a real table, moved toward the goal because something real happened.

After two episodes, here's the entire table that isn't zero:

| state | action | Q-value | why |
|---|---|---|---|
| `(0, 1)` | `down` | `-0.50` | walks straight into the pit — learned in episode 1 |
| `(3, 2)` | `right` | `+0.50` | walks straight into the goal — learned in episode 2 |
| everything else | — | `0.00` | no reward has reached it yet |

62 of 64 entries are still exactly zero. That's not a bug — it's what temporal-difference learning looks like before it's had time to work. Value only enters the table where reward is actually received (right next to the pit and right next to the goal), and it only moves one hop per visit. Getting a positive number all the way back to `Q((0,0), right)` requires the same corridor to be walked — or a shorter one discovered — over and over, each time nudging the cell one step further from the goal a little further toward optimistic.

To see that propagation without hand-tracing dozens more episodes: suppose a later episode reaches `(2, 2)` and takes `down` again, landing on `(3, 2)`, a non-terminal move (`r = 0`). The bootstrap target is no longer zero — `max` over `Q[(3, 2)]` is now `0.5`:

```text
Q((2,2), down) += 0.5 * (0 + 0.9 * 0.5 - 0) = 0.5 * 0.45 = 0.225
```

That's `gamma` doing its job for the first time in this trace — every update so far had a bootstrap target of exactly zero, so the discount factor was along for the ride but never actually moved a number. Once one cell near the goal is nonzero, the next cell back can borrow a discounted fraction of it. Run enough episodes and this keeps walking backward, cell by cell, until the start state has a visibly better action than its siblings.

### Exploration vs. exploitation, concretely

Look again at the decision the agent faced at `(0, 1)` in episode 2: `up`, `left`, `right` are tied at `0.0`; `down` is `-0.5`. A pure-greedy policy would never take `down` there again. But a standard **epsilon-greedy** policy — the default in most introductions, including [reinforcement-learning-basics](/learn/ai-foundations/reinforcement-learning-basics) — doesn't commit to greedy: with probability `epsilon` it ignores the table entirely and picks uniformly at random over all four actions; otherwise it picks (randomly, among ties) from the best-looking ones.

Set `epsilon = 0.2`. The chance of landing on `down` — the action you *already know* costs you the game — on any future visit to `(0, 1)` is:

```text
P(down) = epsilon * 1/4 = 0.2 * 0.25 = 0.05
```

A flat 5%, forever, regardless of how many times you've confirmed it's a mistake. (If the arithmetic of combining "explore or not" with "which action if so" feels unfamiliar, [probability-basics-for-ai](/learn/maths-foundations/probability-basics-for-ai) covers exactly this kind of weighted-branch calculation.) That 5% is the exploration/exploitation tension made numeric: exploiting says "you already paid to learn this, stop paying again"; a fixed exploration rate keeps paying anyway, because it can't tell "resolved" apart from "under-explored." In a *stochastic* environment that's a reasonable premium — the pit might not be a pit every time. In this environment, which is deterministic, it's pure cost: retrying `down` from `(0, 1)` can never reveal new information, because you already know exactly what happens. This is a real limitation of plain epsilon-greedy — it keeps exploring arms it has already fully resolved — and it's the practical reason people decay epsilon over training, or reach for smarter exploration bonuses. Which brings you to where this exact grid goes wrong.

## Where it breaks

Suppose you're frustrated that early training wastes so many episodes wandering before anything propagates, so you add a shaping reward meant to help: `+0.1` the first time an episode visits any cell it hasn't seen yet.

```python
def step_with_novelty_bonus(state, action, visited_this_episode):
    next_state, reward, done = step(state, action)
    if not done and next_state not in visited_this_episode:
        reward += 0.1
    visited_this_episode.add(next_state)
    return next_state, reward, done
```

The intent is obviously good: nudge the agent to cover ground instead of bumping the same wall forever. But you've changed what the *optimal* policy is, not just how fast it's found. Count the cells: 16 total, minus the goal, minus the pit, leaves 14 free non-terminal cells (including the start). The direct route traced above — 6 moves — visits 5 of those beyond the start: `(0,1) (0,2) (1,2) (2,2) (3,2)`.

```python
free_non_terminal_cells = 14                                    # 16 - GOAL - PIT
direct_path_new_cells   = 5                                     # cells beyond START on the direct route
remaining_cells         = free_non_terminal_cells - 1 - direct_path_new_cells  # minus START itself

direct_total = direct_path_new_cells * 0.1 + 1.0
tour_total   = (direct_path_new_cells + remaining_cells) * 0.1 + 1.0
print(direct_total, tour_total)
```

```text
1.5 2.3
```

Solving the task efficiently earns `1.5` total reward. Touring every remaining free cell first, *then* finishing, earns `2.3` — over 50% more, for taking longer. An agent that's actually maximizing the reward you wrote down will learn to wander the whole grid before it ever heads for the goal, because that genuinely scores higher. Nothing is broken in the learning algorithm; the reward function is doing precisely what it says, and what it says is not what you meant. That gap — between the objective you specified and the objective you intended — is exactly what [alignment-specifying-what-we-want](/learn/ai-foundations/alignment-specifying-what-we-want) is about, and it's why [alignment-failure-case-studies](/learn/ai-foundations/alignment-failure-case-studies) reads less like a list of bugs and more like a list of reward functions that were satisfied a little too literally.

**Fixing it, two ways.** The quick patch, specific to this grid: make the novelty bonus a once-ever reward, tracked in a set that persists across the whole training run instead of being reset every episode. It still helps in the first handful of episodes — genuinely new cells still pay — but once the agent has visited everywhere at least once, there's nothing left to farm, so later episodes are scored on task performance again. The general fix is **potential-based shaping**: instead of a flat bonus for novelty, add `gamma * phi(next_state) - phi(state)` for some potential function `phi` that scores how promising a state is (say, `phi(s) = -distance_to_goal(s)`). This form has a specific, provable property — it can be absorbed back into the value function without changing which action looks best from any state — so wandering back and forth can't manufacture extra reward; only actually making, and keeping, progress toward the goal pays. It's more work to design than "reward anything that looks like effort," which is the actual lesson: the shape of a reward function is not an implementation detail you patch later, it's the thing that decides what your agent becomes. That's precisely the concern [ai-alignment-and-safety-basics](/learn/ai-foundations/ai-alignment-and-safety-basics) opens with, just at a scale where you can't hand-trace the table.

It's also worth naming the scaling problem directly: this whole page works because there are only 64 numbers to track. "Have a good conversation" has no finite table of states to index into. That gap — swap the lookup table for a neural network that generalizes to states it's never exactly seen, and swap "reach the +1 cell" for "produce text a learned reward model scores highly" — is what [rlhf-and-instruction-tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) covers, and every failure mode you just watched happen in 4x4 (sparse credit assignment, an exploration/exploitation tradeoff, a reward function that's gameable) shows up there too, just harder to eyeball.

## Takeaways

- A value table starts at zero everywhere and stays there almost everywhere for a long time — value only enters where reward is actually received, and it only travels one hop per visit. Watching most of a Q-table read `0.000` after real training episodes is normal, not broken.
- Q is defined over (state, action) pairs, not states alone, so a single bad outcome gets charged to the specific action that caused it — not to the state you were in, and not to the path that got you there.
- Bootstrapping from zero means your discount factor (`gamma`) can sit unused for a while: it only starts moving numbers once *something* downstream is nonzero to bootstrap from.
- Exploration vs. exploitation isn't a phase you finish — it's a live probability on every visit to every state. With epsilon-greedy, that probability is exact and computable (`epsilon * 1/(number of actions)`), and it keeps paying a cost even in a deterministic environment where nothing more could possibly be learned.
- A reward function is a specification, and specifications get satisfied exactly as written. If any reachable behavior scores higher than the one you wanted, a good-enough optimizer eventually finds it — that's reward hacking, and it shows up the moment you add a well-intentioned shaping term, not just in exotic failure cases.
- The fix is never "add another patch reward on top" — it's making the behavior you actually want the highest-scoring one, whether by capping/decaying a bonus or by using a structurally safe shaping form like potential-based shaping.

**Related:** [reinforcement-learning-basics](/learn/ai-foundations/reinforcement-learning-basics) · [rlhf-and-instruction-tuning](/learn/ai-foundations/rlhf-and-instruction-tuning) · [alignment-specifying-what-we-want](/learn/ai-foundations/alignment-specifying-what-we-want) · [alignment-failure-case-studies](/learn/ai-foundations/alignment-failure-case-studies) · [ai-alignment-and-safety-basics](/learn/ai-foundations/ai-alignment-and-safety-basics) · [learning-paradigms-quiz](/learn/ai-foundations/learning-paradigms-quiz)
