---
title: "Why 'Works on My Machine' Happens"
track: "python-data-apis"
status: live
summary: "Wrote the full INTUITION-page lesson body for 'Why 'Works on My Machine' Happens' using the shared-counter/separate-kitchen analogy, a step-by-step mental simulation (pandas .appen"
duration: "1 min read"
---

## Why "Works on My Machine" Happens

Your script runs clean, top to bottom, on your laptop. Your teammate pulls the exact same repo, runs the exact same install command, and gets a wall of red. Nobody touched a single line of code — so what actually changed?

## One counter, many recipes

Think of every Python package on your system as an ingredient sitting on a shared kitchen counter. When you `pip install pandas` without any extra setup, it doesn't go into a container that belongs to your project — it goes onto that one shared counter, in a folder usually called `site-packages`. Every script on that machine reaches for ingredients from the same shelf.

That's fine as long as every recipe (project) wants the same brand and quantity of every ingredient. It stops being fine the moment two recipes want different versions of the same thing — recipe A needs pandas 1.5, recipe B needs pandas 2.1 — because there's only one jar labeled "pandas" on the shelf, and whichever install ran most recently is what's in it.

A [venv](/learn/python-data-apis/python-environments-and-venv) is the fix: instead of one shared counter, each project gets its own kitchen with its own shelf. Installing pandas 2.1 in project B's kitchen never touches the jar sitting in project A's kitchen. Same ingredient name, different physical jars, no collision.

## Walk the timeline: the shared counter gets messy

Here's how this actually bites you, step by step, without a colleague even involved yet.

**Day 1.** You write a data-cleaning script. At the time, `pip install pandas` grabs pandas 1.5.3, and you use a very common pattern from that era:

```python
# clean_orders.py -- written when pandas 1.5.3 was on the shelf
import pandas as pd

def combine_batches(batches):
    result = pd.DataFrame()
    for batch in batches:
        result = result.append(batch, ignore_index=True)
    return result
```

It runs. You move on.

**Weeks later.** You start a different project on the same machine, in the same global environment, and it needs a newer pandas feature:

```bash
$ pip install --upgrade pandas
Successfully installed pandas-2.1.4
```

That single command just rewrote the shared jar. It wasn't scoped to the new project — there was no "new project" as far as pip was concerned, just the one counter everyone shares.

**Back to `clean_orders.py`.** You didn't edit it. You just run it again:

```text
Traceback (most recent call last):
  File "clean_orders.py", line 6, in combine_batches
    result = result.append(batch, ignore_index=True)
AttributeError: 'DataFrame' object has no attribute 'append'
```

`DataFrame.append` was deprecated in pandas 1.4 and removed outright in pandas 2.0. The method your code depended on didn't get slower or buggier — it stopped existing, on your own machine, because an unrelated `pip install` for a different project quietly swapped the ingredient everyone was sharing.

## The colleague moment

Now run the same root cause across two machines instead of two points in time — this is the version that actually starts Slack arguments.

Your `requirements.txt` lists ingredients but not quantities:

```text
pandas
requests
```

That's the equivalent of a recipe card that says "flour" instead of "480g of King Arthur all-purpose." It tells pip *what* to install, not *which version*, so pip grabs whatever is newest right now.

Months later, a teammate clones the repo and runs the install fresh:

```bash
$ pip install -r requirements.txt
...
Successfully installed pandas-2.1.4 requests-2.31.0
$ python clean_orders.py
Traceback (most recent call last):
  ...
AttributeError: 'DataFrame' object has no attribute 'append'
```

They message you: "your script is broken." You run the identical command on your machine, and it works fine — because your global shelf has had pandas 1.5.3 sitting on it since the day you wrote the script, and nothing since has had a reason to touch it.

You both ran the same code. You both ran the same install command. You got different ingredients, because "pandas" with no pin means "whatever's newest today," and today moved between the two of you.

## The wrong intuition: it must be the code

The natural first move when you see a traceback is to suspect the code, and it's the wrong move here. The teammate re-reads `combine_batches`, checks the input data, maybe adds print statements — hunting for a logic bug in code that has no logic bug. The bug isn't in the file at all; it's in the gap between two environments that were never actually the same, even though `pip install -r requirements.txt` made it *feel* deterministic.

The tell is almost always a version check, not a code review:

```python
import pandas as pd
print(pd.__version__)
```

Run that on both machines before you spend an hour stepping through logic. If the numbers differ, you've found it in ten seconds instead of an hour — and neither person's code is at fault.

## What actually fixes it: isolation + a pinned list

Two separate ideas, and you need both:

**Isolation** — a project-specific kitchen, so installing something for one project can never silently rewrite another project's shelf. That's what [`python -m venv`](/learn/python-data-apis/setting-up-venv-and-jupyter) gives you:

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install pandas==1.5.3 requests==2.31.0
```

**A pinned list** — a recipe card with exact quantities, so "install this project" means the same thing today as it will in six months, on anyone's machine:

```bash
pip freeze > requirements.txt
```

```text
pandas==1.5.3
requests==2.31.0
python-dateutil==2.8.2
pytz==2023.3
```

Now your teammate's setup is:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

They get pandas 1.5.3, specifically — not "whatever's newest" — installed into a kitchen of its own, untouched by whatever else lives on their global counter.

Notice why either idea alone leaves a gap. A fresh venv with an unpinned `requirements.txt` still grabs today's newest pandas — isolation doesn't help if the recipe card is vague. And a pinned version installed straight into the global environment still fights every other project pinned to something different on that same shared counter — the pin doesn't help if there's no separate kitchen to install it into.

> Reproducibility isn't one trick. It's isolation (so projects stop fighting over the same shelf) plus a pinned list (so the ingredients on your shelf don't quietly change from under you). This is the setup step underneath everything else in a [real data pipeline](/learn/python-data-apis/python-data-pipeline-whole-game) — before cleaning, before calling an API, before any of it.

## When the analogy breaks

The kitchen picture is useful, but push on it and it cracks in a few honest places worth knowing about upfront:

**Separate kitchens still share a stove.** A venv isolates *packages*, not the Python interpreter itself. If your code uses a syntax feature from Python 3.11 and your teammate's system only has Python 3.9 available, `python -m venv` there builds a 3.9 kitchen — pinning `pandas==1.5.3` doesn't fix an interpreter version mismatch. That needs a tool like pyenv or conda that can also pin *which* Python you're running, covered in more depth in [environments and venv](/learn/python-data-apis/python-environments-and-venv).

**Pinning a version number doesn't guarantee an identical binary.** `numpy==1.26.4` on Linux x86 and on Apple Silicon can resolve to two different precompiled wheels for the same version string. Usually harmless — occasionally not, especially for packages with compiled C extensions or GPU dependencies.

**Some ingredients aren't in the kitchen at all.** A package that shells out to a system tool — `ffmpeg`, a specific Postgres client library, a CUDA driver — lives outside pip entirely. Your venv can have exactly the right Python packages and still crash because the OS underneath it is missing something pip never touched. That's the point where teams reach for a container: a fully separate kitchen down to the appliances, not just the ingredient shelf.

**A plain pin file doesn't lock what your dependencies depend on.** `pandas==1.5.3` pins pandas, but pandas itself depends on other packages that a bare `pip freeze` captures as a snapshot, not a guarantee, if any of them get resolved differently later. That's why lockfile tools (pip-tools, Poetry, uv) exist — they're a stricter version of the same idea you just learned, not a different one.

None of that erases the lesson — isolation plus a pin fixes the overwhelming majority of "works on my machine" moments. It just means the recipe card can't be the *only* thing you ever check when something still goes sideways.

**Related:** Why isolated environments make sense · [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) · [Setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) · [The whole-game data pipeline](/learn/python-data-apis/python-data-pipeline-whole-game) · [Environments & tooling quiz](/learn/python-data-apis/environments-tooling-quiz)
