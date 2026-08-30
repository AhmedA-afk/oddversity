---
title: "Reading and Writing CSV Without Pain"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough that builds a deliberately messy sales CSV (quoted commas, a junk title row, a stray duplicate header, one row in a different encoding), reads it correctly w"
duration: "22 min read"
---

Every "CSV" you get from someone else's system is really three problems wearing one file extension: what delimiter is this, what encoding is this, and did whoever generated it actually follow the quoting rules. This walkthrough builds a small, honest pipeline around a file that fails all three ways at once, so you learn to recognize the failure instead of guessing at it.

## What we're building

A five-row sales export that packs in the classic CSV failure modes in one file: a title row sitting above the real header, commas embedded inside quoted values, a duplicate header row baked into the middle of the file (the fingerprint of two exports pasted together), and one row saved in a different byte encoding than the rest. You'll parse it two ways — the standard-library `csv` module and `pandas.read_csv` — let it fail loudly first so you recognize the error on sight, fix it with the right constructor arguments, and write a clean version back out with `to_csv` that won't hand the same problems to whoever reads it next.

## Setup

Nothing beyond pandas — `csv`, `io`, and the codec machinery are all in the standard library.

```bash
python3 -m venv venv
source venv/bin/activate    # venv\Scripts\activate on Windows
pip install pandas
```

If venvs are still new territory, [Setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) covers the pattern once so you don't have to think about it again. Confirm your install before you blame your own code for anything:

```bash
python3 -c "import pandas; print(pandas.__version__)"
```

This was built and run against pandas 3.0; every snippet here also runs unchanged on pandas 2.x.

## Build it

### Generate the fixture: every classic problem, on purpose

Run this once. It writes a file byte-for-byte the way a real messy export arrives — mostly UTF-8, with one row deliberately saved as cp1252 (Windows Latin-1), because that's exactly how these files show up: someone pasted a row in from Excel on a different machine.

```python
# make_messy.py
lines_utf8 = [
    "Sales Data Export - Confidential,,,,",
    "order_id,customer,product,amount,notes",
    '1001,"Acme, Inc.",Widget,19.99,"Ships to NY, NY"',
    "1002,O'Brien Supplies,Gadget,5.50,",
    "order_id,customer,product,amount,notes",   # stray duplicate header
]
line_cp1252 = '1003,Café Bistro,Mug,12.00,"Rush order, handle with care"'
lines_tail = ['1004,"Smith & Sons",Widget,8.75,']

with open("messy_sales.csv", "wb") as f:
    for line in lines_utf8:
        f.write((line + "\r\n").encode("utf-8"))
    f.write((line_cp1252 + "\r\n").encode("cp1252"))
    for line in lines_tail:
        f.write((line + "\r\n").encode("utf-8"))
```

Four problems, deliberately:

1. Row 1 is a title line a reporting tool tacked on top — not a data row, not the header.
2. `"Acme, Inc."` and `"Ships to NY, NY"` have commas *inside* quoted values, so a naive `line.split(",")` breaks both rows.
3. The header row reappears in the middle of the file — what you get when two exports are concatenated without checking for it.
4. `Café Bistro` is saved in cp1252, not UTF-8, while every other row is UTF-8.

### Read it with the csv module — and let it fail first

Don't skip this. The error is what you'll actually meet in production, and you want to recognize it on sight rather than treat it as a mystery:

```python
import csv

with open("messy_sales.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
```

```text
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 212: invalid continuation byte
```

That's the "garbled output" failure from the brief, except it isn't garbled — it's a hard crash, which is the better outcome. The silent version happens when someone "fixes" this with `errors="ignore"` or `errors="replace"` and ships `Caf Bistro` or `Caf?Bistro` into a file forever. Byte `0xe9` is `é` in cp1252/Latin-1; in UTF-8 a byte in that range is only legal as the *second* byte of a multi-byte sequence, so the decoder rejects it as a standalone character.

### Fix it: the right encoding, skip the junk, drop the stray header

```python
import csv

EXPECTED_HEADER = ["order_id", "customer", "product", "amount", "notes"]

def load_rows(path):
    rows, header = [], None
    with open(path, newline="", encoding="cp1252") as f:
        for raw_row in csv.reader(f):
            if raw_row == EXPECTED_HEADER:
                header = header or raw_row   # keep the first, discard repeats
                continue
            if header is None:
                continue                      # junk row before the real header
            if len(raw_row) != len(header):
                print(f"skipping malformed row: {raw_row}")
                continue
            rows.append(dict(zip(header, raw_row)))
    return header, rows

header, rows = load_rows("messy_sales.csv")
```

Three things are doing the work:

- `encoding="cp1252"` instead of `"utf-8"`. cp1252 is ASCII-compatible for every codepoint below 128, so every plain-ASCII byte in the file still decodes exactly the same — you're only changing how the one non-ASCII byte gets interpreted.
- The `raw_row == EXPECTED_HEADER` check catches the duplicate header wherever it lands, rather than assuming it's on a fixed line number.
- `csv.reader` already handled the embedded commas correctly — `"Acme, Inc."` comes back as one field, not two. That's the entire reason to reach for the `csv` module instead of `line.split(",")`.

If you want dicts keyed by column name instead of lists, `csv.DictReader(f)` does that for you directly — you'd still filter the stray header row yourself, since `DictReader` has no way to know a second one is coming.

### Read the same file with pandas.read_csv

Naive call, identical crash:

```python
import pandas as pd
df = pd.read_csv("messy_sales.csv")
# UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 212: invalid continuation byte
```

Same fix, pandas' way:

```python
df = pd.read_csv(
    "messy_sales.csv",
    encoding="cp1252",   # matches the file's real byte encoding
    skiprows=1,           # drops the "Sales Data Export - Confidential" title row
)

# the stray header survived as a data row where every cell equals its own
# column name — drop it, then fix the dtypes it dragged along as strings
df = df[df["order_id"] != "order_id"].copy()
df["order_id"] = df["order_id"].astype(int)
df["amount"] = df["amount"].astype(float)
```

`skiprows=1` fixes problem #1 because you know the junk sits on a fixed line — that's a positional fix. The duplicate header is a *content* problem, not a positional one, so it needs the same equality check you used in the `csv`-module version. Worth internalizing: pandas gives you fast positional tools (`skiprows`, `header=N`, `nrows`), but ordinary boolean filtering is still what you reach for once the problem depends on the data itself, not its position. [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) goes deeper on the `.astype()` step once your rows are actually clean.

### Write it back cleanly with to_csv

```python
df.to_csv("clean_sales.csv", index=False, encoding="utf-8")
```

```text
order_id,customer,product,amount,notes
1001,"Acme, Inc.",Widget,19.99,"Ships to NY, NY"
1002,O'Brien Supplies,Gadget,5.5,
1003,Café Bistro,Mug,12.0,"Rush order, handle with care"
1004,Smith & Sons,Widget,8.75,
```

Notice what `to_csv` did unasked: it quoted `"Acme, Inc."` and `"Ships to NY, NY"` because they contain commas, and left `O'Brien Supplies` and `Smith & Sons` unquoted because they don't need it. That's `quoting=csv.QUOTE_MINIMAL`, the default — it quotes exactly the fields that would otherwise be ambiguous, which makes the file you write back *more* correct than most hand-rolled CSVs, not just tidier-looking. Setting `encoding="utf-8"` explicitly — rather than trusting whatever the OS default happens to be — is the actual fix that stops this file from becoming next month's messy import for someone else.

## Run it

Running the pandas fix end to end on `messy_sales.csv` lands you on a 4-row, 5-column dataframe with `order_id` as `int64`, `amount` as `float64`, and everything else as text. The row count is worth checking by hand: the file has 7 physical lines, minus 1 title row and 2 header occurrences leaves exactly 4 data rows. If you land on 3 or 5 instead, something upstream of the dtype conversion went wrong — and that's a far cheaper bug to catch here than three transformations downstream. [Loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) has more on sanity-checking shape and dtypes on a freshly loaded frame before you build anything on top of it.

## Harden it

**Don't guess the encoding — detect, then decide.** cp1252 was correct here because that's what actually produced the file. A cheap two-guess heuristic covers most Western-locale business exports:

```python
def detect_encoding(path):
    try:
        with open(path, encoding="utf-8") as f:
            f.read()
        return "utf-8"
    except UnicodeDecodeError:
        return "cp1252"   # common default for Windows/Excel-origin files
```

This isn't a real encoding detector, just a heuristic that happens to cover the two encodings you'll meet most often. For files of genuinely unknown origin, reach for the `charset-normalizer` or `chardet` package instead of stacking more guesses by hand.

**A wrong delimiter looks like garbled output, not a crash — and that's the dangerous one.** A European export using `;` because `,` is the decimal separator parses "successfully" into one useless column:

```python
df = pd.read_csv("euro_sales.csv")
print(df.columns.tolist())
# ['order_id;customer;amount']
```

It gets worse before it gets obvious: because the decimal values (`19,99`) still contain a comma, pandas finds one comma per data row against zero in the header, and silently pulls that extra field into a row index instead of raising an error — so you get a dataframe that looks plausible and is wrong. Both arguments the brief points at fix it together:

```python
df = pd.read_csv("euro_sales.csv", sep=";", decimal=",")
print(df.columns.tolist())
# ['order_id', 'customer', 'amount']
```

When you don't know the delimiter ahead of time, `csv.Sniffer` will tell you:

```python
import csv
with open("euro_sales.csv", encoding="utf-8") as f:
    dialect = csv.Sniffer().sniff(f.read(2048))
print(dialect.delimiter)   # ';'
```

**An unescaped quote silently merges rows.** If a field starts with a stray `"` that was never meant to open a quoted value, both `csv` and pandas treat everything up to the *next* quote character as one field — newlines and however many rows sit in between included:

```python
import csv, io
raw = ('order_id,customer,product,notes\n'
       '2001,Acme,Widget,"12 inch pipe fitting\n'
       '2002,Beta,Gadget,fine\n'
       '2003,Gamma,Sprocket,"ok" done\n')
list(csv.reader(io.StringIO(raw)))
# [['order_id', 'customer', 'product', 'notes'],
#  ['2001', 'Acme', 'Widget', '12 inch pipe fitting\n2002,Beta,Gadget,fine\n2003,Gamma,Sprocket,ok" done']]
```

Three logical rows became two, and the surviving row has a newline hiding inside a single cell — no exception raised anywhere. The tell is a row count lower than expected, or a cell whose length is suspiciously large. Always compare the parsed row count against an independent count of lines in the source and treat any mismatch as a real bug. [Data cleaning: common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes) has more failure patterns worth checking for before you trust a parsed file.

**Validate the schema you actually need, not just the dtypes.** `astype(int)` will happily accept an `order_id` of `0` or `-1` — a successful type conversion isn't the same as valid data. [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) covers enforcing real constraints once the file parses cleanly.

## Extend it

Once the read/write loop holds up, a few natural next steps:

- **Chunk it if the file is bigger than memory.** `pd.read_csv(path, chunksize=50_000)` returns an iterator of dataframes instead of one giant object — the same `encoding` and `sep` arguments apply per chunk.
- **Stop writing CSV once you're the only consumer.** Every failure mode in this lesson — delimiters, quoting, encoding — exists because CSV is a text format with no schema attached to it. If the next step is feeding a model or another Python process rather than handing a file to a person in Excel, [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) sidesteps the entire category of bug by carrying its own schema and types.
- **This loop is the actual shape of data cleaning.** Messy input, explicit assumptions checked in code, typed output you can trust — that's the same pattern you'll run on any source before it becomes something a model can consume.

**Related:** [Files & Data Formats overview](/learn/python-data-apis/files-and-data-formats-overview) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) · [Choosing a data format](/learn/python-data-apis/choosing-a-data-format) · [Data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) · [Files & formats quiz](/learn/python-data-apis/files-and-formats-quiz)
