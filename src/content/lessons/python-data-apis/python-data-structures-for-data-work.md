---
title: "Lists, Dicts, Tuples, Sets for Data"
track: "python-data-apis"
status: live
summary: "How a support-ticket queue maps onto the four core Python structures — a ticket as a dict, the queue as a list of dicts, unique tags as a set, and a triage-board cell as a tuple — "
duration: "14 min read"
---

Open any support ticket queue and you're looking at the same shape you'll fight with for the rest of your data career: one record, many records, the unique values buried inside them, and a fixed key you use to file things. Python gives you exactly one structure built for each job — the trick is knowing which is which before you write a line of code.

## What it is

A **dict** holds one record: named fields, one value per field, reached by key instead of position. A **list** holds many records of the same shape — that's your table. A **set** holds the unique members of a collection, with no order and no duplicates. A **tuple** holds a small, fixed group of values that together mean one thing, and can't be changed after it's created.

| Structure | Ordered | Mutable | Duplicates allowed | Job it's built for |
|---|---|---|---|---|
| `dict` | yes (insertion order) | yes | keys: no · values: yes | one record — named fields |
| `list` | yes | yes | yes | a table — many records, same shape |
| `tuple` | yes | **no** | yes | a fixed, hashable coordinate or key |
| `set` | no | yes | **no** | the unique members of a collection |

Notice the two columns that actually decide which one you reach for: **mutable** and **duplicates allowed**. Everything else in this lesson follows from those two.

## The mental model

Picture a dict as a filled-out form — `"priority"`, `"status"`, `"customer"` are printed field labels, and you always read by label, never by "the third line down." A list of dicts is a filing drawer of those forms, stacked in order; nothing forces the forms to share a schema, but in practice they do, and that shared schema is what makes the drawer a *table*.

A tuple is a stamped coordinate on a folder's spine — `(priority, status)` — an address, not content. You don't edit an address after you've filed something under it; you refile it under a new one. A set is a bag with no duplicates and no order: good for "what are the distinct things in here," useless for "what's in position 3."

This mental model matters most the moment JSON enters the picture, because JSON and Python's structures line up almost exactly:

| JSON | Python |
|---|---|
| `{...}` object | `dict` |
| `[...]` array | `list` |
| string / number / `true`/`false` / `null` | `str` / `int` or `float` / `True`/`False` / `None` |

There is no JSON tuple and no JSON set — those two are yours to add *after* you've loaded the data, as a deliberate modeling choice, not something an API hands you. Every API response you'll parse (see [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python)) arrives as nested dicts and lists, and staying fluent in that nesting is covered in depth in [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory).

## Why it works this way

Dicts and sets are both backed by hash tables — that's why looking something up in a dict, or checking membership in a set, is fast (roughly constant time) no matter how large the collection gets, versus a list scan that gets slower as the list grows. Speed isn't free: a hash table only works if it can compute a stable hash for every key or member the moment it's inserted, and that hash has to stay valid for as long as the item lives inside the table.

That's the entire reason tuples exist alongside lists. A tuple is immutable, so its hash never changes, so it's safe to use as a dict key or drop into a set. A list is mutable — its contents can change after you build it — so Python refuses to hash it at all. If lists were hashable and you mutated one after using it as a key, the hash table would point to the wrong bucket and lookups would start silently failing. Python closes that door entirely:

```python
>>> board = {}
>>> board[["high", "open"]] = ["T-1042"]
TypeError: unhashable type: 'list'
```

Same reasoning, one level up: a dict itself can't be a set member or a dict key either, for the same mutability problem. Immutability isn't a restriction bolted onto tuples — it's the property that *earns* them a spot in a hash table in the first place.

## A concrete example

Here's a small ticket queue, shaped exactly like what a support API would hand back:

```python
import json

tickets_json = """
[
  {"id": "T-1042", "customer": "Nadia Reyes", "subject": "Export button times out",
   "tags": ["bug", "exports", "urgent"], "priority": "high", "status": "open",
   "created_at": "2026-08-27T14:32:00Z", "assigned_to": "priya"},
  {"id": "T-1043", "customer": "Owen Clarke", "subject": "Can't reset password",
   "tags": ["auth", "urgent"], "priority": "high", "status": "in_progress",
   "created_at": "2026-08-27T15:05:00Z", "assigned_to": "dev"},
  {"id": "T-1044", "customer": "Nadia Reyes", "subject": "Dashboard shows stale data",
   "tags": ["bug", "dashboard"], "priority": "medium", "status": "open",
   "created_at": "2026-08-27T16:47:00Z", "assigned_to": "priya"},
  {"id": "T-1045", "customer": "Sana Patel", "subject": "Feature request: dark mode",
   "tags": ["feature-request"], "priority": "low", "status": "open",
   "created_at": "2026-08-28T09:12:00Z", "assigned_to": null},
  {"id": "T-1046", "customer": "Owen Clarke", "subject": "Export missing rows",
   "tags": ["bug", "exports"], "priority": "medium", "status": "in_progress",
   "created_at": "2026-08-28T10:30:00Z", "assigned_to": "dev"}
]
"""

tickets = json.loads(tickets_json)
print(type(tickets), type(tickets[0]))
# <class 'list'> <class 'dict'>
```

**1. A record, as a dict.** One ticket, reached by name:

```python
ticket = tickets[0]
print(ticket["customer"], "-", ticket["subject"])
# Nadia Reyes - Export button times out
```

**2. A table, as a list of dicts.** The whole queue, one dict per row:

```python
for t in tickets:
    print(f"{t['id']:<7} {t['priority']:<7} {t['status']:<12} {t['customer']}")

# T-1042  high    open         Nadia Reyes
# T-1043  high    in_progress  Owen Clarke
# T-1044  medium  open         Nadia Reyes
# T-1045  low     open         Sana Patel
# T-1046  medium  in_progress  Owen Clarke
```

**3. Deduplication, as a set.** Every unique tag in the queue, without counting duplicates by hand:

```python
all_tags = set()
for t in tickets:
    all_tags.update(t["tags"])

print(sorted(all_tags))
# ['auth', 'bug', 'dashboard', 'exports', 'feature-request', 'urgent']
```

And the customers who've filed more than once — a job a set does in one pass, using membership checks that stay cheap however many tickets you have:

```python
seen, repeats = set(), set()
for t in tickets:
    c = t["customer"]
    if c in seen:
        repeats.add(c)
    seen.add(c)

print(repeats)
# {'Nadia Reyes', 'Owen Clarke'}
```

**4. An immutable coordinate, as a tuple.** A triage board is a grid of `priority x status` — exactly two fixed values that together name one cell, which is what a tuple is for:

```python
board = {}
for t in tickets:
    cell = (t["priority"], t["status"])       # a coordinate, not a mutable record
    board.setdefault(cell, []).append(t["id"])

for cell, ids in sorted(board.items()):
    print(cell, "->", ids)

# ('high', 'in_progress') -> ['T-1043']
# ('high', 'open') -> ['T-1042']
# ('low', 'open') -> ['T-1045']
# ('medium', 'in_progress') -> ['T-1046']
# ('medium', 'open') -> ['T-1044']
```

Try to relabel a cell after the fact and Python stops you:

```python
cell = ("high", "open")
cell[0] = "urgent"
# TypeError: 'tuple' object does not support item assignment
```

That's not an arbitrary limitation — `cell` is already sitting inside `board` as a key. If Python let you mutate it in place, `board`'s internal hash table would still be looking for it under the old hash, and every future lookup for that ticket's real cell would quietly miss.

## Where it shows up

- Any REST API that returns a collection — tickets, orders, users — hands it back as a JSON array of objects, which lands as exactly the list-of-dicts shape above once you call `response.json()`. See [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) and [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses).
- Pulling results across multiple pages of an API, you dedupe IDs you've already seen with a set rather than re-scanning a growing list each time — see [pagination patterns](/learn/python-data-apis/pagination-patterns).
- Reading a CSV with `csv.DictReader` gives you the identical shape: one dict per row, all rows in a list — see [reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv).
- A pandas DataFrame is very often *built* from a list of dicts (or the reverse: `df.to_dict("records")` gets you back to one) — see [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals).
- Multi-column group-by keys — "count tickets by priority and status" — are tuples under the hood, the same `(priority, status)` pairing you just built by hand.
- Tool/function-calling arguments from an LLM API arrive as a JSON object, i.e. a dict, and should be validated before you trust the fields inside it — see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation).

## Watch out for

**A mutable default argument leaks state across calls.** `def add_tag(ticket, tag, log=[]):` looks harmless, but the default list is created *once*, when the function is defined, and every call that skips the `log` argument shares that same list:

```python
def add_tag(ticket, tag, log=[]):
    ticket["tags"].append(tag)
    log.append((ticket["id"], tag))
    return log

log1 = add_tag(tickets[0], "reopened")
log2 = add_tag(tickets[1], "vip")
print(log2)
# [('T-1042', 'reopened'), ('T-1043', 'vip')]  <- log1's entry leaked into log2
```

Fix it by defaulting to `None` and creating the list inside the function body: `log = [] if log is None else log`.

**Duplicate keys in a JSON object don't error — they silently overwrite.** If a buggy upstream service (or a hand-edited fixture) sends the same key twice, `json.loads` keeps only the last one and never tells you:

```python
bad = '{"id": "T-1042", "status": "open", "status": "closed"}'
print(json.loads(bad))
# {'id': 'T-1042', 'status': 'closed'}   <- "open" vanished, no error raised
```

This is exactly the kind of silent data loss that a schema check catches before it reaches a model — see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation).

**Not everything can go straight into a set.** Each ticket's `tags` value is a list, and lists aren't hashable, so building a set directly from them fails:

```python
set(t["tags"] for t in tickets)
# TypeError: unhashable type: 'list'
```

Convert each list to a tuple first (`{tuple(t["tags"]) for t in tickets}`), or do what the worked example did — `update()` the set with the list's *elements* instead of adding the list itself. And remember sets have no order: if you need reproducible output, `sorted()` the result rather than relying on iteration order.

## Where next

Once these four shapes are automatic, the next skill is *building* lists and dicts in one line instead of a loop — see [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) — and then stress-testing your intuition against real nested payloads with the [lists, dicts, sets intuition](/learn/python-data-apis/lists-dicts-sets-intuition) page and the [group-by and aggregation](/learn/python-data-apis/groupby-and-aggregation) walkthrough, where tuple keys reappear for real.

**Related:** [Lists, dicts, sets — the intuition](/learn/python-data-apis/lists-dicts-sets-intuition) · [Comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) · Python data structures for data work · [Group-by and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [Python data structures quiz](/learn/python-data-apis/python-data-structures-quiz)
