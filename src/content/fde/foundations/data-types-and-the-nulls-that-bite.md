---
title: "Data types, and the nulls that bite"
phase: foundations
module: python-for-the-field
kind: lesson
summary: Real customer data arrives as text with holes in it. This lesson covers Python's types in enough depth to handle empty strings, None, mixed date formats, money, and the encoding surprise that turns a name into mojibake.
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Distinguish None, empty string, zero and the string "NULL", and write a checker that treats them correctly.
  - Parse three different date formats and two number formats from a single messy column.
  - Explain why money should not be a float, and store it correctly instead.
artifact: A module called clean.py with parse_amount, parse_date and is_missing functions, plus a test file of the twelve values that break naive versions.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh's guide to the role tells a story about a single empty date column in a customer's data. Downstream, that column was used as part of a partition key. The empty values did not collapse into one group; they fanned out, and the system ended up with roughly 2.3 million Cassandra keyspaces consuming about 14 terabytes of RAM. One column, unvalidated.

That is why "data quality" appears in the practitioner must-know lists next to Python and SQL rather than as an advanced topic. This lesson is the Python half of it.

## The four kinds of nothing

Open a REPL and get these straight, because a customer's export will contain all four in the same column.

```python
>>> a = None          # Python's absence value
>>> b = ""            # empty text
>>> c = 0             # the number zero
>>> d = "NULL"        # the four letters N, U, L, L
```

They are different values. They are also all falsy, which means an `if` treats them the same:

```python
>>> for v in (None, "", 0, "NULL"):
...     print(repr(v), bool(v))
...
None False
'' False
0 False
'NULL' True
```

Three of the four are false, and the trap is the fourth. `if not value:` catches None, empty string and zero, and lets the string `"NULL"` sail past as if it were real data. Meanwhile a legitimate quantity of zero gets thrown away by the same check.

Write the rule down explicitly instead of relying on truthiness:

```python
MISSING_TOKENS = {"", "null", "none", "n/a", "na", "-", "nil", "#n/a"}

def is_missing(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().lower() in MISSING_TOKENS
    return False
```

Note `is None`, not `== None`. Note that zero is not missing. Note that the token set is a set, because membership testing in a set is fast and reads well. And note that this is a decision you should show the customer, not one you make silently: the list of strings a business treats as blank is domain knowledge, and a co-operative bank's export tool may write `-` where a hospital's writes `N/A`.

## repr is your friend

When a value is not behaving, print its `repr`, not the value.

```python
>>> name = " Priya  "
>>> print(name)
 Priya
>>> print(repr(name))
' Priya  '
```

`print` hides whitespace. `repr` shows it, and shows quoting, and shows the difference between the number 12 and the string "12". Every time you are staring at a comparison that should be true and is not, `repr` both sides.

## Numbers that arrive as text

CSV has no types. Everything is text until you convert it, and conversions fail.

```python
>>> int("12")
12
>>> int("12.0")
Traceback (most recent call last):
ValueError: invalid literal for int() with base 10: '12.0'
>>> int(float("12.0"))
12
```

Real exports carry thousands separators, currency symbols, trailing spaces, and negatives in accounting parentheses. Indian exports frequently use the lakh grouping, so a number can arrive as `12,34,567.00`. Handle it deliberately:

```python
def parse_amount(value):
    """Return an integer number of paise, or None if the value is missing."""
    if is_missing(value):
        return None
    s = str(value).strip()
    negative = s.startswith("(") and s.endswith(")")
    if negative:
        s = s[1:-1]
    for ch in ("₹", "$", ",", " ", " "):
        s = s.replace(ch, "")
    amount = round(float(s) * 100)
    return -amount if negative else amount
```

```python
>>> parse_amount("12,34,567.00")
123456700
>>> parse_amount("(1,200.50)")
-120050
>>> parse_amount("N/A") is None
True
```

Two things in there matter beyond the function. ` ` is a non-breaking space, which Excel produces and which looks identical to a normal space in every viewer you own. And the function returns paise as an integer.

## Money is not a float

```python
>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
```

Floats are binary approximations of decimal fractions. The error is tiny and it accumulates, and it accumulates into a reconciliation report that is off by seven paise, which a finance team will not sign off. Two acceptable answers:

- Store money as an integer in the smallest unit (paise, cents). Divide only when you display it. This is what the function above does and it is the simplest thing that works.
- Use `decimal.Decimal` when you need fractional rates or division.

```python
>>> from decimal import Decimal
>>> Decimal("0.1") + Decimal("0.2") == Decimal("0.3")
True
```

Construct `Decimal` from a string, never from a float, or you have imported the error you were avoiding.

## Dates, which are worse

A single column in a single export can hold several formats, because it was typed by humans in three offices.

```python
from datetime import datetime, date

FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%b-%Y", "%m/%d/%Y")

def parse_date(value):
    if is_missing(value):
        return None
    s = str(value).strip()
    for fmt in FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"unrecognised date: {s!r}")
```

```python
>>> parse_date("2026-03-09")
datetime.date(2026, 3, 9)
>>> parse_date("09/03/2026")
datetime.date(2026, 3, 9)
>>> parse_date("09-Mar-2026")
datetime.date(2026, 3, 9)
```

Now look hard at that third and fourth format. `09/03/2026` is the ninth of March under `%d/%m/%Y` and the third of September under `%m/%d/%Y`. The function above picks day-first because it is listed first, and for any date where the day is 12 or lower it will silently produce a plausible wrong answer. There is no code that fixes this. You ask the customer which system wrote the file, and you write the answer in the data dictionary. Then you sanity-check by looking for any value above 12 in the first position across the whole column, which proves day-first, or the same in the second position, which proves month-first.

Also notice `raise ValueError` rather than `return None` at the end. An unparseable date is not a missing date. It is a surprise, and surprises should stop the run, not quietly become nulls. The lesson on errors and logging goes further into this.

Timezones deserve their own warning. A naive datetime carries no zone, and comparing a naive one to an aware one raises. If timestamps matter, store UTC and convert at the edges:

```python
from datetime import datetime, timezone
>>> datetime.now(timezone.utc).isoformat()
```

A payments team in Mumbai reading a UTC-stamped report will see the previous day's last hour attributed to the wrong day. That is a spec question, asked once, not a guess.

## Encoding, and the name that turns to mojibake

```python
>>> "Chaitrali".encode("utf-8")
b'Chaitrali'
>>> "Chaitralī".encode("utf-8").decode("cp1252")
'ChaitralÄ«'
```

Text on disk is bytes. Bytes mean nothing without an encoding. Windows-generated CSVs in Indian and European offices are frequently cp1252 or latin-1, not UTF-8, and reading them as UTF-8 either raises a `UnicodeDecodeError` or, worse, quietly produces the mangled characters above. Always pass `encoding=` explicitly when you open a file, and when you do not know it, look:

```python
>>> open("export.csv", "rb").read(200)
```

Reading in binary mode shows you the raw bytes. A UTF-8 file with a byte-order mark starts with `\xef\xbb\xbf`, and the encoding name `utf-8-sig` strips it for you. If you skip that, your first column header will be `﻿invoice_id` instead of `invoice_id`, and your lookup by column name will fail on a file that looks perfect in a text editor.

## The twelve values

Before you write any transform, build a small file of the values that break naive code and run every parser against it. Mine, in order: empty string, a single space, `NULL`, `N/A`, `-`, `0`, `0.00`, `(1,200.50)`, `12,34,567.00`, `09/03/2026`, `2026-02-30`, and a name with a non-breaking space in it. Add whatever your current customer produces. This file is a starter eval set, and building it before the transform rather than after is the same instinct that later becomes eval-driven development.

## What this lets you do in the field

On day two of a deployment, someone hands you an export and says the totals do not match their system. Nine times out of ten the answer is in this lesson: a column read as text, a null token counted as a value, a day-first date read month-first, or a float that drifted. Being able to find that in twenty minutes, and to say precisely which rows and why, is the difference between a credible engineer and a person waiting on the customer's data team.

## What an interviewer can test

Hand you a column of fifty values and ask you to write the parser. The strong answer names its assumptions out loud, refuses to guess on ambiguous dates, keeps missing and malformed as separate outcomes, and does not lose a legitimate zero. The weak answer is `try: float(x) except: return None`, which turns every problem into a null and pushes the discovery downstream, where it becomes 14 terabytes of RAM.
