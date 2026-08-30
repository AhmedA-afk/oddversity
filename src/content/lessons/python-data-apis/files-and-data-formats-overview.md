---
title: "Files and Formats: Text, Rows, and Columns"
track: "python-data-apis"
status: live
summary: "A foundational tour of file formats — text vs binary, row-oriented vs columnar — with runnable CSV/JSON/JSONL/Parquet examples, real measured size comparisons, and safe file readin"
duration: "15 min read"
---

You've got a folder with three files from three different sources: a nightly export from a database (a `.csv`), a payload your code logged from an API call (a `.json`), and a cleaned dataset a teammate handed you that loads in under a second even though it holds a few million rows (a `.parquet`). That's not an accident of tooling — each format is a deliberate answer to the same three questions: how readable does this need to be, how small, and how strict about types?

## What it is

A file format is an agreement: it says exactly how a sequence of bytes on disk maps back to structured data — a number, a string, a table, a nested object. Every format you'll touch in a data or AI project answers two mostly-independent questions.

**Text vs. binary.** A text format encodes everything as characters, using a known text encoding (almost always UTF-8 now). Open it in any text editor, `cat` it in a terminal, diff it in git, and it makes sense to a human. CSV, JSON, and JSONL are text formats. A binary format encodes data as bytes meant for a program that knows the spec — open a Parquet file in a text editor and you'll see mostly gibberish, because the actual floats, integers, and compressed column data are packed byte-for-byte, not spelled out as digits.

**Row-oriented vs. column-oriented.** This is about *layout*, and it only matters once you have many records that share the same fields. Row-oriented storage keeps every field of one record next to each other — read one order and you get its id, customer, amount, and status all together. Column-oriented storage flips that: every order's `amount` sits together, every order's `status` sits together, and so on.

Put the two axes together and you get the shapes you'll actually meet:

- **CSV** — text, row-oriented. One line per record, fields separated by commas, no types beyond "everything is a string."
- **JSON** — text, row-oriented, as one nested document (usually a single array of objects). Self-describing and can nest, but you generally load the whole thing at once.
- **JSONL** (JSON Lines) — text, row-oriented, one independent JSON object per line. Same self-description as JSON, but streamable and appendable like CSV.
- **Parquet** — binary, column-oriented. Compact, typed, fast for analytics, unreadable without a library.

Regardless of which of these you're working with, the same base skill applies: open files with a **context manager** — `with open(...) as f:` — instead of calling `open()` and `close()` yourself.

```python
# Don't do this — if read() raises, close() never runs, and the
# file handle leaks for the rest of the program's life.
f = open("orders.csv", encoding="utf-8")
data = f.read()
f.close()

# Do this instead — the file is guaranteed to close, even if the
# code inside the block raises an exception.
with open("orders.csv", encoding="utf-8") as f:
    data = f.read()
# f is already closed here
```

`with` works because `open()` returns an object that implements the *context manager protocol* — it defines what happens on entry (open the file, hand you the handle) and on exit (close the file), and Python guarantees the exit step runs no matter how the block ends, exception or not. You'll meet the same pattern later for database connections and API sessions: anything that acquires a resource and must reliably release it.

## The mental model

Picture your data as a spreadsheet: rows are records, columns are fields. Now picture two people asked to type that spreadsheet out as a flat sequence of values.

The first person reads left to right, top to bottom — every field of order 1, then every field of order 2, then order 3. That's **row-oriented**: it's how you'd write a stack of index cards, one card per record. CSV, JSON, and JSONL all work this way.

The second person reads top to bottom, one column at a time — every order's id, then every order's customer, then every order's amount. That's **column-oriented**: it's how you'd organize a filing cabinet with one drawer per field, every order's amount living in the same drawer. Parquet works this way.

Neither is "correct" — they're built for different questions. Row-oriented answers "give me everything about order #4032" cheaply, because it's all in one place. Column-oriented answers "give me the average `amount` across 2 million orders" cheaply, because you only have to read the `amount` drawer and can ignore every other field.

Hold a second mental model alongside that one: every format sits somewhere on a triangle of **readable ↔ small ↔ typed**. Push toward one corner and you give up ground on the others.

- CSV: readable and compact, but weak on schema — every value is a string until *you* decide what it means.
- JSON / JSONL: readable and strongly self-describing (each value's shape travels with it), but verbose — you repeat every field name in every record.
- Parquet: compact and strongly typed (types are recorded once, in the file's own metadata), but you've given up human-readability entirely.

No format wins all three at once. Every choice you make is a bet on which corner your project needs most.

## Why it works this way

The row/column split isn't arbitrary — it falls directly out of what operation you're optimizing for.

**Row-oriented text formats are optimized for appending and reading whole records.** Logging one API call? You write one line and move on, never touching the rest of the file. That's why JSONL is the natural format for something like a log of LLM calls: each response is one self-contained JSON object, written the moment it arrives, and you can open the file in append mode forever without loading anything else into memory. It's also why a single JSON array is a worse fit for logging — a JSON array has exactly one opening `[` and one closing `]`, so appending a record means loading the *entire* array into memory, adding to it, and rewriting the whole file.

**Column-oriented binary formats are optimized for reading a few fields across many records, and for compression.** Two things make Parquet small at scale: it only reads the column chunks a query actually touches, and values within a single column tend to repeat or trend together — a `status` column has only a handful of distinct strings, dates cluster, categories repeat — so column-wise compression squeezes out far more redundancy than compressing a file row by row, where a string field and a float field sit interleaved and don't compress against each other well.

That second point is worth seeing with real numbers instead of taking on faith. Here's a synthetic table of 20,000 orders, built like realistic data — a handful of repeating customers and statuses, one row per order — written to three formats:

```python
import pandas as pd
import csv, json, random

random.seed(7)
statuses = ["shipped", "pending", "cancelled", "returned"]
customers = ["Priya Shah", "Liam Osei", "Wei Zhang", "Amara Diallo", "Noah Kim"]

rows = [
    {
        "order_id": 1000 + i,
        "customer": random.choice(customers),
        "amount": round(random.uniform(5, 200), 2),
        "status": random.choice(statuses),
        "date": f"2026-08-{random.randint(1, 28):02d}",
    }
    for i in range(20_000)
]

with open("big.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

with open("big.jsonl", "w", encoding="utf-8") as f:
    for row in rows:
        f.write(json.dumps(row) + "\n")

pd.DataFrame(rows).to_parquet("big.parquet", engine="pyarrow", index=False)
```

Run that — the seed is fixed, so you'll get exactly these numbers — and check the sizes on disk:

```text
big.csv       865,628 bytes  (~845 KB)
big.jsonl   2,125,590 bytes  (~2.0 MB)
big.parquet   240,666 bytes  (~235 KB)
```

Parquet comes out about 3.6x smaller than the CSV and 8.8x smaller than the JSONL, for the *same data*, with no information lost. That gap is why a data pipeline reloading the same dataset every day reaches for Parquet: less disk, less network, less time spent parsing text back into numbers.

## A concrete example

None of this matters until you can read and write the formats yourself. Start small — five orders — so you can see every byte.

```python
import csv, json

orders = [
    {"order_id": 1001, "customer": "Priya Shah",  "amount": 42.50, "status": "shipped",   "date": "2026-08-01"},
    {"order_id": 1002, "customer": "Liam Osei",   "amount": 19.99, "status": "pending",   "date": "2026-08-02"},
    {"order_id": 1003, "customer": "Wei Zhang",   "amount": 105.00,"status": "shipped",   "date": "2026-08-02"},
    {"order_id": 1004, "customer": "Amara Diallo","amount": 7.25,  "status": "cancelled", "date": "2026-08-03"},
    {"order_id": 1005, "customer": "Noah Kim",    "amount": 63.10, "status": "shipped",   "date": "2026-08-03"},
]

# newline="" stops the csv module from writing extra blank lines on
# Windows, where "\n" would otherwise get translated twice.
with open("orders.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=orders[0].keys())
    writer.writeheader()
    writer.writerows(orders)

# One JSON document: the whole list, indented for humans.
with open("orders.json", "w", encoding="utf-8") as f:
    json.dump(orders, f, indent=2)

# JSONL: one independent JSON object per line.
with open("orders.jsonl", "w", encoding="utf-8") as f:
    for order in orders:
        f.write(json.dumps(order) + "\n")
```

That produces three files carrying identical information. The CSV:

```csv
order_id,customer,amount,status,date
1001,Priya Shah,42.5,shipped,2026-08-01
1002,Liam Osei,19.99,pending,2026-08-02
1003,Wei Zhang,105.0,shipped,2026-08-02
1004,Amara Diallo,7.25,cancelled,2026-08-03
1005,Noah Kim,63.1,shipped,2026-08-03
```

The start of the JSON array:

```json
[
  {
    "order_id": 1001,
    "customer": "Priya Shah",
    "amount": 42.5,
    "status": "shipped",
    "date": "2026-08-01"
  }
]
```

The start of the JSONL file — notice each line stands alone:

```text
{"order_id": 1001, "customer": "Priya Shah", "amount": 42.5, "status": "shipped", "date": "2026-08-01"}
{"order_id": 1002, "customer": "Liam Osei", "amount": 19.99, "status": "pending", "date": "2026-08-02"}
```

and they land at very different sizes for the same five records:

```text
orders.csv    245 bytes
orders.jsonl  522 bytes
orders.json   659 bytes
```

CSV wins here because it doesn't repeat the field names on every row — JSON and JSONL both pay for `"order_id"`, `"customer"`, and the rest, five times over. That per-row overhead is exactly what compression erases once row counts get large, which is why the ranking flipped in the 20,000-row comparison above.

Now read the CSV back and look closely at the types:

```python
with open("orders.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row)
```

```text
{'order_id': '1001', 'customer': 'Priya Shah', 'amount': '42.5', 'status': 'shipped', 'date': '2026-08-01'}
```

`order_id` and `amount` come back as strings — `'1001'`, not `1001`. CSV has no concept of a number; you either cast explicitly (`int(row["order_id"])`, `float(row["amount"])`) or hand the whole thing to pandas and let it infer types, then check that it inferred correctly.

Parquet, by contrast, carries its schema with it. Load the same table with pandas (`pip install pandas pyarrow`) and write it out:

```python
import pandas as pd

df = pd.DataFrame(orders)
df.to_parquet("orders.parquet", engine="pyarrow", index=False)

df2 = pd.read_parquet("orders.parquet", engine="pyarrow")
print(df2.dtypes)
```

```text
order_id      int64
customer        str
amount      float64
status          str
date            str
dtype: object
```

`order_id` and `amount` round-trip as actual numeric types — no casting step, because the schema was written into the file itself, not left for you to reconstruct from strings. That's the "typed" corner of the tradeoff triangle made concrete: CSV makes you guess, Parquet tells you.

One honest wrinkle: on five rows, `orders.parquet` comes out at 3,484 bytes — about 14 times *larger* than the 245-byte CSV, not smaller. Parquet's metadata footer and per-column structure carry fixed overhead that only pays for itself once you have enough rows and enough repetition for compression to work with, as in the 20,000-row example above. Reach for Parquet because of row count and repetition, not by reflex.

## Where it shows up

- **Calling an API.** Every REST or LLM API response you handle arrives as JSON — see [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) — because it's readable, self-describing, and every language has a parser for it.
- **Logging calls over time.** When you're [calling an LLM API](/learn/python-data-apis/calling-llm-apis-in-python) repeatedly, JSONL is the natural place to record each request/response pair: append one line per call, and a crash halfway through still leaves every prior line intact and parseable.
- **Handing data to a stakeholder.** CSV remains the universal export format for spreadsheets and dashboards — see [reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) — because "text, one row per line" needs no explanation.
- **A dataset you reload constantly.** Once messy data has been cleaned and is ready for repeated use, saving it as [Parquet](/learn/python-data-apis/parquet-and-columnar-formats) instead of CSV means every future load is faster and never silently mis-types a column.
- **A full pipeline**, end to end, often uses all three in sequence: raw JSONL logged from an API, cleaned into a DataFrame, saved as Parquet as the canonical dataset, and a CSV exported only at the very end for the one person who's going to open it in a spreadsheet.

## Watch out for

**Skipping the context manager on writes, not just reads.** A missing `close()` after a *write* isn't just a leaked handle — buffered data may never get flushed to disk, so a crash right after your script finishes writing can leave a truncated file with no error to warn you. `with open(path, "w") as f:` closes the file for you, deterministically, the moment the block ends, even if an exception happens partway through.

**Trusting CSV's types.** You saw it above: every value that comes back from `csv.DictReader` is a string, including numbers. Forgetting to cast is one of the most common silent bugs in a pipeline — comparing a string like `"42.5"` against the int `100` with `>` raises a `TypeError` in Python rather than doing something plausible-looking, but only once your code actually hits that line, often much later than the read. Either cast explicitly on the way in, or load through pandas and check `.dtypes` before trusting anything.

**Confusing a JSON array with JSONL.** A file that's one big `[ ... ]` array is a single JSON document. Read it line by line and you don't get one record per line — a pretty-printed file hands you meaningless fragments like `{` or `"amount": 42.5,`, and a compact one hands you the entire array as a single line. Either way, you have to `json.load()` the whole file before you can touch one record. You also can't safely append to it by opening in append mode and writing more text — that just inserts characters after the closing `]`, corrupting the document. If you need line-by-line streaming or append-as-you-go, that's what JSONL is for.

## Where next

This lesson mapped the terrain; the next lessons walk each region of it up close. See the row-oriented text formats in full in [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) and the CSV-specific lesson linked above, then look at the columnar side properly in [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats). Once you've handled all three yourself, [choosing a data format](/learn/python-data-apis/choosing-a-data-format) turns this into a decision you can make quickly and confidently on a real project.

**Related:** [Reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) · [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) · [Choosing a data format](/learn/python-data-apis/choosing-a-data-format) · [Loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) · [Files and formats quiz](/learn/python-data-apis/files-and-formats-quiz)
