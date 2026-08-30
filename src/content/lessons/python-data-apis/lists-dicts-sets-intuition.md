---
title: "How to Picture Lists, Dicts, and Sets"
track: "python-data-apis"
status: live
summary: "Builds the mental models for lists, dicts, and sets as a shelf, labeled drawers, and a guest list — then shows, with runnable code and worked arithmetic, why membership checks are "
duration: "14 min read"
---

You've written `x in container` a hundred times without asking what happens underneath it — and that's fine, until a script that felt instant on your laptop grinds to a crawl the moment you point it at a real dataset. The fix usually isn't a cleverer algorithm. It's picking the container whose whole job is answering the question you're actually asking.

## Three containers, three different questions

Each of Python's core collections is built to answer one question well:

```python
shelf = ["apple", "banana", "cherry", "date"]              # list: "what's in slot 2?"
drawers = {"apple": 1.20, "banana": 0.50, "cherry": 3.00}   # dict: "what's behind label 'banana'?"
guest_list = {"apple", "banana", "cherry"}                  # set: "is 'cherry' on the list at all?"

print(shelf[2])            # 'cherry' -- the third slot on the shelf, by position
print(drawers["banana"])   # 0.50    -- open the drawer with this exact label
print("cherry" in guest_list)  # True -- yes/no, nothing else
```

A **list** is an ordered shelf: items sit in slots numbered `0, 1, 2, ...`, and you reach one by its slot number. A **dict** is a bank of labeled drawers: you don't care about slot numbers, you care about the label, and each drawer holds something. A **set** is a guest list at a door: it holds no cargo, no order, no positions — it exists to answer exactly one question, instantly: *are you on the list?*

That third one feels like a smaller, dumber version of a dict. It is — and that's precisely why it's fast at the one thing it does. Stripping away the cargo and the ordering is what lets a set answer "is this in here?" without doing any work proportional to how many items it holds.

## What "reach by position" actually buys you

`shelf[2]` is fast because you already told Python exactly where to look. Under the hood, a list is a block of memory, and `shelf[2]` is "jump to the 2nd offset in that block" — one computation, done. That's true no matter whether the shelf holds 4 items or 4 million.

But notice what that operation assumes: you already know the position. Most real questions aren't "what's in slot 2" — they're "is `'cherry'` anywhere on this shelf at all," and nobody told you which slot to check.

## Walking the tape: what `in` actually does on a list

When you don't know the position, Python doesn't know it either. `x in a_list` walks the shelf from slot 0, checking one item at a time, until it finds a match or runs out of shelf:

```python
def is_member_list(item, container):
    checks = 0
    for element in container:
        checks += 1
        if element == item:
            return True, checks
    return False, checks

fruits = ["apple", "banana", "cherry", "date", "elderberry"]
print(is_member_list("elderberry", fruits))  # (True, 5)  -- had to check every slot to reach the last one
print(is_member_list("fig", fruits))         # (False, 5) -- not there, so it checked *all* of them
```

That's a linear scan: checking for something that isn't present, or that's near the end, costs you the whole list. Double the list, double the worst-case work. This is exactly what `x in a_list` compiles down to — there's no shortcut hiding in there.

## The wrong intuition: "if indexing is fast, everything on a list is fast"

Here's the trap. `shelf[2]` is O(1) — instant, regardless of size — so it's tempting to assume lists are just "fast" as a category, and that `x in shelf` inherits that speed. It doesn't, because it's a completely different operation asking a completely different question:

- `shelf[2]` — "what's *at* this position?" (you supply the position, Python jumps there)
- `"cherry" in shelf` — "*where* is this value, if anywhere?" (you supply the value, Python has to search)

Indexing is fast because the question already contains the answer's location. Membership testing is slow on a list precisely because the question doesn't — the list has no idea where `"cherry"` lives until it checks.

> The list isn't being slow. It's doing exactly what you asked: check every slot until you find a match. A set was never asked to check slots one by one — it was asked to check one specific slot it computed in advance.

## Sets and dicts: compute the slot, don't search for it

A set (and a dict's keys) uses hashing to skip the search entirely. Feeding a value through `hash()` produces a number that Python uses to pick a slot directly:

```python
print(hash(42))       # 42 -- small ints hash to themselves in CPython
print(hash(42) % 8)   # 2  -- this number picks a slot to check, with no scanning at all
```

Real CPython sets and dicts use a resizable table with some extra bookkeeping for collisions, but the core idea is exactly this simplified picture: compute a slot from the *value itself*, then look only there. Whether the table holds 5 items or 5 million, computing a hash and checking one slot costs about the same. That's the whole trick — a set trades away order and position so that membership becomes "compute, then check one spot" instead of "check every spot."

This is why `x in a_list` and `x in a_set` look identical in code but are not the same operation — they dispatch to completely different implementations (`list.__contains__` scans; `set.__contains__` and `dict.__contains__` hash-and-check). If you want the fuller, more formal treatment of what's happening in memory here, see [Python data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work).

## Feel it with real numbers

Say you're validating 5,000 incoming order IDs against a catalog of 200,000 valid product IDs pulled from an API and stored as a list. On average, a miss or a late match scans about half the list — 100,000 comparisons — so 5,000 checks costs roughly 500 million comparisons in total. Convert the catalog to a set once, and those same 5,000 checks become 5,000 hash-and-check operations — no scanning, no growth with catalog size.

You don't have to take that arithmetic on faith — run the shape of it yourself:

```python
import time

def time_membership(container, probe, repeats=2000):
    start = time.perf_counter()
    for _ in range(repeats):
        probe in container
    return time.perf_counter() - start

big_list = list(range(200_000))
big_set = set(big_list)
probe = -1  # not present -- forces a full scan on the list, worst case

print("list:", time_membership(big_list, probe))
print("set: ", time_membership(big_set, probe))
```

Run it at a few sizes (`50_000`, `200_000`, `1_000_000`) and watch what happens: the list's time climbs roughly in step with its length, while the set's time barely moves. That growth curve — not any single number — is the thing to internalize.

## The pattern that shows up everywhere: dedup with a "seen" set

This is the single most common place the mistake bites in real data work — deduping IDs from a flaky webhook, a paginated API, or a messy CSV:

```python
raw_events = [101, 102, 101, 103, 102, 104]  # duplicate IDs from a retried webhook

# The tempting-but-slow version: checking membership against a growing list
unique_events = []
for event_id in raw_events:
    if event_id not in unique_events:   # scans the list built so far -- gets slower every iteration
        unique_events.append(event_id)

# The fast version: a set answers "have I seen this?" in constant time
seen = set()
unique_events = []
for event_id in raw_events:
    if event_id not in seen:
        seen.add(event_id)
        unique_events.append(event_id)  # still preserves original order, unlike plain set(raw_events)
```

Both versions produce the same output here. The difference only shows up at scale: the first is quadratic (the "have I seen this" list keeps growing, so each check gets slower), the second is linear (the set's checks stay flat regardless of how many you've seen). You'll build this exact `seen`-set pattern constantly once you get into [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) and cleaning real API output.

## Dicts are sets that also hand you cargo

A dict's keys behave exactly like a set — same hashing, same instant membership check — except each key also comes with a value attached:

```python
users = [
    {"id": "u1", "name": "Priya", "plan": "pro"},
    {"id": "u2", "name": "Marco", "plan": "free"},
    {"id": "u3", "name": "Wei", "plan": "enterprise"},
]

users_by_id = {u["id"]: u for u in users}   # turn a list-of-records into a lookup table, once

print("u2" in users_by_id)          # True -- checks only the labels, same mechanism as a set
print(users_by_id["u2"]["plan"])    # 'free' -- and the drawer also hands you the whole record
```

If your data is naturally a list of records but you keep asking "give me the one with id X," that repeated linear search is your cue to build a dict once (`{record["id"]: record for record in records}`) and look up by key from then on. This is the same move you'll make constantly once records start arriving as [nested JSON](/learn/python-data-apis/nested-json-in-memory) from an API.

## When the analogy breaks

The mental models are solid, but each one has an edge where reality diverges from the picture:

- **A dict's "drawers" secretly have a memory of the order you filled them.** Since Python 3.7, dicts preserve insertion order during iteration — something a pure "labeled drawers, no arrangement" picture doesn't suggest. A plain set makes no such promise; don't rely on the order you get back from iterating one.

- **The guest list can't hold a guest whose name might change while they're on it.** Sets and dict keys must be hashable, which in practice means immutable: strings, numbers, tuples of hashable things — not lists, not dicts. This fails:

  ```python
  seen_payloads = set()
  payload = {"user": "u1", "event": "click"}
  seen_payloads.add(payload)
  # TypeError: unhashable type: 'dict'
  ```

  The fix is to hash a stable, immutable *representation* of the thing instead:

  ```python
  import json
  key = json.dumps(payload, sort_keys=True)
  seen_payloads.add(key)
  print(key in seen_payloads)  # True
  ```

- **A guest list can't tell two people apart if they show up twice — it just says "already here."** Sets silently collapse duplicates. That's a feature for dedup, but it means a set is the wrong tool the moment you need *counts*, not just presence — reach for `collections.Counter` or a plain dict instead.

- **"Instant" means expected constant time, not guaranteed.** Hash collisions and occasional table resizing mean a single lookup can, rarely, cost more than O(1). For everyday data work this is noise, not a planning concern.

- **For a handful of items, the shelf is basically free to scan.** Scanning 5 items and hashing one both cost approximately nothing; the overhead of building and maintaining a hash table isn't worth it until the collection actually grows or gets checked repeatedly. Don't reach for a set out of habit on a 3-item list — reach for it when the collection is large, comes from a file or API, or gets checked in a loop.

## Reaching for the right one under load

The question to ask before you pick a container: *am I going to ask "is this in here?" more than once, against something that can grow?* If yes, that's a set (presence only) or a dict (presence plus a value) — not a list. Keep the list for when order and position are the point: a sequence of rows, a queue, anything you'll iterate front-to-back or slice.

The same instinct — trade a general-purpose structure for one shaped like the question you're actually asking — comes back when you move from Python objects to numeric arrays; see [why arrays beat lists for numeric work](/learn/python-data-apis/why-arrays-beat-lists-intuition) for that version of the trade-off.

**Related:** [Python data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work) · [Comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) · [Nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [Python data structures quiz](/learn/python-data-apis/python-data-structures-quiz)
