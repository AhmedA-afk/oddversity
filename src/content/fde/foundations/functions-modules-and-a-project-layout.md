---
title: "Functions, modules, and a project layout you can hand over"
phase: foundations
module: python-for-the-field
kind: lesson
summary: How to split a script into functions and modules, and the small repository layout that lets a customer's own engineer run your code after you have flown home. Includes the main guard, argument parsing, and a README that answers the four questions people actually ask.
duration: 16 min
updated: "2026-09-02"
outcomes:
  - Write functions with clear inputs, one job each, and no hidden global state.
  - Split a working script into modules and import between them without path errors.
  - Lay out a small project with a README, a config file and an entry point another engineer can run in ten minutes.
artifact: A repository skeleton with src layout, README, .env.example and a runnable entry point, reused by every later lab in this path.
---

An FDE's code is read by strangers under time pressure. Sometimes the stranger is the customer's own platform team, six weeks after you left, when the job has started failing. Sometimes the stranger is you, on a different engagement, trying to remember what you meant. The handover quality of a two-hundred-line script is not a nicety; it decides whether your deployment survives you.

That is the whole argument for this lesson. Functions and modules are not aesthetics. They are how the thing stays runnable.

## A function is a named piece of work

```python
def rows_rejected(rows):
    return sum(1 for r in rows if r.get("status") == "rejected")
```

`def`, a name, parameters in parentheses, a colon, an indented body, and usually a `return`. Called like this:

```python
>>> rows = [{"status": "ok"}, {"status": "rejected"}]
>>> rows_rejected(rows)
1
```

Three rules carry most of the value.

**One job, named after the job.** If you cannot name a function without using "and", it is two functions. `fetch_and_clean_and_upload` is a maintenance problem announcing itself.

**Take inputs as parameters, do not read globals.** A function that reaches out for a module-level `CONFIG` cannot be tested, cannot be reused with different settings, and will surprise whoever moves it. Pass what it needs.

**Return values, do not print inside the logic.** Printing is an output decision. Keep it at the edges, so the same function can serve a script, a test, and later an API endpoint.

Default arguments have one famous trap:

```python
def add_row(row, batch=[]):     # wrong
    batch.append(row)
    return batch
```

The default list is created once, when the function is defined, and shared by every call that omits the argument. Your second batch starts with the first batch's rows in it. The fix:

```python
def add_row(row, batch=None):
    if batch is None:
        batch = []
    batch.append(row)
    return batch
```

## Docstrings and type hints

```python
def parse_amount(value: str | None) -> int | None:
    """Return the amount in paise, or None if the value is missing.

    Raises ValueError if the value is present but unparseable.
    """
```

Type hints are not enforced at runtime; Python will happily pass a list into a parameter annotated `str`. They are documentation that editors and linters can check, and on a handover they answer the question a reader has first, which is "what goes in and what comes out". The docstring's job is to state the contract, including what it raises, not to restate the code.

## Modules

A module is a `.py` file. Importing one runs it, top to bottom, once, and gives you access to its names.

```python
# clean.py
MISSING_TOKENS = {"", "null", "n/a", "-"}

def is_missing(value):
    return value is None or (isinstance(value, str) and value.strip().lower() in MISSING_TOKENS)
```

```python
# report.py
from clean import is_missing

print(is_missing("N/A"))
```

Prefer `from clean import is_missing` over `from clean import *`. The star import hides where a name came from, and when two modules both define `parse_date`, the last import silently wins.

Because importing runs the file, any code at the top level of a module executes on import. That is why every runnable file ends with a main guard:

```python
def main():
    ...

if __name__ == "__main__":
    main()
```

`__name__` is the string `"__main__"` when the file is run directly, and the module's name when it is imported. Without the guard, importing your script to reuse one function also runs the whole job, which on a customer's box means an unintended write to their database. This is not a style point.

## Arguments and configuration

Hard-coded paths are the single most common reason a script that worked in the demo does not work in the customer's scheduler. Take the varying parts as arguments.

```python
import argparse

def parse_args():
    p = argparse.ArgumentParser(description="Export yesterday's rejected rows.")
    p.add_argument("--input", required=True, help="path to the source CSV")
    p.add_argument("--out", required=True, help="path to write the report to")
    p.add_argument("--dry-run", action="store_true", help="print what would be written")
    return p.parse_args()
```

```bash
python3 -m fieldkit.export --input data/day.csv --out reports/day.json --dry-run
```

`argparse` is in the standard library, gives you `--help` for free, and fails loudly on a missing required argument instead of at line 140.

Secrets are different from arguments. They do not go in the command line, where they land in shell history and in the process list that any user on the box can read with `ps`. Put them in the environment:

```python
import os

token = os.environ.get("HELPDESK_TOKEN")
if not token:
    raise SystemExit("HELPDESK_TOKEN is not set. See README.")
```

Commit a `.env.example` listing the variable names with empty values, and never the `.env` itself. Add `.env` to `.gitignore` on the first commit, before there is anything in it to leak.

## The layout

For a single-purpose deployment tool, this is enough, and more structure than this is usually cost without benefit.

```
fieldkit/
  README.md
  pyproject.toml
  .env.example
  .gitignore
  src/
    fieldkit/
      __init__.py
      clean.py
      api.py
      export.py
  tests/
    test_clean.py
  data/
    .gitkeep
```

The `src` layout puts your package one directory down, which stops Python from importing it accidentally from the working directory and hiding a packaging bug until the customer installs it. `__init__.py` marks the directory as a package. Install it in editable mode once and imports work from anywhere:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

A minimal `pyproject.toml`:

```toml
[project]
name = "fieldkit"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["requests>=2.31"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]
```

Two habits that prevent the most common import complaint. Run modules with `python3 -m fieldkit.export` rather than `python3 src/fieldkit/export.py`, so the package is on the path properly. And never name a file after a library you import; a file called `csv.py` in your project shadows the standard library's `csv` and produces an error message that names neither.

## The README that gets read

Four questions, in this order, on one screen.

1. **What is this and what does it touch?** One paragraph. Name the source system, the destination, and whether it writes.
2. **How do I run it?** Exact commands, copy-pasteable, including the venv creation and the environment variables. Someone should get a dry run working in ten minutes without asking you.
3. **What can go wrong and what do I do?** The three or four failures you already know about, with the log line each produces and the fix. Expired token. Source file absent. Destination full.
4. **Who owns it and where does it run?** A name, a schedule, a host, and where the logs go.

Skip the architecture diagram. Nobody debugging at 3am has ever been helped by one, and the four answers above are what the customer's platform engineer is looking for.

## What this lets you do in the field

Hand over. The realistic close of a deployment is a call where you walk a customer's engineer through the repository, they clone it, and they run it in front of you. Everything in this lesson exists so that call takes forty minutes rather than a week of follow-ups. It is also the mechanic behind the reuse targets the role is measured on: OpenAI's head of FDE describes aiming for roughly a fifth of an engagement's components to be reusable on the first engagement and about half by the third. You cannot reuse a component that only exists as lines 40 to 90 of a script with a hard-coded path in it.

## What an interviewer can test

The take-home. Multiple FDE loops end in a small working application plus a walkthrough, and the layout, the README, and whether the thing runs from a clean clone are graded whether or not the rubric says so. A reviewer who cannot run your submission in ten minutes has already formed an opinion. Practise the clean-clone test on yourself: move the repository to a fresh directory, follow your own README literally, and fix every step where you had to know something that was not written down.
