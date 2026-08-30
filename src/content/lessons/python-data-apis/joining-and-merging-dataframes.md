---
title: "Joining and Merging DataFrames"
track: "python-data-apis"
status: live
summary: "Deep implementation-walkthrough lesson on pandas merge/concat: builds a tickets+customers example, runs inner/left/outer joins with real captured output showing exactly where NaNs "
duration: "2 min read"
---

Real data lives in more than one table — a tickets table over here, a customers table over there — and the moment you need "who filed this ticket and what plan are they on," you need a join. Get the join type wrong and you don't get an error, you get a DataFrame that's quietly the wrong shape.

## What we're building

A support-ticket pipeline: a `tickets` table (one row per ticket) and a `customers` table (one row per customer), joined on `customer_id` so you can answer questions like "which plan generates the most tickets." Along the way you'll merge the same two tables three different ways — inner, left, outer — look at the *exact* rows and NaNs each one produces, then deliberately break the merge with a duplicated key so you can see how `validate` catches it before it ships. You'll finish by stacking two months of ticket exports with `concat`.

This builds directly on [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) and [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) — if `df.loc` and boolean masks aren't comfortable yet, start there.

## Setup (deps/env)

You need pandas. If you're working in a fresh virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install pandas
```

Confirm it imports:

```python
import pandas as pd
print(pd.__version__)
```

Everything below runs in a plain script or a notebook — no external data files needed, though the same calls work identically once `tickets` and `customers` come from CSV files or a database instead of literal dicts.

## Build it

### Two tables, one shared key

Start with the data you'd actually have: a `tickets` table where `customer_id` is a foreign key, and a `customers` table where `customer_id` is (supposedly) unique.

```python
import pandas as pd

tickets = pd.DataFrame({
    "ticket_id":   [101, 102, 103, 104, 105, 106],
    "customer_id": ["C01", "C02", "C02", "C03", "C05", "C01"],
    "subject":     ["Login issue", "Billing question", "Refund request",
                     "Feature request", "Login issue", "Password reset"],
    "status":      ["open", "closed", "closed", "open", "open", "closed"],
})

customers = pd.DataFrame({
    "customer_id": ["C01", "C02", "C03", "C04"],
    "name":        ["Aiko Tanaka", "Ben Ortiz", "Chidi Okafor", "Dana Reyes"],
    "plan":        ["pro", "free", "pro", "free"],
})
```

Notice two deliberate mismatches: `tickets` has a customer `C05` that doesn't exist in `customers` (maybe the account was deleted after filing a ticket), and `customers` has `C04` who has never filed a ticket. That's realistic — in production, "the two tables agree perfectly" is the exception, not the rule — and it's exactly what makes the next three joins behave differently.

### Inner join: only rows that match on both sides

`merge` defaults to `how="inner"`, which keeps only keys present in *both* DataFrames:

```python
inner = tickets.merge(customers, on="customer_id", how="inner")
print(inner)
print("rows:", len(inner))
```

```
   ticket_id customer_id           subject  status          name  plan
0        101         C01       Login issue    open   Aiko Tanaka   pro
1        102         C02  Billing question  closed     Ben Ortiz  free
2        103         C02    Refund request  closed     Ben Ortiz  free
3        104         C03   Feature request    open  Chidi Okafor   pro
4        106         C01    Password reset  closed   Aiko Tanaka   pro
rows: 5
```

Ticket `105` (customer `C05`) vanished — silently. That's the trap with inner joins: they never tell you what they dropped. If you use `how="inner"` as your default without checking row counts, you can lose real rows and never notice, which is why the next join exists.

### Left join: keep every ticket, even without a customer

`how="left"` keeps every row from the left table (`tickets`) no matter what, filling columns from the right table with `NaN` where there's no match:

```python
left = tickets.merge(customers, on="customer_id", how="left")
print(left)
print("rows:", len(left))
```

```
   ticket_id customer_id           subject  status          name  plan
0        101         C01       Login issue    open   Aiko Tanaka   pro
1        102         C02  Billing question  closed     Ben Ortiz  free
2        103         C02    Refund request  closed     Ben Ortiz  free
3        104         C03   Feature request    open  Chidi Okafor   pro
4        105         C05       Login issue    open           NaN   NaN
5        106         C01    Password reset  closed   Aiko Tanaka   pro
```

Ticket `105` is back, and now you can see exactly why it has NaNs: nothing in `customers` had `customer_id == "C05"`. This is the join to reach for whenever the left table is your "system of record" and you don't want a bad key on the right to erase rows you own. You can isolate exactly the rows that failed to match, which is the fastest way to find data-quality problems:

```python
unmatched = left[left["name"].isna()]
print(unmatched)
```

```
   ticket_id customer_id      subject status name plan
4        105         C05  Login issue   open  NaN  NaN
```

That's your worklist: every ticket referencing a customer that doesn't exist in the customer table, ready to hand to whoever owns customer data. For a general framework on tracking down and handling NaNs, see [handling missing values](/learn/python-data-apis/handling-missing-values).

### Outer join: see everything, including customers with no tickets

`how="outer"` keeps every key from *both* sides — the union — filling NaN wherever a row exists on only one side. Pair it with `indicator=True` to get a `_merge` column that tells you which side each row came from, instead of having to infer it from where the NaNs are:

```python
outer = tickets.merge(customers, on="customer_id", how="outer", indicator=True)
print(outer)
print(outer["_merge"].value_counts())
```

```
   ticket_id customer_id           subject  status          name  plan      _merge
0      101.0         C01       Login issue    open   Aiko Tanaka   pro        both
1      106.0         C01    Password reset  closed   Aiko Tanaka   pro        both
2      102.0         C02  Billing question  closed     Ben Ortiz  free        both
3      103.0         C02    Refund request  closed     Ben Ortiz  free        both
4      104.0         C03   Feature request    open  Chidi Okafor   pro        both
5        NaN         C04               NaN     NaN    Dana Reyes  free  right_only
6      105.0         C05       Login issue    open           NaN   NaN   left_only
```

Now customer `C04` (Dana Reyes) shows up too, with `NaN` ticket columns — she exists but has never filed a ticket, which is a genuinely different fact from "a ticket references a customer that's gone missing." One outer join, `_merge`, and `value_counts()` gives you both problems at once: 1 orphaned ticket (`left_only`), 1 customer with zero support history (`right_only`), 5 clean matches (`both`). Also note `ticket_id` became a float (`101.0`) — with a NaN anywhere in an integer column, pandas has to promote it to float, since NaN doesn't exist as an int. That's a real gotcha worth knowing about before you're confused by a stray `.0` in a column you never touched.

### Catch a many-to-many blowup before it ships

Here's the failure mode that actually costs people hours: you *believe* `customer_id` is unique in `customers`, so you treat the merge as "many tickets to one customer." But suppose a duplicate slipped in — say a plan-upgrade event got logged as a second row for `C02` instead of updating the existing one:

```python
customers_dupe = pd.concat([
    customers,
    pd.DataFrame({"customer_id": ["C02"], "name": ["Ben Ortiz"], "plan": ["pro"]}),
], ignore_index=True)
```

Merge against it the same way as before, with no validation:

```python
exploded = tickets.merge(customers_dupe, on="customer_id", how="left")
print("rows:", len(exploded), "vs original tickets:", len(tickets))
```

```
rows: 8 vs original tickets: 6
```

Every ticket for `C02` got duplicated, because pandas matched it against *both* rows for `C02` and produced the cross product. Nothing crashed. No warning printed. If this merge feeds a revenue report or a "tickets per customer" count, your numbers are now wrong and nobody will know until someone eyeballs a total that looks off. This is the single most common way merges silently corrupt a pipeline.

The fix is to state your assumption and let pandas enforce it with `validate`:

```python
try:
    tickets.merge(customers_dupe, on="customer_id", how="left", validate="many_to_one")
except Exception as e:
    print(type(e).__name__, "-", e)
```

```
MergeError - Merge keys are not unique in right dataset; not a many-to-one merge
```

`validate="many_to_one"` says "I expect many rows on the left per key, but at most one on the right" — and pandas raises `MergeError` the instant that's false, instead of letting the row count balloon. The other options are `"one_to_one"` (both sides unique — classic primary-key-to-primary-key join), `"one_to_many"` (the mirror image of what we just did), and `"many_to_many"` (no check at all — the default, and rarely what you actually want). Treat `validate` the way you'd treat an assertion in any other code: cheap to add, and it turns a silent data bug into a loud, immediate one. It pairs well with the broader habit of [validating DataFrames against a schema](/learn/python-data-apis/validating-dataframes-with-schemas) before anything downstream trusts them.

### Stack tables with concat instead of merging

Merging combines two tables *sideways* by matching keys. Sometimes you don't want that at all — you want two tables with the *same columns* stacked on top of each other, like combining August's ticket export with September's. That's `concat`, not `merge`:

```python
tickets_aug = tickets
tickets_sep = pd.DataFrame({
    "ticket_id":   [201, 202],
    "customer_id": ["C03", "C04"],
    "subject":     ["Upgrade question", "Cancellation"],
    "status":      ["open", "open"],
})

combined = pd.concat([tickets_aug, tickets_sep], ignore_index=True)
print(combined)
```

```
   ticket_id customer_id           subject  status
0        101         C01       Login issue    open
1        102         C02  Billing question  closed
2        103         C02    Refund request  closed
3        104         C03   Feature request    open
4        105         C05       Login issue    open
5        106         C01    Password reset  closed
6        201         C03  Upgrade question    open
7        202         C04      Cancellation    open
```

`ignore_index=True` resets the row index to `0..n-1` instead of keeping each frame's original index (which would give you two rows both labeled `0`). If you want to know which month a row came from *without* adding a column yourself, pass a dict instead of a list — pandas builds a `MultiIndex` from the keys:

```python
combined_keys = pd.concat({"aug": tickets_aug, "sep": tickets_sep})
print(combined_keys)
```

```
       ticket_id customer_id           subject  status
aug 0        101         C01       Login issue    open
    1        102         C02  Billing question  closed
    ...
sep 0        201         C03  Upgrade question    open
    1        202         C04      Cancellation    open
```

Rule of thumb: reach for `merge` when you're joining on a key across *different* entities (tickets and customers). Reach for `concat` when you have the *same* entity split across multiple sources (this month's tickets and last month's tickets, or one CSV per region).

## Run it

Put the steps above in one script and run it top to bottom. You should see, in order: 5 rows out of the inner join (ticket 105 dropped), 6 rows out of the left join (ticket 105 present with NaN `name`/`plan`), 7 rows out of the outer join (both ticket 105 and customer C04 present, `_merge` showing 5 `both` / 1 `left_only` / 1 `right_only`), a jump to 8 rows when you merge against the duplicated customer table with no `validate`, a `MergeError` the moment you add `validate="many_to_one"`, and 8 rows out of `concat`ing the two monthly exports. If your row counts at each step don't match that pattern, the discrepancy itself tells you where to look — a merge that produces more rows than you expect almost always means a duplicate key, and one that produces fewer usually means a type or whitespace mismatch in the join column.

## Harden it

A few things that go wrong with real merges, beyond the toy case above:

**Check dtypes before you merge, not after.** If `customer_id` is stored as a string in one table and an int64 in the other (extremely common when one table came from a CSV and the other from a database), the merge won't raise an error — it will just fail to match anything on that side, and you'll get a suspiciously large number of `NaN`s that look like a missing-data problem when it's actually a type problem.

```python
print(tickets["customer_id"].dtype, customers["customer_id"].dtype)
```

**Watch for column name collisions.** If both tables have a `status` column with different meanings (ticket status vs. account status), merge will rename them `status_x` and `status_y` by default. That's easy to miss in a wide DataFrame — pass `suffixes=("_ticket", "_customer")` explicitly so the result is self-documenting instead of relying on you remembering which table came first.

**Always check row counts immediately after a merge**, even when you're confident about the keys:

```python
before = len(tickets)
after = len(tickets.merge(customers, on="customer_id", how="left"))
assert after == before, f"left join changed row count: {before} -> {after}"
```

A left join changing your row count is *always* a many-to-many key hiding on the right side — this assertion catches the exact bug `validate` catches, and it's cheap enough to leave in a pipeline permanently.

**`validate` isn't just for catching accidents** — write it as documentation of your assumption even when you're sure the data is clean today. Data that's unique now won't necessarily stay unique after someone else's upstream change, and `validate="one_to_one"` on what should be a primary-key join is a one-line guarantee that a future duplicate gets caught at merge time instead of three dashboards downstream.

**For concat, check that columns actually line up.** `pd.concat` will happily stack DataFrames with different columns, filling the gaps with NaN — which is sometimes what you want (evolving schemas across months) and sometimes a sign you loaded the wrong file. `combined.columns` and a quick `combined.isna().sum()` after concatenating tells you immediately whether the shapes agreed.

## Extend it

Once a join is this legible, a few directions open up naturally:

- **Multi-column keys.** Pass a list to `on` (or use `left_on`/`right_on` when the column names differ between tables) when a single column isn't unique enough — e.g., joining on `(customer_id, region)` instead of `customer_id` alone.
- **Merge, then aggregate.** The enriched `left` DataFrame from this lesson is the natural input to [groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) — group the joined table by `plan` to answer "which plan generates the most tickets," now that every ticket carries its customer's plan.
- **Merging on an index instead of a column** with `left_index=True, right_index=True` (or just `.join()`, which is `merge` specialized for index-based joins) when your key is already the DataFrame's index.
- **Feed the result into a schema check.** After a merge is the right moment to assert the columns and dtypes you expect exist, before this DataFrame goes anywhere near a model or an API call.
- **Do this for real files.** Swap the literal `pd.DataFrame({...})` calls for `pd.read_csv(...)`, and every join, NaN pattern, and `validate` check here behaves identically — see [loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) for reading real sources in.

**Related:** [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) · [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) · [groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [handling missing values](/learn/python-data-apis/handling-missing-values) · [validating DataFrames with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [loading data into pandas](/learn/python-data-apis/loading-data-into-pandas)
