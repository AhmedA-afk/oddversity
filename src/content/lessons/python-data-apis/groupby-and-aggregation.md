---
title: "GroupBy and Aggregation in Practice"
track: "python-data-apis"
status: live
summary: "A worked example grouping 18 support tickets by category to compute count, mean resolution time, and a custom SLA-breach aggregate with groupby.agg — contrasted against value_count"
duration: "14 min read"
---

Your support queue has thousands of closed tickets and one question that actually matters: which category of problem is failing customers the hardest? Answering it means turning eighteen — or eighteen thousand — flat rows into one line per category, and that's exactly the job `groupby` and `agg` were built for.

## The setup (specific)

You already know how to load a frame and pull a column out of it from [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) — this is where that object starts paying for itself. You've exported a slice of the ticket system: an ID, the category it was routed to, and how many hours it took to close.

```python
import pandas as pd

tickets = pd.DataFrame([
    {"ticket_id": 101, "category": "Billing",  "resolution_hours": 4.5},
    {"ticket_id": 102, "category": "Login",     "resolution_hours": 1.2},
    {"ticket_id": 103, "category": "Shipping",  "resolution_hours": 26.0},
    {"ticket_id": 104, "category": "Billing",   "resolution_hours": 3.1},
    {"ticket_id": 105, "category": "Bug",       "resolution_hours": 48.5},
    {"ticket_id": 106, "category": "Login",     "resolution_hours": 0.8},
    {"ticket_id": 107, "category": "Shipping",  "resolution_hours": 30.2},
    {"ticket_id": 108, "category": "Account",   "resolution_hours": 2.4},
    {"ticket_id": 109, "category": "Bug",       "resolution_hours": 52.0},
    {"ticket_id": 110, "category": "Billing",   "resolution_hours": 5.6},
    {"ticket_id": 111, "category": "Shipping",  "resolution_hours": 22.5},
    {"ticket_id": 112, "category": "Login",     "resolution_hours": 1.5},
    {"ticket_id": 113, "category": "Bug",       "resolution_hours": 40.0},
    {"ticket_id": 114, "category": "Account",   "resolution_hours": 3.0},
    {"ticket_id": 115, "category": "Billing",   "resolution_hours": 4.0},
    {"ticket_id": 116, "category": "Shipping",  "resolution_hours": 28.0},
    {"ticket_id": 117, "category": "Bug",       "resolution_hours": 45.5},
    {"ticket_id": 118, "category": "Account",   "resolution_hours": 2.8},
])
```

Eighteen tickets, five categories, one numeric column worth aggregating. In production this would arrive from a CSV export or a REST endpoint with dozens of other columns you'd drop before this step — but the shape of the problem doesn't change with size. The goal: for each category, get how many tickets landed there, how long they took on average, and a custom signal — the fraction that blew a 24-hour SLA — then rank categories from worst to best.

## Step by step

### Step 1 — the naive tool: `value_counts`

Your first instinct might be `value_counts()`, and it's not wrong, just incomplete:

```python
tickets["category"].value_counts()
```

```
category
Billing     4
Shipping    4
Bug         4
Login       3
Account     3
Name: count, dtype: int64
```

> **Why this step?** `value_counts()` answers exactly one question — how many rows share this value — and it only ever looks at the one column you called it on. It has no way to also tell you the average `resolution_hours` for those rows, because it never touches that column. The instant you need a second column involved in the answer, `value_counts()` is the wrong tool. That's the entire reason `groupby` exists: it lets you carry other columns along for the ride.

### Step 2 — do one group by hand

Before calling `groupby`, do the operation manually for a single category. This is the whole trick to understanding what `groupby` is doing later — it's just this, repeated:

```python
bug_rows = tickets[tickets["category"] == "Bug"]
print(bug_rows)
print("count:", len(bug_rows))
print("mean:", bug_rows["resolution_hours"].mean())
```

```
    ticket_id category  resolution_hours
4         105      Bug              48.5
8         109      Bug              52.0
12        113      Bug              40.0
16        117      Bug              45.5

count: 4
mean: 46.5
```

> **Why this step?** This is the "split" and "apply" of split-apply-combine, done with training wheels. `tickets["category"] == "Bug"` **splits** the four Bug rows out of the frame (see [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) if boolean masks are new to you); `.mean()` **applies** a reduction to that slice. What's missing is the third step — doing this for Login, Shipping, Account, and Billing too, then stitching the five results into one table. That stitching is the "combine," and it's the only part `groupby` actually automates for you.

### Step 3 — let `groupby` do the repeating

```python
grouped = tickets.groupby("category")
print(type(grouped))
```

```
<class 'pandas.api.typing.DataFrameGroupBy'>
```

Notice what you get back: not a table, not a number — an object that has *remembered how to split* but hasn't applied or combined anything yet. Ask it for the same statistic you computed by hand:

```python
grouped["resolution_hours"].mean()
```

```
category
Account      2.733333
Billing      4.300000
Bug         46.500000
Login        1.166667
Shipping    26.675000
Name: resolution_hours, dtype: float64
```

Check the Bug row: `46.5`. Same number you got slicing it by hand in Step 2. That's the proof — `groupby(...).mean()` is doing nothing conceptually different from what you just did manually, once per category, then assembling the results with the group key as the index.

> **Why this step?** Running the single-column `.mean()` before reaching for `.agg()` is a debugging habit worth keeping. If your final aggregated table ever looks wrong, you can always fall back to this one-liner (or the manual slice from Step 2) to check whether the bug is in your aggregation logic or in your understanding of what a "group" even contains.

### Step 4 — get count, mean, and a custom aggregate together

`value_counts` gave you counts. `.mean()` gave you one number per group. Now get all three real signals at once with **named aggregation**:

```python
def sla_breach_rate(hours):
    return (hours > 24).mean()

summary = tickets.groupby("category").agg(
    ticket_count=("ticket_id", "count"),
    avg_resolution_hours=("resolution_hours", "mean"),
    sla_breach_rate=("resolution_hours", sla_breach_rate),
)
print(summary)
```

```
          ticket_count  avg_resolution_hours  sla_breach_rate
category
Account              3               2.733333             0.00
Billing               4               4.300000             0.00
Bug                   4              46.500000             1.00
Login                 3               1.166667             0.00
Shipping              4              26.675000             0.75
```

`sla_breach_rate` is the custom aggregate the brief asked for, and it's worth pausing on because it isn't a built-in like `"mean"` or `"count"` — it's a plain Python function. Pandas hands it one group's `resolution_hours` values as a `Series` and expects one number back. `(hours > 24)` produces a boolean Series for that group alone, and `.mean()` on booleans gives you the fraction that were `True` — the percentage of tickets in that category that missed a 24-hour close target.

> **Why this step?** This is where `groupby.agg` earns its keep over `value_counts`: one call answers three genuinely different questions per group — volume, typical duration, and a business rule you defined yourself — and pandas runs your function once per split automatically. The `column=(source_column, function)` syntax is called *named aggregation*, and it matters for a reason you'll see in the next section: it guarantees every output column is flat and named exactly what you called it, not something pandas invented for you.

### Step 5 — sort to find the actual answer

Aggregating tells you what's true about each category. It doesn't tell you which one is worst — that needs a sort, on the real numbers, before you round anything for display:

```python
worst_first = summary.sort_values("avg_resolution_hours", ascending=False)
worst_first = worst_first.round(2)
print(worst_first)
```

```
          ticket_count  avg_resolution_hours  sla_breach_rate
category
Bug                   4                  46.50             1.00
Shipping              4                  26.67             0.75
Billing               4                   4.30             0.00
Account               3                   2.73             0.00
Login                 3                   1.17             0.00
```

> **Why this step?** Round *after* you sort, not before. Rounding first can quietly swap the order of two categories that are close, and you'd rank them wrong without any error to warn you. Sorting on the full-precision column and rounding only the display copy keeps the ranking honest.

The answer falls out immediately: **Bug** tickets average 46.5 hours to close — roughly two full days — and every single one of them breached the 24-hour SLA. Shipping is the clear second-worst, at 26.7 hours average and a 75% breach rate. Everything else in the queue is healthy by comparison. That's the entire point of the exercise: turn eighteen anonymous rows into a one-glance answer to "where do we need to put more engineers."

## Where it breaks

The failure most people hit is trying to shortcut Step 4 with the older dict-style `.agg()` syntax — passing a list of functions instead of named keyword arguments:

```python
trap = tickets.groupby("category").agg({
    "resolution_hours": ["mean", "count", sla_breach_rate]
})
print(trap)
print(trap.columns.tolist())
```

```
         resolution_hours
                     mean count sla_breach_rate
category
Account          2.733333     3            0.00
Billing           4.300000     4            0.00
Bug              46.500000     4            1.00
Login             1.166667     3            0.00
Shipping         26.675000     4            0.75

[('resolution_hours', 'mean'), ('resolution_hours', 'count'), ('resolution_hours', 'sla_breach_rate')]
```

It runs. It even looks right when printed. The trap is what happens next, when you go to sort it exactly like before:

```python
trap.sort_values("avg_resolution_hours", ascending=False)
```

```
KeyError: 'avg_resolution_hours'
```

There is no column called `"avg_resolution_hours"` — or even `"mean"` on its own. `trap.columns` is a `MultiIndex`: every column is a *tuple*, `("resolution_hours", "mean")`, `("resolution_hours", "count")`, and so on. Passing a list of functions instead of named aggregations is what produces this two-level header, and it silently changes what every column name actually is. This is the same family of surprise covered in [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) — code that runs without error while quietly not doing what you assumed.

**The fix** — flatten the MultiIndex into plain strings before you do anything else with the frame:

```python
trap.columns = ["_".join(col).strip("_") for col in trap.columns]
print(trap.sort_values("resolution_hours_mean", ascending=False))
```

```
          resolution_hours_mean  resolution_hours_count  resolution_hours_sla_breach_rate
category
Bug                    46.500000                       4                               1.00
Shipping               26.675000                       4                               0.75
Billing                 4.300000                       4                               0.00
Account                 2.733333                       3                               0.00
Login                   1.166667                       3                               0.00
```

Same numbers, working sort — but notice the column names are uglier and less predictable than what named aggregation gave you for free back in Step 4. That's the real lesson: prefer `col=("source", "func")` named aggregation from the start, and reserve the dict-of-lists form (and the flatten-afterward fix) for when you're stuck maintaining someone else's older code.

One more trap worth knowing about, because it fails silently rather than loudly: `groupby` **drops missing group keys by default**. If a handful of tickets came through with no `category` at all, they vanish from every summary row with no warning — your `ticket_count` totals just won't add up to `len(tickets)` and nothing tells you why:

```python
messy = pd.DataFrame({"category": ["Billing", None, "Bug"], "resolution_hours": [1.0, 5.0, 10.0]})
messy.groupby("category")["resolution_hours"].mean()      # the None row is gone, no error
messy.groupby("category", dropna=False)["resolution_hours"].mean()   # None shows up as its own group
```

Validate the grouping column before you aggregate — see [handling missing values](/learn/python-data-apis/handling-missing-values) — or pass `dropna=False` deliberately so you at least *see* the orphaned rows instead of losing them to a default you didn't know was there.

## Takeaways

- **`value_counts()` counts one column; `groupby().agg()` answers questions across columns.** Reach for `groupby` the moment "how many" needs a companion like "how long" or "how often."
- **Split-apply-combine isn't an abstraction — it's the manual boolean-mask slice you'd write yourself, run once per group and stitched back together.** If you can write `df[df["col"] == "x"].mean()`, you already understand what `groupby` automates.
- **A custom aggregate is just a function that takes a `Series` and returns a scalar.** Pass it by name — `col=("source", your_function)` — and pandas calls it once per group, exactly like a built-in.
- **Sort on full precision, round only for display**, and sort last — aggregation tells you what's true per group, sorting tells you what to act on.
- **Named aggregation beats dict-of-lists.** The dict form silently hands you `MultiIndex` columns that break `sort_values` and every downstream lookup; flat, self-named columns from the start save you the cleanup.
- **`groupby` drops rows with a missing key by default, with no error.** Check for nulls in your grouping column, or pass `dropna=False` if you need to know they're there.

Once you can rank categories like this, the natural next move is pulling in a second table — say, agent headcount per category — to see if the worst categories are also the most understaffed; that's exactly what [joining and merging dataframes](/learn/python-data-apis/joining-and-merging-dataframes) covers. And if this summary table is headed toward a prompt rather than a dashboard — "write a one-paragraph incident summary for the Bug category" — the shaping rules in [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) pick up right where this leaves off.

**Related:** [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) · [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) · [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) · [handling missing values](/learn/python-data-apis/handling-missing-values) · [joining and merging dataframes](/learn/python-data-apis/joining-and-merging-dataframes) · [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
