---
title: "Timezones, encodings, and the empty date column that cost 14 TB"
phase: data
module: etl-and-messy-data
kind: lesson
summary: Enterprise data lies in a small number of repeatable ways. Learn the catalogue of lies, profile a file before you trust it, and write parsers that fail loudly instead of silently producing a plausible wrong answer.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Profile an unfamiliar export and report its encoding, null shapes, date formats and key uniqueness before writing any transform.
  - Parse Indian-format dates, amounts and identifiers without stripping leading zeros or mangling the rupee sign.
  - Explain why a nullable column used as a partition key is a production risk, using a real incident.
artifact: A reusable profile.py you run against every new file a customer sends you, plus the profile output for one real messy file.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh, who ran Palantir's Project Frontline and trained several hundred engineers, tells a story in his guide to Forward Deployed Engineering about a column that was supposed to contain a date and sometimes did not. The empty values propagated into a Cassandra design and produced roughly 2.3 million keyspaces and a cluster that wanted 14 terabytes of RAM.

The interesting part is not the size of the number. It is that nothing in that chain was a bug. Every component did exactly what it was told. A column that was documented as mandatory was not, downstream code assumed it, and the assumption compounded until it was expensive.

That is the shape of nearly every data-quality incident you will see in the field. Not a crash. A plausible wrong answer, or a resource curve that only bends at scale.

## Profile before you trust

The habit that separates people who get burned from people who do not is boring: **never write a transform against a file you have not profiled.** Ten minutes, every time, including the ninth weekly drop of a file you already know.

```python
import collections
import csv
import re
import sys

DATE_SHAPES = [
    (re.compile(r"^\d{4}-\d{2}-\d{2}$"), "YYYY-MM-DD"),
    (re.compile(r"^\d{2}/\d{2}/\d{4}$"), "XX/XX/YYYY (ambiguous)"),
    (re.compile(r"^\d{2}-\d{2}-\d{4}$"), "XX-XX-YYYY (ambiguous)"),
    (re.compile(r"^\d{8}$"), "YYYYMMDD or serial"),
]
NULLISH = {"", "-", "NA", "N/A", "NULL", "null", "None", "nil",
           "0000-00-00", "1900-01-01", "99991231", "#N/A"}


def sniff_encoding(path):
    head = open(path, "rb").read(4)
    if head.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    if head.startswith((b"\xff\xfe", b"\xfe\xff")):
        return "utf-16"
    try:
        open(path, encoding="utf-8").read()
        return "utf-8"
    except UnicodeDecodeError:
        return "cp1252"


def profile(path):
    enc = sniff_encoding(path)
    with open(path, newline="", encoding=enc) as fh:
        reader = csv.DictReader(fh)
        cols = reader.fieldnames or []
        stats = {c: {"n": 0, "null": 0, "vals": collections.Counter(),
                     "shapes": collections.Counter(),
                     "maxlen": 0, "leading_zero": 0} for c in cols}
        n = 0
        for row in reader:
            n += 1
            for c in cols:
                v = (row.get(c) or "").strip()
                s = stats[c]
                s["n"] += 1
                if v in NULLISH:
                    s["null"] += 1
                    continue
                s["vals"][v] += 1
                s["maxlen"] = max(s["maxlen"], len(v))
                if len(v) > 1 and v[0] == "0" and v.isdigit():
                    s["leading_zero"] += 1
                for rx, name in DATE_SHAPES:
                    if rx.match(v):
                        s["shapes"][name] += 1

    print(f"{path}  encoding={enc}  rows={n}")
    for c in cols:
        s = stats[c]
        distinct = len(s["vals"])
        flags = []
        if s["null"]:
            flags.append(f"null={s['null']}")
        if distinct == n and n:
            flags.append("unique (key candidate)")
        if s["leading_zero"]:
            flags.append(f"leading-zero={s['leading_zero']}")
        for shape, cnt in s["shapes"].most_common(2):
            flags.append(f"{shape}x{cnt}")
        print(f"  {c:<24} distinct={distinct:<6} maxlen={s['maxlen']:<4} "
              + " ".join(flags))


if __name__ == "__main__":
    profile(sys.argv[1])
```

Run that against every file before you open an editor. What you are looking for: a column that should be unique and is not, a column that should be mandatory and is not, two date formats in one column, and leading zeros that a downstream `int()` will destroy.

## The catalogue of lies

### Encoding

Excel on a Windows machine in an Indian office will happily hand you three different encodings depending on which Save As the analyst picked. "CSV UTF-8" gives you a UTF-8 file with a byte-order mark, which is why your first column is named `﻿invoice_id` and every lookup fails. Plain "CSV" gives cp1252 or the local ANSI code page, which turns the rupee sign and any curly quote into a replacement character. "Unicode Text (.txt)" gives UTF-16LE, tab separated, which most CSV readers will parse as a single column of garbage.

Detect, do not assume. Never call `.decode(errors="ignore")` on customer data: you have just silently deleted the characters that would have told you something was wrong. If you must be lenient, use `errors="replace"` and count the replacements, then report the count.

Mixed script matters here. A hospital chain's patient names, a state scheme's beneficiary list, a co-operative bank's member register will contain Devanagari, Tamil or Gujarati alongside Latin. Normalise to Unicode NFC at the boundary so that visually identical names compare equal, and do not lowercase or strip accents to "clean" a name.

### Dates

`03-04-2026` is 3 April in Mumbai and 4 March in Chicago. The file will not tell you which. Find out from the person who produced it, write the answer in the code, and add an assertion that fails if you ever see a day component above 12 in the position you assumed was the month, because that is the only free evidence you will get.

Other date traps:

- **Excel serial numbers.** `45870` is a date that lost its formatting. Excel's day-zero is 30 December 1899 for the standard workbook mode.
- **Sentinel dates.** `0000-00-00`, `1900-01-01`, `9999-12-31`, `99991231`. Systems use these to mean "unknown" or "no end date". They are nulls wearing a costume, and if you treat `9999-12-31` as a real date your "oldest open item" report is wrong forever.
- **Text that is nearly a date.** `Aug-26`, `Q3 FY27`, `26.08.2026`, and the fiscal year, which in India runs April to March and is written `FY26-27`. Never infer the fiscal calendar; ask.

### Timezones

India Standard Time is UTC+05:30 and has no daylight saving. That half hour is where the bugs live: a naive `timestamp` column that some services write in IST and others in UTC produces records that appear to arrive before they were created, and a difference of exactly 5:30 in an incident log is a signature you should learn to recognise on sight.

The rule: **store UTC, carry the timezone, convert only at the edges.** And know that "day" is a business concept, not a UTC concept. A payments team's day may close at 23:00 IST, a factory's shift day at 06:00, a US bank's settlement day on a different calendar entirely. Ask which day boundary the report uses before you write a `GROUP BY date`.

```python
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def ist_business_day(ts_utc: datetime, cutoff_hour: int = 0) -> str:
    """A UTC instant -> the IST business day it belongs to.

    cutoff_hour=6 means the factory day starts at 06:00 IST, so 04:00
    still belongs to the previous day.
    """
    local = ts_utc.astimezone(IST)
    if local.hour < cutoff_hour:
        local -= timedelta(days=1)
    return local.date().isoformat()


ts = datetime(2026, 8, 1, 20, 15, tzinfo=timezone.utc)
print(ist_business_day(ts))                   # 2026-08-02
print(ist_business_day(ts, cutoff_hour=6))    # 2026-08-01
```

That prints `2026-08-02`, because 20:15 UTC is already the next day in Kolkata. If your daily totals are off by a small amount every day, this is usually why.

### Numbers and identifiers

Indian digit grouping writes twelve lakh as `12,34,567`, not `1,234,567`. A naive `float(v.replace(",", ""))` handles both, which is fine, but a regex written for thousands separators does not.

The bigger risk is identifiers that look like numbers and are not. Pincodes, IFSC codes, GSTINs, account numbers, material codes, employee IDs. The moment one of these passes through a spreadsheet or an `int()`, `007412` becomes `7412` and the join silently loses rows. **Read every identifier as a string, everywhere, always.** Then compare row counts before and after each join, because a join that quietly drops 4% of rows is the most common cause of a wrong number in a demo.

Money: store integers in the smallest unit. Ratios and rates: store the numerator and denominator, not the pre-divided float, so that aggregates are correct.

### Nulls that are not null

`""`, `" "`, `"-"`, `"N/A"`, `"NA"`, `"NULL"` as a literal string, `0` used as "unknown", `-1` used as "unknown", and a whitespace-only cell that came from a merged Excel row. Build the nullish set once, apply it at the boundary, and count how many of each you saw. That count is a report you give the customer, not a detail you hide: "17% of the `dispatch_date` column arrives empty, and 3% arrives as the literal string NA" is a finding a business owner can act on.

## The rule the 14 TB story teaches

**Never let a nullable field become a structural decision.**

Partition keys, table names, directory names, shard keys, tenant identifiers, cache keys, index names. Anything where the value of a data field determines the shape of the system rather than the contents of a row. If the field can be empty, or can take an unbounded number of values, the structure it generates is unbounded too, and the failure will not appear in test data.

The defence is a contract enforced at the boundary:

```python
class RowRejected(Exception):
    pass


def to_partition_key(dispatch_date: str | None) -> str:
    if not dispatch_date or dispatch_date.strip() in {"", "-", "NA", "N/A"}:
        raise RowRejected("dispatch_date empty; cannot derive partition")
    return dispatch_date[:7]          # YYYY-MM
```

Rejected rows go to a quarantine table with the raw row and the reason, and the run summary reports the count. A pipeline that rejects 40 rows loudly is healthy. A pipeline that accepted them and invented a partition is the one that gets a postmortem.

## The finding is a deliverable

The last thing to understand about messy data: what you learn while cleaning it is worth money to the customer, and most engineers throw it away.

If the dispatch date is missing on 17% of rows, someone in the warehouse is not filling in a screen, and that is a process problem the operations head will care about more than your pipeline. If two systems disagree about which orders are cancelled, someone is reconciling by hand. Write these up as a short data-quality note at the end of the first week. It is the cheapest credibility you will ever buy, and it is the raw material for the next scope.
