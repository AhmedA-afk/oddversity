---
title: "Reading and writing CSV, JSON and Excel without losing data"
phase: foundations
module: python-for-the-field
kind: lesson
summary: The three file formats every enterprise export arrives in, and the specific ways each one destroys data quietly. Delimiters and quoting in CSV, nesting and number precision in JSON, and Excel's habit of reformatting identifiers.
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Read a CSV with an unknown delimiter, encoding and header row without corrupting a single field.
  - Flatten a nested JSON API response into rows, keeping a record of what you dropped.
  - Name three ways Excel silently changes a value, and read an .xlsx without triggering them.
artifact: A load.py module with read_csv_safely, flatten_record and read_excel functions, and a short note in your journal listing the corruptions you found in a real public dataset.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
---

CSV processing sits at the top of the practitioner must-know list for this role, above anything algorithmic. That looks like a low bar until you have watched a reconciliation fail because one supplier name contained a comma, or because a fifteen-digit account number came back as 1.23457E+14.

The formats are not hard. The failure modes are specific, and they are quiet, which is the problem. This lesson is a list of them with the code that avoids each one.

## CSV is not a format

CSV is a family of conventions. Before you write a parser, you have to learn four things about the specific file: its encoding, its delimiter, its quoting style, and whether it has a header. Look at the raw bytes first.

```bash
head -c 400 export.csv | cat -A | head
```

Never use `split(",")`. It breaks on the first quoted field containing a comma, which is the first supplier called "Patel, Sons and Co". Use the standard library, which implements the quoting rules:

```python
import csv

def read_csv_safely(path, encoding="utf-8-sig", delimiter=None):
    """Yield rows as dicts. Sniffs the delimiter if one is not given."""
    with open(path, newline="", encoding=encoding) as f:
        if delimiter is None:
            sample = f.read(8192)
            f.seek(0)
            delimiter = csv.Sniffer().sniff(sample, delimiters=",;\t|").delimiter
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            yield row
```

Four details in nine lines, each of which is a bug you have avoided.

`newline=""` is required by the csv module. Without it, a field containing an embedded newline (a multi-line address, very common) is split across two rows on some platforms.

`utf-8-sig` strips the byte-order mark that Excel writes at the start of a UTF-8 CSV. Without it your first header is not `invoice_id` but an invisible character followed by `invoice_id`, and every lookup by that name fails on a file that looks correct in any editor.

The sniffer handles the European and Indian systems that emit semicolon-delimited files because the comma is the decimal separator locally. Sniffing can guess wrong; pass the delimiter explicitly once you know it.

`DictReader` gives you rows keyed by header name rather than by position, so an added column upstream does not shift every field by one.

Two things `DictReader` will do that you should check for. If the header has duplicate names, later columns overwrite earlier ones silently. If a row has more fields than the header, the extras land under the key `None`; if fewer, missing keys are `None`. Guard explicitly:

```python
if row.get(None):
    raise ValueError(f"row has more fields than the header: {row}")
```

Writing is symmetrical, and the argument that matters is the line terminator:

```python
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["invoice_id", "branch", "amount_paise"])
    writer.writeheader()
    writer.writerows(rows)
```

If the customer's downstream system is a Windows tool that insists on carriage returns, pass `lineterminator="\r\n"` to `DictWriter`. Ask; do not assume.

## Large files

A 4 GB export on a customer's laptop with 8 GB of RAM does not get loaded into memory. The generator above already streams: it holds one row at a time. Keep that property all the way through. `list(read_csv_safely(path))` throws it away in one word.

If you only need a few columns from a very wide file, select them as you stream rather than after.

## JSON

JSON has types, which makes it better than CSV and introduces different problems.

```python
import json

with open("response.json", encoding="utf-8") as f:
    payload = json.load(f)
```

`json.load` reads from a file, `json.loads` from a string. Writing back:

```python
with open("out.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)
```

`ensure_ascii=False` keeps Devanagari, accents and emoji as themselves instead of escape sequences. The escaped form is valid JSON and any parser will restore it, but a customer opening the file to check a name will see `म` and conclude your pipeline broke.

Three real hazards.

**Numbers.** JSON does not distinguish integers from decimals the way you might hope, and Python's parser turns any non-integer into a float, with the precision loss from the previous lesson. If a payload carries money, parse it as text and convert deliberately: `json.loads(text, parse_float=Decimal)` is the switch.

**Large integers.** A 19-digit identifier survives Python fine, because Python integers are arbitrary precision. It does not survive a round trip through JavaScript, and many customer systems on the other end are JavaScript. If an identifier is longer than 15 digits, keep it as a string end to end.

**Nesting.** An API returns a tree; a table needs rows. Flatten deliberately, and record what you dropped.

```python
def flatten_record(obj, prefix=""):
    """Flatten nested dicts into dotted keys. Lists are left as JSON text."""
    out = {}
    for key, value in obj.items():
        name = f"{prefix}{key}"
        if isinstance(value, dict):
            out.update(flatten_record(value, prefix=f"{name}."))
        elif isinstance(value, list):
            out[name] = json.dumps(value, ensure_ascii=False)
        else:
            out[name] = value
    return out
```

```python
>>> flatten_record({"id": 7, "customer": {"name": "Meridian", "gstin": None}, "tags": ["urgent"]})
{'id': 7, 'customer.name': 'Meridian', 'customer.gstin': None, 'tags': '["urgent"]'}
```

Keeping lists as JSON text is a defensible default: it loses no information and it fits in a column. Exploding a list into rows multiplies your row count, which is a modelling decision, not a parsing one, and it belongs in a conversation with the customer rather than inside a helper function.

For newline-delimited JSON, one object per line, read it as a stream with `json.loads` per line. It is the friendliest format a customer can give you for large data and worth asking for.

## Excel, which is a different animal

The customer's source of truth is frequently a spreadsheet. Colin Jarvis, who leads OpenAI's forward deployed team, describes the layer between raw customer data and business logic as the underrated place where these teams spend substantial time, naming data warehouses and SharePoint specifically. In practice a good share of what is on the SharePoint is `.xlsx`.

```python
from openpyxl import load_workbook

def read_excel(path, sheet=None):
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb.active
    rows = ws.iter_rows(values_only=True)
    header = [str(h).strip() if h is not None else "" for h in next(rows)]
    for row in rows:
        yield dict(zip(header, row))
    wb.close()
```

`read_only=True` streams instead of loading the whole workbook. `data_only=True` gives you the last cached value of a formula cell rather than the formula text, and it is worth knowing that if the file was never opened in Excel after the formulas were written, that cache is empty and you get `None` for every computed cell. That is not your bug, but you will be blamed for it, so check for a fully null computed column early and go back to the customer.

The corruptions to look for, all of which happen before the file reaches you:

- **Leading zeros gone.** A pin code `560034` survives; an account number `007841` becomes `7841`. Irreversible in the file.
- **Long numbers in scientific notation.** A 15-digit identifier displays and sometimes saves as `1.23457E+14`, losing the low digits.
- **Dates that were not dates.** A part code like `3-10` becomes 3 October of the current year. Excel does this on paste and on CSV import.
- **Trailing spaces and non-breaking spaces** from copy-paste out of a web page.
- **Merged cells**, which give you the value in the top-left cell and `None` in the rest.
- **Hidden rows and filtered views**, which the person who sent you the file believed were excluded.

You cannot fix these in code, because the information is gone. What you can do, and should do on day one, is detect them and go back with specifics: "column D has 412 values in scientific notation, so I need this re-exported as CSV directly from the source system rather than opened in Excel first." That request, made early and with evidence, saves a week.

## Round-trip and reconcile

Whatever you read, prove you did not lose anything before you build on it. The cheapest possible check, run every time:

```python
print(f"rows in: {n_in}  rows out: {n_out}  dropped: {n_in - n_out}")
```

Then one column-level check on something the customer already knows the answer to. A total. A count of distinct branches. A maximum date. If your number matches the number in their existing report, you have a foundation. If it does not, you have found the interesting problem, which is usually the actual reason they hired anyone.

## What this lets you do in the field

Take a folder of exports on the first morning and, by lunch, say how many records there are, which columns are unusable, which two files disagree, and what you need re-exported. That is a concrete, checkable deliverable on day one of a deployment, and it buys the trust you need for the harder conversations later in the week.

## What an interviewer can test

A take-home that hands you a deliberately messy CSV. The graders are watching for whether you noticed the quoting, the encoding, the duplicate header, and the row count that does not match the record count in the accompanying JSON. Candidates who load it with a one-liner and start analysing have already failed the part of the exercise that matters, because the practitioner consensus is that the great majority of enterprise data work is access, cleaning and joining, not analysis.
