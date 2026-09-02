---
title: "Python from zero: the first week"
phase: foundations
module: python-for-the-field
kind: lesson
summary: Install a Python you can trust, learn the six ideas that make up most working code, and write a script that reads a file and prints an answer. Written for someone who has never programmed.
duration: 18 min
updated: "2026-09-02"
outcomes:
  - Run Python from a terminal and from a saved file, and say what the difference is.
  - Read and write code that uses variables, strings, numbers, if, for, lists and dictionaries.
  - Write a twenty-line script that reads a text file and prints a count, from memory.
artifact: A file called first_report.py in your journal repo that reads a text file and prints a per-status count.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Python is first in this path for a boring reason: it is the language the postings ask for. Across the 28 Forward Deployed Engineer postings in the research behind this path, Python appears in 18 of them, more than any other requirement except customer-facing experience. Anthropic's posting asks for Python plus one more language. Vinoo Ganesh, who ran Palantir's Project Frontline and trained over 250 engineers for the field, lists the technical must-knows as CSV processing, paginated API calls, and database connections. All three are Python jobs.

That is also a clue about what kind of Python you need. Nobody is going to ask you to implement a red-black tree in a customer's meeting room. Somebody is going to ask you, at 4pm, why last night's file has 11,214 rows instead of 11,900. This week is about being able to open the thing and look.

## Getting a Python you can trust

You want Python 3.11 or newer. Check what you already have by opening a terminal and typing:

```bash
python3 --version
```

If that prints `Python 3.11.x` or higher, you are done. On macOS and Windows, install from python.org and, on Windows, tick "Add Python to PATH" during the installer. On Ubuntu or Debian, `sudo apt install python3 python3-venv python3-pip` gets you there.

One warning you will meet again on a customer's machine. Many systems ship an old Python that the operating system itself depends on. Never upgrade or overwrite that one. You install your own, alongside. In Week 5 you will learn virtual environments, which is the proper version of this rule.

Get a text editor too. VS Code is fine and free. Anything that shows you line numbers and coloured syntax is fine.

## The REPL: your first ten minutes

Type `python3` on its own and press Enter. You get a prompt with three angle marks. This is the REPL, and it evaluates whatever you type immediately.

```python
>>> 2 + 2
4
>>> 17 / 5
3.4
>>> 17 // 5
3
>>> 17 % 5
2
```

Three division operators, because you will need all three. Slash gives you a decimal. Double slash throws away the remainder. Percent gives you only the remainder, which is how you check whether a number is even, or which of five shards a record belongs to.

Press Ctrl-D (Ctrl-Z then Enter on Windows) to leave. The REPL is where you check things. When a customer's CSV has a date you do not recognise, you paste it into the REPL and poke at it before you touch the script.

## Values have types

Everything in Python is a value, and every value has a type. Four of them carry most of the work.

```python
>>> type(42)
<class 'int'>
>>> type(3.4)
<class 'float'>
>>> type("INV-8891")
<class 'str'>
>>> type(True)
<class 'bool'>
```

Integers, decimals, text, and true-or-false. The type decides what an operator means, which is the first thing that will bite you:

```python
>>> "12" + "5"
'125'
>>> 12 + 5
17
```

Both are correct. Only one is what you wanted. A field arriving from a CSV is text until you convert it, and `int("12")` is the conversion. The next lesson is entirely about the ways this goes wrong on real data.

Text values are written in single or double quotes, and the useful thing about them is formatting:

```python
>>> branch = "Nashik"
>>> failed = 27
>>> print(f"{branch}: {failed} rows rejected")
Nashik: 27 rows rejected
```

The `f` before the quote makes it an f-string, and anything in braces inside it gets evaluated and dropped in. You will write hundreds of these, mostly in log lines.

## Names, and what assignment does

```python
>>> total = 0
>>> total = total + 5
>>> total
5
```

The equals sign is not a claim of equality. It means "make this name point at this value". The second line reads the current value of `total`, adds 5, and re-points the name. Reading it right to left helps.

Comparison uses two equals signs, which is a distinction worth burning in now:

```python
>>> total == 5
True
>>> total != 5
False
```

## Making a decision

```python
rejected = 27
total = 11214

if rejected == 0:
    print("clean run")
elif rejected / total > 0.01:
    print("more than 1 percent rejected, stop and investigate")
else:
    print(f"{rejected} rejects, within tolerance")
```

Two things to notice. The colon at the end of the line, and the indentation underneath it. Python uses indentation, not braces, to decide what belongs to what. Four spaces, consistently. Your editor will do it for you; let it.

That block is also the shape of every guard you will write in the field. Not "did the job finish" but "did the job finish with a result that makes sense".

## Doing something to every item

```python
branches = ["Nashik", "Pune", "Kolhapur"]

for branch in branches:
    print(f"processing {branch}")
```

A list is an ordered collection, written in square brackets. The `for` loop takes one item at a time and gives it a name you choose. You will read files, rows, API pages and directory listings with exactly this shape.

Lists are indexed from zero, and a negative index counts from the end:

```python
>>> branches[0]
'Nashik'
>>> branches[-1]
'Kolhapur'
>>> len(branches)
3
```

## The dictionary

The other container you use daily is the dictionary: a lookup from keys to values, written in curly braces.

```python
row = {"invoice": "INV-8891", "amount": 45230, "branch": "Pune"}

print(row["branch"])          # Pune
print(row.get("gstin"))       # None, because the key is absent
print(row.get("gstin", ""))   # empty string, because we gave a default
```

Square brackets on a missing key raise an error and stop the program. `.get` returns nothing, or whatever default you pass. Choosing between them is a real decision: use square brackets when a missing key means the data is broken and you want to know loudly, and `.get` when absence is normal.

Every JSON document you ever fetch from an API arrives as some nest of dictionaries and lists. Learning these two containers well is most of the work of handling enterprise data.

## Your first script

Open your editor. Make a file called `tickets.txt` with one status per line:

```
open
closed
open
escalated
closed
open
```

Then a file called `first_report.py` next to it:

```python
counts = {}

with open("tickets.txt", encoding="utf-8") as f:
    for line in f:
        status = line.strip()
        if not status:
            continue
        counts[status] = counts.get(status, 0) + 1

for status, n in sorted(counts.items()):
    print(f"{status}: {n}")
```

Run it from the terminal, in the folder where both files live:

```bash
python3 first_report.py
```

You should see three lines. Read the script back and account for every piece. `with open(...) as f` opens the file and guarantees it gets closed even if something fails halfway. `encoding="utf-8"` says how to interpret the bytes, and leaving it out is one of the top causes of a script that works on your laptop and dies on a customer's Windows server. `.strip()` removes the newline and any stray spaces. `continue` skips to the next loop iteration, here to ignore blank lines. `counts.get(status, 0) + 1` reads the running count, defaulting to zero the first time a status appears.

Change `tickets.txt` to have a trailing blank line, a line with a trailing space, and a line in capitals. Run it again. Explain each difference in the output before you move on. That habit, changing one thing and predicting the result, is the whole of debugging.

## What this lets you do in the field

Not much yet, and that is honest. But the shape is already right. When a customer hands you a folder of exports and asks "how many of these are ours", the answer is a twenty-line script like the one above rather than an afternoon in Excel. Being the person in the room who can open the file and count it, in the first hour, is a surprising amount of the early credibility in a deployment.

## What an interviewer can test

Palantir's screen is a coding and SQL exercise before any human round, and the coding half is at this level of language mechanics plus data handling. If you can write the counting script above from memory, with the encoding argument and the strip, without an editor autocompleting for you, you are at the floor of that screen. You are not past it yet. Keep going.
