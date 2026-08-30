---
title: "Quiz: Python Data Structures"
track: "python-data-apis"
status: live
summary: "A six-question self-check on comprehension output, dict.get vs bracket access, set operations for dedup, fastest membership tests, and reading a nested JSON blob."
duration: "12 min read"
---

Lists, dicts, and sets look easy right up until a comprehension silently keeps the wrong half of your data, or a `KeyError` takes down a pipeline over a field that's usually there but isn't this time. These six questions are built around the specific ways that goes wrong — work through each one before checking the answer.

## Question 1 — Comprehension with a twist

What does this print?

```python
nums = [1, 2, 3, 4, 5]
result = [n if n % 2 == 0 else -n for n in nums]
print(result)
```

- **A.** `[-1, 2, -3, 4, -5]`
- **B.** `[2, 4]`
- **C.** `[1, -2, 3, -4, 5]`
- **D.** Raises a `SyntaxError`

<details><summary>Answer</summary>

**Correct: A.** The `if/else` here sits *before* the `for` — that's Python's conditional (ternary) expression, not a filter. It runs for every element and picks which value to keep: `n` when `n` is even, `-n` otherwise. Nothing gets dropped, so the output is the same length as the input: `[-1, 2, -3, 4, -5]`.

**B** is what you'd get from `[n for n in nums if n % 2 == 0]` — a genuine filter, with `if` *after* `for`. The version in the question has no filter at all; every element survives, just transformed differently depending on the condition.

**C** swaps the branches — negating the odd numbers and passing the even ones through unchanged, the reverse of what's written. Read it literally: `n if n % 2 == 0 else -n` means "if `n` is even, keep `n` as-is; otherwise, use `-n`."

**D** — this is completely valid syntax. `expr1 if condition else expr2 for x in iterable` is the standard form for a comprehension with a conditional expression. It only breaks if you drop the `else` and try to use `if` both as a filter and a value-picker at once — see the trap in Question 3 for exactly that mistake. Worth practicing more of these on [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) if the ternary-vs-filter distinction still feels shaky.

</details>

## Question 2 — What a dict comprehension keeps

```python
words = ["apple", "banana", "avocado", "blueberry", "cherry"]
first_letter = {w[0]: w for w in words}
print(first_letter)
```

- **A.** `{'a': 'apple', 'b': 'banana', 'c': 'cherry'}`
- **B.** `{'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}`
- **C.** `{'a': 'avocado', 'b': 'blueberry', 'c': 'cherry'}`
- **D.** Raises an error for the duplicate key `'a'`

<details><summary>Answer</summary>

**Correct: C.** A dict comprehension behaves exactly like repeatedly writing `d[key] = value` inside a loop: each time a key recurs, the new value replaces the old one, silently. Walking through it — `'a': 'apple'`, `'b': 'banana'`, `'a': 'avocado'` (overwrites), `'b': 'blueberry'` (overwrites), `'c': 'cherry'` — the last value written for each key is the one that survives: `{'a': 'avocado', 'b': 'blueberry', 'c': 'cherry'}`.

**A** is the tempting "first one wins" instinct — it's how you might picture building a lookup where the first match should stick. But Python keeps re-assigning the key on every occurrence, so it's the *last* value that wins, not the first. This is the exact bug that shows up when you build an index keyed by something you assumed was unique and it wasn't.

**B** imagines dict comprehensions auto-collecting collisions into a list. They don't — `{k: v for ...}` always produces one value per key. If you actually want to collect all the values sharing a key, you'd reach for `collections.defaultdict(list)` in an explicit loop instead.

**D** — dict comprehensions and dict literals never check key uniqueness. There's no exception, no warning, just a quiet overwrite. That silence is what makes this bug easy to ship. For more on when this dedup-via-dict pattern is useful versus dangerous, see [lists, dicts, and sets intuition](/learn/python-data-apis/lists-dicts-sets-intuition).

</details>

## Question 3 — Reading an optional field

You're pulling fields out of records that don't all have the same keys — some have a `"discount"`, most don't:

```python
record = {"user_id": 42, "total": 89.5}
```

Which line reads `"discount"` without raising an exception and without changing `record`?

- **A.** `record["discount"]`
- **B.** `record.get("discount")`
- **C.** `record.pop("discount")`
- **D.** `record["discount"] if "discount" in record`

<details><summary>Answer</summary>

**Correct: B.** `.get()` returns `None` when the key is missing (or a value you supply, like `record.get("discount", 0)`), doesn't touch the dict, and doesn't raise. That combination — safe default, no side effects — is exactly what you want when reading an optional field, especially when parsing API responses where fields come and go between records. See [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) for the fuller pattern.

**A** raises `KeyError` the moment `"discount"` is missing. Bracket access assumes the key is always present — which is the one assumption that's false for an optional field.

**C** raises the same `KeyError` as bracket access when the key is missing and no default is given — `.pop()` needs a second argument too if you want a safe default. And even when the key *does* exist, `.pop()` removes it from `record` as a side effect. Reading a value shouldn't mutate the structure you're reading it from.

**D** is missing its `else` clause. A conditional expression needs both branches — `value_if_true if condition else value_if_false` — so as written this is a `SyntaxError`, not a working shortcut.

</details>

## Question 4 — Deduplicating with sets

```python
tags_post1 = ["python", "ai", "python", "data"]
tags_post2 = ["ai", "ml", "data", "data"]

overlap = set(tags_post1) & set(tags_post2)
print(sorted(overlap))
```

- **A.** `['ai', 'data', 'ml', 'python']`
- **B.** `['ai', 'ai', 'data', 'data', 'python']`
- **C.** `['ml', 'python']`
- **D.** `['ai', 'data']`

<details><summary>Answer</summary>

**Correct: D.** `&` is set intersection — only the elements present in *both* sets survive. `set(tags_post1)` is `{"python", "ai", "data"}`, `set(tags_post2)` is `{"ai", "ml", "data"}`; the overlap is `{"ai", "data"}`, sorted to `['ai', 'data']`.

**A** is what `|` (union) would give you — every tag from either post, combined. `&` only keeps what's shared, not everything.

**B** assumes duplicates survive into the intersection. They can't: `set(tags_post1)` and `set(tags_post2)` are each fully built — deduplicated — *before* the `&` ever runs. By the time the intersection happens, `"python"` and `"data"` already exist only once each in their respective sets, so there's no path left for a duplicate to reappear.

**C** is the symmetric difference `^` — tags in exactly one post but not both (`"python"` and `"ml"` here). It's the mirror image of what `&` computes, not the same thing.

</details>

## Question 5 — The fastest way to check "is this in there?"

You're checking every incoming `account_id` against a denylist of 500,000 blocked IDs, and you'll do this check on every single request:

```python
if account_id in blocked_ids:
    reject(account_id)
```

Which way of storing `blocked_ids` makes that `in` check fastest?

- **A.** A `tuple` of IDs — immutable, so surely faster to search than a list.
- **B.** A `set` of IDs.
- **C.** A sorted `list`, searched with `bisect.bisect_left`.
- **D.** A plain `list` of IDs, checked with `in`.

<details><summary>Answer</summary>

**Correct: B.** Sets (and dicts) hash their contents, so `in` is O(1) on average no matter how large the collection gets — checking against 500,000 IDs costs about the same as checking against 50. Whenever "is X in this collection" is the operation you're optimizing, a set is the default answer — see [choosing data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work) for more on picking structures by the operation you'll run most.

**A** — immutability controls whether you *can change* a collection after creating it; it says nothing about how `in` searches it. A tuple is scanned element by element exactly like a list, same O(n) cost. "Tuples are faster" is a common myth that doesn't hold for membership tests.

**C** is a genuine improvement over a linear scan — O(log n) instead of O(n) — but you pay to build the sorted structure up front (and to re-sort or re-insert carefully if the list changes), and a hash-based lookup still beats it on average. Reach for a sorted list plus `bisect` when you need the sort order for something else too, like range queries — not purely for membership testing.

**D** is the case that gets slow at scale: a list's `in` check walks from the start until it finds a match or runs out of elements, so it's O(n) per check. Fine for a handful of items; expensive when you're running it repeatedly against half a million.

</details>

## Question 6 — Walking a nested JSON blob

```python
data = {
    "user": {
        "name": "Priya",
        "orders": [
            {"id": 101, "items": ["pen", "notebook"]},
            {"id": 102, "items": ["laptop", "mouse"]}
        ]
    }
}

result = data["user"]["orders"][1]["items"][0]
print(result)
```

What does `result` equal?

- **A.** Raises an `IndexError`
- **B.** `"pen"`
- **C.** `"laptop"`
- **D.** `["laptop", "mouse"]`

<details><summary>Answer</summary>

**Correct: C.** Walk the chain one hop at a time: `data["user"]` gets the user dict, `["orders"]` gets the list of two order dicts, `[1]` picks the *second* order (`{"id": 102, "items": ["laptop", "mouse"]}`), `["items"]` gets that order's list, and `[0]` picks its first element: `"laptop"`. This step-by-step approach is the reliable way to read any nested lookup — see [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) for more practice tracing chains like this, and [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for what to do when a real API response doesn't guarantee this shape holds.

**A** assumes `orders` doesn't have an index `1`. It does — there are two entries, at index `0` and index `1` — so `orders[1]` is perfectly valid. This would only raise `IndexError` if the list had one element or fewer.

**B** comes from reading `orders[1]` as "the first order." It isn't — Python indexes from `0`, so `orders[0]` is Priya's first order (pen and notebook) and `orders[1]` is her *second* order. `"pen"` is what you'd get from `data["user"]["orders"][0]["items"][0]` instead.

**D** stops one step early — that's `data["user"]["orders"][1]["items"]`, the full items list for the second order, before the final `[0]` narrows it down to just the first element inside that list.

</details>

**Related:** [Lists, dicts, sets intuition](/learn/python-data-apis/lists-dicts-sets-intuition) · [Comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) · [Nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) · [Choosing data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses)
