---
title: "Selecting, Filtering, and Indexing Rows"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough of loc, iloc, and boolean masks on a support-ticket DataFrame — nailing the label-vs-position distinction, combining conditions safely, and avoiding the brac"
duration: "22 min read"
---

A DataFrame is only useful once you can carve it up — and pandas gives you three different ways to do it that look similar, behave differently, and will absolutely bite you if you mix them up. Let's build a real ticket table and use it to make the differences concrete.

## What we're building

You're going to load a support-ticket table for a small SaaS company — twelve tickets with a priority, a status, an hours-open count, and an assignee — and then:

- Pull specific rows and columns two ways: by **label** (`.loc`) and by **position** (`.iloc`)
- Build boolean masks, combine them with `&`, `|`, and `~`, and use them to filter
- Hit the classic bracket-chaining trap head-on, see exactly what it does (and doesn't do), and fix it
- Add a real derived column — `is_overdue` — computed from a per-priority SLA, using nothing but vectorized boolean logic

By the end you'll have working code that turns "which tickets need attention right now" from a question you'd answer by eyeballing a spreadsheet into one line of pandas that's correct every time.

If you haven't already, skim [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) — this lesson assumes you know what a DataFrame and an Index are and picks up from there.

## Setup

You need pandas (and NumPy, which pandas pulls in anyway). If you're working in a virtual environment — and you should be, see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) if you haven't set one up — install with:

```bash
pip install pandas numpy
```

One version note that matters for this lesson specifically: pandas 3.x ships with **Copy-on-Write** enabled by default (it was optional, and off by default, in pandas 2.x). That changes exactly what happens when you make the bracket-chaining mistake below — on pandas 3.x it's a guaranteed no-op with a `ChainedAssignmentError` warning; on older pandas you'd sometimes see a `SettingWithCopyWarning` and the write would *sometimes* silently work depending on internal memory layout. Either way, the fix in this lesson is identical and correct on any version. Check what you're running with `python -c "import pandas; print(pandas.__version__)"`.

Everything below runs as a single script — call it `tickets.py`.

## Build it

### Set up the ticket table with a real index

```python
import pandas as pd
import numpy as np

tickets = pd.DataFrame({
    "ticket_id": ["T-1001", "T-1002", "T-1003", "T-1004", "T-1005", "T-1006",
                  "T-1007", "T-1008", "T-1009", "T-1010", "T-1011", "T-1012"],
    "customer": ["Nova Retail", "Bright Path", "Nova Retail", "Quokka Labs", "Bright Path",
                 "Fenwick & Co", "Quokka Labs", "Nova Retail", "Fenwick & Co", "Bright Path",
                 "Quokka Labs", "Nova Retail"],
    "priority": ["high", "low", "urgent", "medium", "high", "low",
                 "urgent", "medium", "high", "medium", "low", "urgent"],
    "status": ["open", "resolved", "open", "pending", "open", "closed",
               "pending", "open", "resolved", "open", "pending", "open"],
    "category": ["billing", "bug", "account", "bug", "feature_request", "billing",
                 "account", "bug", "billing", "feature_request", "bug", "account"],
    "hours_open": [5.5, 40.0, 2.0, 30.0, 50.0, 12.0, 6.5, 90.0, 15.0, 200.0, 60.0, 1.0],
    "assigned_to": ["Priya", "Priya", "Devon", "Devon", "Marco", "Marco",
                     "Priya", "Devon", "Marco", "Priya", "Devon", "Marco"],
})

tickets = tickets.set_index("ticket_id")
print(tickets)
```

```
               customer priority    status         category  hours_open assigned_to
ticket_id
T-1001      Nova Retail     high      open          billing         5.5       Priya
T-1002      Bright Path      low  resolved              bug        40.0       Priya
T-1003      Nova Retail   urgent      open          account         2.0       Devon
T-1004      Quokka Labs   medium   pending              bug        30.0       Devon
T-1005      Bright Path     high      open  feature_request        50.0       Marco
T-1006     Fenwick & Co      low    closed          billing        12.0       Marco
T-1007      Quokka Labs   urgent   pending          account         6.5       Priya
T-1008      Nova Retail   medium      open              bug        90.0       Devon
T-1009     Fenwick & Co     high  resolved          billing        15.0       Marco
T-1010      Bright Path   medium      open  feature_request       200.0       Priya
T-1011      Quokka Labs      low   pending              bug        60.0       Devon
T-1012      Nova Retail   urgent      open          account         1.0       Marco
```

`set_index("ticket_id")` matters more than it looks like it does. Once `ticket_id` is the index, it becomes a **label** — a name you can address rows by — rather than just another column of data. That's the whole setup for the next two sections. (If you're loading this from a CSV instead of building it inline, see [Reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) — `pd.read_csv("tickets.csv", index_col="ticket_id")` does both steps in one call.)

### Select by label with `.loc`

```python
print(tickets.loc[["T-1001", "T-1004"], ["customer", "priority"]])
```

```
              customer priority
ticket_id
T-1001     Nova Retail     high
T-1004     Quokka Labs   medium
```

`.loc` takes two selectors — `.loc[rows, columns]` — and both are **label-based**. You hand it the actual index values and column names you want, in any order, and it finds them. This is the same style you'd use for a dict lookup: you don't care where `"T-1004"` physically sits in the table, you care that it's the row named `"T-1004"`.

`.loc` also slices by label:

```python
print(tickets.loc["T-1001":"T-1004", ["priority", "hours_open"]])
```

```
          priority  hours_open
ticket_id
T-1001        high         5.5
T-1002         low        40.0
T-1003      urgent         2.0
T-1004      medium        30.0
```

Notice that's **four** rows, not three. Label slices in pandas are inclusive on both ends — `"T-1001":"T-1004"` means "everything from T-1001 through T-1004, inclusive." That's the opposite of how Python list slicing works, and it's deliberate: with labels, there's no natural "one past the end" the way there is with integers, so pandas includes the endpoint you named.

### Select by position with `.iloc`

```python
print(tickets.iloc[[0, 3], [0, 1]])
```

```
              customer priority
ticket_id
T-1001     Nova Retail     high
T-1004     Quokka Labs   medium
```

Same output as the `.loc` call above — because right now, row 0 happens to be labeled `"T-1001"` and row 3 happens to be labeled `"T-1004"`. `.iloc` doesn't know or care about labels at all; it only understands integer position, exactly like indexing a plain Python list. `tickets.iloc[[0, 3], [0, 1]]` means "row at position 0 and row at position 3, column at position 0 and column at position 1" — full stop.

The coincidence breaks the moment you slice, and this is the detail worth sitting with:

```python
print(tickets.iloc[0:4, [1, 4]])
```

```
          priority  hours_open
ticket_id
T-1001        high         5.5
T-1002         low        40.0
T-1003      urgent         2.0
T-1004      medium        30.0
```

`0:4` in `.iloc` is a **half-open** range — positions 0, 1, 2, 3, stopping before 4 — because it's integer slicing, same rule as `my_list[0:4]`. It happens to land on the same four tickets as the `.loc` label slice above only because the index hasn't been reordered or filtered yet. Sort this DataFrame by `hours_open`, or filter it down to a subset, and `.iloc[0:4]` will grab a completely different set of rows than `.loc["T-1001":"T-1004"]` will — the labels move with the data, the positions don't. That's the entire label-vs-position distinction in one sentence: **`.loc` follows the data, `.iloc` follows the seat numbers.**

### Build a boolean mask

```python
urgent_mask = tickets["priority"] == "urgent"
print(urgent_mask)
```

```
ticket_id
T-1001    False
T-1002    False
T-1003     True
T-1004    False
T-1005    False
T-1006    False
T-1007     True
T-1008    False
T-1009    False
T-1010    False
T-1011    False
T-1012     True
dtype: bool
```

`tickets["priority"] == "urgent"` isn't a filtered table — it's a `Series` of `True`/`False` values, one per row, carrying the *same index* as `tickets`. That index alignment is the mechanism: when you drop this mask into `tickets[urgent_mask]`, pandas lines it up against `tickets`'s own index and keeps only the rows where it reads `True`.

```python
print(tickets[urgent_mask])
```

```
              customer priority   status category  hours_open assigned_to
ticket_id
T-1003     Nova Retail   urgent     open  account         2.0       Devon
T-1007     Quokka Labs   urgent  pending  account         6.5       Priya
T-1012     Nova Retail   urgent     open  account         1.0       Marco
```

This is the same mechanism NumPy uses for array masking — see [NumPy indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) if you want the underlying array-level version of this idea. pandas just adds the label alignment on top.

### Combine conditions with `&`, `|`, `~` — and parentheses

You cannot use Python's `and` / `or` / `not` here. Try it:

```python
mask = tickets["priority"] == "urgent" and tickets["hours_open"] > 10
```

```
ValueError: The truth value of a Series is ambiguous. Use a.empty, a.bool(), a.item(), a.any() or a.all().
```

`and` needs a single `True`/`False` to branch on, but `tickets["priority"] == "urgent"` is twelve of them — pandas has no way to collapse a whole Series into one boolean, so it refuses rather than guess. pandas overloads `&`, `|`, and `~` instead, because those operate element-by-element the way you actually want.

But swapping the keyword for the operator isn't quite enough on its own — operator precedence bites you next:

```python
mask = tickets["hours_open"] > 10 & tickets["hours_open"] < 60
```

```
TypeError: Cannot perform 'rand_' with a dtyped [float64] array and scalar of type [bool]
```

`&` binds *tighter* than `>` in Python, so that line actually parses as `tickets["hours_open"] > (10 & tickets["hours_open"]) < 60` — nonsense. The fix is to wrap every individual comparison in its own parentheses, no exceptions:

```python
overdue_high_priority = (tickets["priority"].isin(["high", "urgent"])) & (tickets["hours_open"] > 10)
print(tickets[overdue_high_priority])
```

```
              customer priority status         category  hours_open assigned_to
ticket_id
T-1005     Bright Path     high   open  feature_request        50.0       Marco
T-1009    Fenwick & Co     high   resolved         billing        15.0       Marco
```

`.isin([...])` is the clean way to check membership against a list of values instead of chaining `== "high" | == "urgent"`. Now a three-condition example mixing `&`, `|`, and `~`:

```python
needs_attention = (
    (tickets["status"] != "resolved") & (tickets["status"] != "closed") &
    ((tickets["priority"] == "urgent") | (tickets["hours_open"] > 48))
)
print(tickets[needs_attention])
```

```
              customer priority   status         category  hours_open assigned_to
ticket_id
T-1003     Nova Retail   urgent     open          account         2.0       Devon
T-1005     Bright Path     high     open  feature_request        50.0       Marco
T-1007     Quokka Labs   urgent  pending          account         6.5       Priya
T-1008     Nova Retail   medium     open              bug        90.0       Devon
T-1010     Bright Path   medium     open  feature_request       200.0       Priya
T-1011     Quokka Labs      low  pending              bug        60.0       Devon
T-1012     Nova Retail   urgent     open          account         1.0       Marco
```

Read that mask left to right and it matches the plain-English rule exactly: not resolved, and not closed, and (urgent, or open more than 48 hours). Wrapping the `|` clause in its own parentheses keeps it from getting swallowed by the surrounding `&`s.

### Select rows and columns together

`.loc` accepts a boolean mask as the row selector and a column list as the second argument, in the same call:

```python
print(tickets.loc[needs_attention, ["priority", "status", "hours_open"]])
```

```
          priority   status  hours_open
ticket_id
T-1003      urgent     open         2.0
T-1005        high     open        50.0
T-1007      urgent  pending         6.5
T-1008      medium     open        90.0
T-1010      medium     open       200.0
T-1011         low  pending        60.0
T-1012      urgent     open         1.0
```

This is worth internalizing as the default habit: `df.loc[row_selector, column_selector]`, one call, where `row_selector` can be a label, a list of labels, a slice, or a boolean mask. It's more typing than `df[mask]`, but it sets you up for the next section — because `df[mask]` is exactly where the trap starts.

### The bracket-chaining trap

Say you want to mark every urgent ticket as escalated. The instinct is to filter, then assign into the result:

```python
tickets_copy = tickets.copy()
tickets_copy[tickets_copy["priority"] == "urgent"]["status"] = "escalated"
```

Run that and you'll see a warning fire, and then find the data didn't change:

```
ChainedAssignmentError: A value is being set on a copy of a DataFrame or Series through chained assignment.
Such chained assignment never works to update the original DataFrame or Series, because the intermediate object on which we are setting values always behaves as a copy (due to Copy-on-Write).

Try using '.loc[row_indexer, col_indexer] = value' instead, to perform the assignment in a single step.
```

```python
print(tickets_copy.loc[tickets_copy["priority"] == "urgent", "status"])
```

```
ticket_id
T-1003       open
T-1007    pending
T-1012       open
Name: status, dtype: str
```

Still `open` and `pending` — the assignment silently went nowhere. Here's why: `tickets_copy[tickets_copy["priority"] == "urgent"]` is evaluated *first*, on its own, and it hands back a brand-new, temporary DataFrame containing just the matching rows. The `["status"] = "escalated"` that follows sets a value on *that* temporary object — which nothing else holds a reference to — and then it's gone. Two separate bracket operations, two separate objects; only the second one gets written to, and it was never the one you wanted.

The fix is to make it one operation instead of two, using `.loc` for both the filter and the assignment simultaneously:

```python
fixed = tickets.copy()
fixed.loc[fixed["priority"] == "urgent", "status"] = "escalated"
print(fixed.loc[fixed["priority"] == "urgent", ["priority", "status"]])
```

```
          priority     status
ticket_id
T-1003      urgent  escalated
T-1007      urgent  escalated
T-1012      urgent  escalated
```

`fixed.loc[mask, "status"] = "escalated"` is a single `__setitem__` call on `fixed` itself — there's no intermediate object for the write to get lost in. This is the rule to carry forward: **never chain a second `[...]` onto the result of a first `[...]` when you intend to assign.** If you see two brackets in a row on the left side of an `=`, stop and rewrite it as one `.loc` call. The next lesson, [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes), goes deeper into the view-vs-copy mechanics behind this — worth reading once this pattern feels familiar, not before.

### Assign a derived column with vectorized logic

Now put all of it together: compute a per-priority SLA threshold, and flag every ticket that's blown past its SLA and still isn't closed out.

```python
sla_hours = {"urgent": 4, "high": 24, "medium": 72, "low": 168}

result = tickets.copy()
result["sla_hours"] = result["priority"].map(sla_hours)
result["is_overdue"] = (
    (result["hours_open"] > result["sla_hours"]) &
    (~result["status"].isin(["resolved", "closed"]))
)

print(result[["priority", "status", "hours_open", "sla_hours", "is_overdue"]])
```

```
          priority    status  hours_open  sla_hours  is_overdue
ticket_id
T-1001        high      open         5.5         24       False
T-1002         low  resolved        40.0        168       False
T-1003      urgent      open         2.0          4       False
T-1004      medium   pending        30.0         72       False
T-1005        high      open        50.0         24        True
T-1006         low    closed        12.0        168       False
T-1007      urgent   pending         6.5          4        True
T-1008      medium      open        90.0         72        True
T-1009        high  resolved        15.0         24       False
T-1010      medium      open       200.0         72        True
T-1011         low   pending        60.0        168       False
T-1012      urgent      open         1.0          4       False
```

Three things happening here, each worth naming:

1. `.map(sla_hours)` looks up every value in `priority` against the dict and returns a new column — one lookup per row, no loop written by you.
2. `result["hours_open"] > result["sla_hours"]` compares two full columns element-by-element and returns a boolean Series, same shape as before.
3. `~result["status"].isin([...])` is `~` (not) applied to a mask — "status is *not* one of these."

`&` glues the two boolean Series together, and the whole right-hand side becomes one column assignment. Nothing here is a Python `for` loop over rows — it's the same broadcasting model you'd use on a NumPy array, which is exactly why it stays fast as the table grows from twelve rows to twelve million.

## Run it

Running the script above end to end, in order, produces exactly the output shown at each step. A couple of numbers worth confirming once you run it yourself:

- `result["is_overdue"].sum()` → `4` — booleans sum as 0/1, so this is a free row count. The four are T-1005, T-1007, T-1008, and T-1010.
- Pulling just those and sorting by how overdue they are:

```python
print(
    result.loc[result["is_overdue"], ["customer", "priority", "hours_open", "sla_hours"]]
    .sort_values("hours_open", ascending=False)
)
```

```
              customer priority  hours_open  sla_hours
ticket_id
T-1010     Bright Path   medium       200.0         72
T-1008     Nova Retail   medium        90.0         72
T-1005     Bright Path     high        50.0         24
T-1007     Quokka Labs   urgent         6.5          4
```

That last row is the one that makes the SLA-aware column worth building in the first place: T-1007 has the fewest raw hours open of anything in the table, but it's urgent, its SLA is 4 hours, and it's already 2.5 hours past it. A plain "sort by hours_open" would've buried it at the bottom.

## Harden it

A handful of things go wrong with this pattern in real data that don't show up in a clean twelve-row example:

**NaN in the compared column silently drops rows, it doesn't error.** If `hours_open` had a missing value for some ticket, `result["hours_open"] > result["sla_hours"]` evaluates to `False` for that row — not an error, not `NaN` in the mask, just `False`. That ticket quietly never counts as overdue no matter how stale it is. Before filtering on a column, check for gaps explicitly:

```python
print(tickets["hours_open"].isna().sum())
```

If that's nonzero, decide deliberately — drop those rows, or fill them — rather than let the comparison decide for you. See [Handling missing values](/learn/python-data-apis/handling-missing-values) for the fill-vs-drop tradeoffs.

**A mask built against one DataFrame doesn't transfer safely to a differently-shaped one.** If you build `mask = tickets["priority"] == "urgent"` and then filter or re-index `tickets` before applying it, pandas aligns by index label — rows the mask doesn't recognize come back as `False` (or `NaN` in some contexts) rather than raising. Rebuild the mask against the current frame instead of reusing a stale one.

**`.loc` and `.iloc` raise on a selector that doesn't exist — catch it if the label is user-supplied:**

```python
try:
    tickets.loc["T-9999"]
except KeyError as e:
    print(f"no such ticket: {e}")
```

`.iloc` does the same with an out-of-range position, raising `IndexError` instead. Neither fails silently, which is the behavior you want — but only if you're prepared to catch it rather than let the script crash on the first bad ID from a form or a query string.

**Comparing across mismatched types returns `False`, not an error.** `tickets["hours_open"] == "40"` (string, not `40.0`) won't raise — it'll just never match, because pandas compares element-wise and a float never equals a string. If a filter is quietly returning zero rows, check `.dtypes` before you check your logic; see [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) for getting columns into the type you think they're in.

**When you actually want an independent copy, say so.** `subset = tickets[mask]` followed later by edits to `subset` is fine *if you never intend those edits to touch `tickets`* — but pandas may warn about it anyway since it can't read your intent. Make the intent explicit with `.copy()`: `subset = tickets[mask].copy()`. That silences the ambiguity and documents, right there in the code, that `subset` is now its own thing.

## Extend it

A few directions to take this once the core pattern is solid:

- **`.query()`** gives you the same filter as a readable string, useful once conditions stack up — reference external variables with `@`:

  ```python
  min_hours = 48
  print(tickets.query('status not in ["resolved", "closed"] and (priority == "urgent" or hours_open > @min_hours)'))
  ```

  This produces the identical seven rows as the `needs_attention` mask above — same logic, different syntax. Reach for it when a boolean expression gets long enough that the `&`/`|`/parentheses version starts hurting to read.

- **Scalar access with `.at` / `.iat`.** If you only need one cell — not a row, not a column, one value — `tickets.at["T-1003", "status"]` (label) or `tickets.iat[2, 2]` (position) skip the row-then-column indexing overhead of `.loc`/`.iloc` and are the right tool when you're doing this in a loop over many single lookups.

- **Feed the filtered, derived table into `groupby`.** Now that `is_overdue` exists as a real column, "which assignee has the most overdue tickets" is one line away — see [GroupBy and aggregation](/learn/python-data-apis/groupby-and-aggregation) for `result.groupby("assigned_to")["is_overdue"].sum()` and the aggregation patterns around it.

- **Bring in a second table.** A real version of this ticket table would join against a customers table for account tier or region before you filter — [Joining and merging DataFrames](/learn/python-data-apis/joining-and-merging-dataframes) covers combining frames before you slice them, which is usually the right order of operations: join first, filter second.

**Related:** [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) · [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) · [GroupBy and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [Handling missing values](/learn/python-data-apis/handling-missing-values) · [NumPy indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) · [Joining and merging DataFrames](/learn/python-data-apis/joining-and-merging-dataframes)
