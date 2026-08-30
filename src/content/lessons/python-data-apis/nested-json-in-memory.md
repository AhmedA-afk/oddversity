---
title: "Navigating Nested JSON in Python"
track: "python-data-apis"
status: live
summary: "A worked example that takes a realistic nested API response (user → orders → line items), walks it with loops and dict access, sums line-item totals with sum() + a generator expres"
duration: "13 min read"
---

An API response for one user can nest three levels deep — user, then orders, then line items — before you reach an actual number worth adding up. Here's how to walk that structure and total it correctly, without your script dying the moment one record is less clean than the rest.

## The setup (specific)

Say you're writing a script that reports how much a customer has spent. You call an internal orders API — `GET /users/usr_8841` — and get back this, already parsed by `response.json()` into native Python dicts and lists (see [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) if you want the request side too):

```json
{
  "user": {
    "id": "usr_8841",
    "name": "Priya Shah",
    "email": "priya@example.com",
    "orders": [
      {
        "order_id": "ord_2201",
        "status": "delivered",
        "items": [
          {"sku": "WM-1044", "name": "Wireless Mouse", "quantity": 2, "unit_price": 24.99},
          {"sku": "USB-C-2M", "name": "USB-C Cable (2m)", "quantity": 1, "unit_price": 9.50, "discount": 2.00}
        ]
      },
      {
        "order_id": "ord_2214",
        "status": "processing",
        "items": [
          {"sku": "KB-77", "name": "Mechanical Keyboard", "quantity": 1, "unit_price": 89.00}
        ]
      },
      {
        "order_id": "ord_2233",
        "status": "delivered",
        "items": [
          {"sku": "MON-27", "name": "27-inch Monitor", "quantity": 1}
        ]
      }
    ]
  }
}
```

Skip the network call for this walkthrough and work with the parsed result directly — it's the same dict-of-lists-of-dicts shape `response.json()` would hand you (more on that shape in nested JSON in memory):

```python
data = {
    "user": {
        "id": "usr_8841",
        "name": "Priya Shah",
        "email": "priya@example.com",
        "orders": [
            {
                "order_id": "ord_2201",
                "status": "delivered",
                "items": [
                    {"sku": "WM-1044", "name": "Wireless Mouse", "quantity": 2, "unit_price": 24.99},
                    {"sku": "USB-C-2M", "name": "USB-C Cable (2m)", "quantity": 1, "unit_price": 9.50, "discount": 2.00},
                ],
            },
            {
                "order_id": "ord_2214",
                "status": "processing",
                "items": [
                    {"sku": "KB-77", "name": "Mechanical Keyboard", "quantity": 1, "unit_price": 89.00},
                ],
            },
            {
                "order_id": "ord_2233",
                "status": "delivered",
                "items": [
                    {"sku": "MON-27", "name": "27-inch Monitor", "quantity": 1},
                ],
            },
        ],
    }
}
```

Notice the third order's only item has no `unit_price` at all. That's not a typo — it's the kind of gap real APIs produce (a bundled item, a backend that only fills the field once a price is confirmed, a partial record). The goal: for each order, compute `quantity * unit_price - discount` per item, sum to an order subtotal, sum those to a grand total, and print a report — without the missing field taking the whole script down.

## Step by step

**Step 1 — pull out the parts you know are there.**

```python
user = data["user"]
orders = user["orders"]
print(f"{user['name']} has {len(orders)} orders")
```

```text
Priya Shah has 3 orders
```

> **Why this step?** `data["user"]`, `user["orders"]` — plain bracket indexing, no `.get()` in sight. That's deliberate. This is your API's contract: a successful response to `/users/{id}` always has a `user` object with an `orders` list. If one of those keys is ever missing, that's not a "default to something reasonable" situation — it's a broken response worth a loud `KeyError` so you notice, not a silent empty list that lets a bug hide. Reserve defensive lookups for fields whose absence is expected, not for the shape you're relying on to even start processing. That distinction — what your contract guarantees versus what it doesn't — is worth making explicit; see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation).

**Step 2 — loop over orders, then over each order's items.**

```python
for order in orders:
    for item in order["items"]:
        print(order["order_id"], item["sku"])
```

```text
ord_2201 WM-1044
ord_2201 USB-C-2M
ord_2214 KB-77
ord_2233 MON-27
```

Two nested `for` loops, nothing fancier than that. `order["items"]` is a guaranteed key too (every order has an items list, even if it's empty) — still fine to index directly.

**Step 3 — compute a line item's total, defensively, where the field is genuinely optional.**

```python
def line_item_total(item, order_id):
    quantity = item.get("quantity", 0)
    unit_price = item.get("unit_price")
    if unit_price is None:
        print(f"  ! {order_id}: {item.get('sku', '?')} has no unit_price — treating as $0")
        unit_price = 0
    discount = item.get("discount", 0)
    return quantity * unit_price - discount
```

> **Why this step?** Two fields are missing sometimes here, and they mean different things. `discount` absent just means "no discount applied" — zero is the correct, boring default, so `item.get("discount", 0)` is the whole story. `unit_price` absent means something is wrong with the record — silently defaulting it to 0 would make a $0 line item look identical to a genuinely free one, which quietly corrupts your total. So instead of `.get("unit_price", 0)`, this calls `.get("unit_price")` with **no** default (which returns `None` if the key is missing), checks for `None` explicitly, and only then substitutes 0 — after printing a warning so the gap stays visible instead of vanishing into the arithmetic. `.get(key, default)` is for "missing is fine and here's the fallback." `.get(key)` plus an `is None` check is for "missing is suspicious, and I want to know about it before I paper over it."

**Step 4 — sum items into an order subtotal, then orders into a report.**

```python
report = []
grand_total = 0

for order in orders:
    subtotal = sum(line_item_total(item, order["order_id"]) for item in order["items"])
    grand_total += subtotal
    report.append((order["order_id"], order["status"], subtotal))

for order_id, status, subtotal in report:
    print(f"{order_id:10} {status:12} ${subtotal:.2f}")
print(f"{'TOTAL':10} {'':12} ${grand_total:.2f}")
```

```text
  ! ord_2233: MON-27 has no unit_price — treating as $0
ord_2201   delivered    $57.48
ord_2214   processing   $89.00
ord_2233   delivered    $0.00
TOTAL                   $146.48
```

Check the arithmetic on `ord_2201`: `(2 × 24.99 − 0) + (1 × 9.50 − 2.00)` = `49.98 + 7.50` = `57.48`. That matches.

> **Why this step?** `sum(line_item_total(item, ...) for item in order["items"])` is a generator expression, not a list comprehension — no `[` and `]`. It reads as one sentence ("the subtotal is the sum of each item's total") and never builds an intermediate list just to throw it away, which matters once `items` gets long. If comprehension syntax like this is new, [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) covers the mechanics; the pattern of "loop, extract one field per iteration, combine with a builtin like `sum()` or `max()`" comes up constantly once you're past toy dicts and into real [Python data structures](/learn/python-data-apis/python-data-structures-for-data-work).

## Where it breaks

Here's the version most people write first — direct indexing all the way down, because it's what feels natural and it's what tutorials show you on clean data:

```python
def order_total_naive(order):
    total = 0
    for item in order["items"]:
        total += item["quantity"] * item["unit_price"] - item["discount"]
    return total

for order in orders:
    print(order["order_id"], order_total_naive(order))
```

Run it and nothing prints — not even `ord_2201`, which has perfectly good data:

```text
Traceback (most recent call last):
  File "report.py", line 7, in <module>
    print(order["order_id"], order_total_naive(order))
                              ^^^^^^^^^^^^^^^^^^^^^^^^
  File "report.py", line 4, in order_total_naive
    total += item["quantity"] * item["unit_price"] - item["discount"]
                                                       ~~~~^^^^^^^^^^^^
KeyError: 'discount'
```

The very first item — the wireless mouse, `ord_2201` — has no `discount` key, and `item["discount"]` raises immediately. The whole report dies before a single line prints, even though two of the three orders are completely fine.

Say you patch just that symptom:

```python
def order_total_v2(order):
    total = 0
    for item in order["items"]:
        total += item["quantity"] * item["unit_price"] - item.get("discount", 0)
    return total
```

Now `ord_2201` and `ord_2214` print correctly — but it dies further into the loop, on a different key:

```text
ord_2201 57.48
ord_2214 89.0
Traceback (most recent call last):
  File "report.py", line 6, in <module>
    print(order["order_id"], order_total_v2(order))
                              ^^^^^^^^^^^^^^^^^^^^^
  File "report.py", line 4, in order_total_v2
    total += item["quantity"] * item["unit_price"] - item.get("discount", 0)
                                 ~~~~^^^^^^^^^^^^^^^
KeyError: 'unit_price'
```

That's the pattern with fixing keys one at a time: you're chasing whichever `KeyError` shows up next, not asking the real question — which keys does this API actually guarantee, and which ones vary? [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) is about answering that question once, up front, instead of discovering it one crash at a time in production.

There's a sneakier version of this bug, too. Suppose the monitor's record hadn't omitted `unit_price` — suppose the API had sent it as an explicit null instead:

```json
{"sku": "MON-27", "name": "27-inch Monitor", "quantity": 1, "unit_price": null}
```

`item.get("unit_price", 0)` on that record returns `None`, not `0` — the default in `.get()` only fires when the **key is absent**, and here the key is present with a null value. So `quantity * unit_price` becomes `1 * None`, which fails a step later and looks completely different:

```text
TypeError: unsupported operand type(s) for *: 'int' and 'NoneType'
```

Same underlying problem — no usable price — but now it's a `TypeError` on the multiplication line instead of a `KeyError` on the lookup line, which is a more confusing trail to follow backward. This is exactly why `line_item_total` in Step 3 called `.get("unit_price")` with no default and checked for `None` itself, rather than leaning on `.get(key, 0)`: that pattern treats "missing" and "explicitly null" as the same case — both come back as `None` — and handles both with one deliberate check, instead of a default that only quietly covers one of the two.

The short version: a `KeyError` means you assumed a key exists and were wrong. `.get()` means you asked, and decided in your own code what happens when the answer is no.

## Takeaways

- Index directly (`d["key"]`) for keys your data source guarantees. If that contract breaks, you want a loud crash immediately, not a silently wrong number three steps later.
- Use `.get(key, default)` when a key's absence has a mundane, expected meaning — "no discount" really is "$0 discount."
- When a key's absence is a data-quality problem rather than a normal case, don't paper over it with a default. Call `.get(key)` with no default, check for `None` yourself, and log or flag it so the gap stays visible.
- `.get(key, default)` only supplies the default when the key is **missing**. An explicit `null` in the JSON still comes through as `None` — guard for `None` separately whenever your data source can send explicit nulls.
- Don't reach for a blanket `try/except` around the whole loop as a substitute for `.get()` — it's coarser than you need and can silently skip an entire order's worth of otherwise-good line items instead of defaulting the one field that's actually uncertain.
- `sum(expr for x in items)` is usually cleaner than a manual accumulator loop once you're combining a lookup with an aggregation — see [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators).

**Related:** Nested JSON in memory · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) · [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python)
