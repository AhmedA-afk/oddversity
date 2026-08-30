---
title: "Set Up a venv, pip, and a Jupyter Notebook"
track: "python-data-apis"
status: live
summary: "A fully runnable walkthrough for creating an isolated Python environment with venv, installing pandas and Jupyter into it, running a first notebook cell, freezing and reinstalling "
duration: "18 min read"
---

You're about to do the thing every Python tutorial skips: build an environment that's actually reproducible, then prove it by tearing it down and rebuilding it from a file. Fifteen minutes from now you'll have a notebook that imports pandas, and you'll know exactly why it works.

## What we're building

A disposable, per-project Python environment — created with the standard library's `venv`, populated with `pandas` and `jupyter` via `pip`, and wired up so a Jupyter notebook actually runs inside that environment instead of whatever Python happens to be on your system path. Then you'll capture the exact environment to a `requirements.txt` file and rebuild it from scratch, which is the real test of whether your setup is reproducible or just works by accident.

This sounds small, but it's the thing that determines whether "works on my machine" is a shrug or a real claim. If you want the conceptual why before the how, [Why Isolated Environments](/learn/python-data-apis/why-isolated-environments-intuition) covers the dependency-collision problem venvs solve; this lesson is the hands-on execution of it.

## Setup (deps/env)

You need:

- **Python 3.9 or newer** on your system path. Check with:

```bash
python3 --version
# or on Windows:
py --version
```

- A terminal. Any of them — bash, zsh, PowerShell, Windows Terminal.
- No pre-installed packages. That's the point — we're building the environment from nothing.

One Linux-specific gotcha up front: on Debian/Ubuntu, the `venv` module is sometimes split into a separate OS package. If step 1 below fails with `ensurepip is not available`, run:

```bash
sudo apt install python3-venv
```

then retry. macOS and Windows installs of Python normally include `venv` already.

## Build it

### Step 1: Create the project folder and virtual environment

```bash
mkdir pandas-notebook-demo
cd pandas-notebook-demo
python3 -m venv .venv
```

`python -m venv .venv` creates a folder named `.venv` containing a private copy of the Python interpreter (or a link to it), a private `pip`, and an empty `site-packages`. Nothing you install here touches your system Python or any other project's environment. Naming it `.venv` (with the dot) is a convention, not a requirement — tools like VS Code and `direnv` look for that name by default, and the leading dot keeps it out of the way in directory listings.

Why a venv per project instead of one global Python: two projects that need different versions of pandas — or a dependency of a dependency — will silently fight over the same `site-packages` folder if you install everything globally. A venv gives every project its own sandbox. [Python Environments and venv](/learn/python-data-apis/python-environments-and-venv) goes deeper on what's actually inside that folder if you're curious.

### Step 2: Activate the venv

Activation changes your shell's `PATH` so that typing `python` or `pip` resolves to the copies inside `.venv`, not your system ones.

```bash
# macOS / Linux (bash or zsh)
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (cmd.exe)
.venv\Scripts\activate.bat
```

Your prompt should now show `(.venv)` at the start. Verify it actually worked before trusting it:

```bash
which python     # macOS/Linux — should print a path ending in .venv/bin/python
where python      # Windows — should show .venv\Scripts\python.exe first
python -c "import sys; print(sys.prefix)"
```

If `sys.prefix` doesn't point inside your project's `.venv` folder, activation didn't take — usually because you ran the command from the wrong directory, or (on Windows) PowerShell's execution policy is blocking the script. Fix the latter with `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the current session only.

### Step 3: Upgrade pip and install pandas + jupyter

```bash
python -m pip install --upgrade pip
pip install pandas jupyter
```

Two habits worth building here. First, `python -m pip` instead of a bare `pip` — it guarantees you're invoking the pip module tied to *this* interpreter, which matters once you have multiple Pythons on your machine. Second, upgrading pip before installing anything else avoids a class of resolver bugs that only show up on old pip versions.

`pip install jupyter` pulls in a lot: the notebook server, `ipykernel`, `traitlets`, `tornado`, and a dozen more transitive dependencies. That's normal — Jupyter is an application, not a single library — and it's exactly why the `requirements.txt` step later matters.

### Step 4: Launch Jupyter and run a first cell

```bash
jupyter notebook
```

This starts a local web server (usually `http://localhost:8888`) and opens your browser to a file-browser view of your project folder. Create a new notebook (New → Python 3), and in the first cell run:

```python
import pandas as pd

print("pandas version:", pd.__version__)

df = pd.DataFrame({
    "language": ["Python", "SQL", "R"],
    "popularity_rank": [1, 2, 3],
})
df
```

Run it with Shift+Enter. You should see a version string printed and a rendered table below it. If `jupyter lab` is more your style than the classic notebook, it's a drop-in replacement — same install, same kernel mechanics, different UI.

### Step 5: Freeze your dependencies to requirements.txt

```bash
pip freeze > requirements.txt
```

`pip freeze` lists every package currently installed in the active environment, pinned to its exact version — including everything Jupyter dragged in transitively. Open the file and you'll see far more than `pandas` and `jupyter`: that's expected, and it's the point. This file is now a complete, exact recipe for recreating this environment on another machine.

### Step 6: Rebuild the environment from requirements.txt

This is the step that actually proves reproducibility — don't skip it. Deactivate, throw away the venv, and rebuild from nothing but the file:

```bash
deactivate
rm -rf .venv                 # Windows: rmdir /s /q .venv
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`pip install -r requirements.txt` reads the file line by line and installs each pinned version. If this completes without errors and `python -c "import pandas; print(pandas.__version__)"` prints the same version as before, you've confirmed the environment is genuinely reproducible — not just working because of some leftover global install.

### Step 7: Register and select the right kernel

This is the step almost everyone skips, and it's the source of the single most common Jupyter complaint: "I `pip install`ed this but the notebook says it's not found." Jupyter's notebook server and the Python that actually executes your cells (the *kernel*) are two different things, and they can silently point at different environments.

Make the link explicit:

```bash
# with .venv still active
python -m pip install ipykernel
python -m ipykernel install --user --name=pandas-notebook-demo --display-name "Python (pandas-notebook-demo)"
```

This registers a kernel spec under a name unique to this project. Back in Jupyter, go to **Kernel → Change Kernel** and pick "Python (pandas-notebook-demo)" from the list. Now the notebook is unambiguously running the interpreter inside `.venv`, not whatever `python3` your system falls back to.

Why this matters: `pip install jupyter` does register a default kernel spec too, but if you have several venvs on your machine, they can collide on the generic name ("Python 3 (ipykernel)"), and whichever was registered last quietly wins for all of them. Naming your kernel explicitly per project removes the ambiguity entirely — it's cheap insurance against a confusing afternoon.

## Run it

Once everything above is wired up, here's what a correct run looks like end to end, starting from a clean terminal:

```bash
cd pandas-notebook-demo
source .venv/bin/activate
jupyter notebook
```

In the browser: open your notebook, confirm the kernel name in the top-right corner reads "Python (pandas-notebook-demo)" (not "Python 3" generically), then run the import cell. Expected output is two things: a printed line like `pandas version: 2.x.x` — the exact number depends on whatever was current when you ran `pip install pandas`, so don't worry if it doesn't match anyone else's — and a rendered HTML table with three rows and two columns underneath it.

If instead you get `ModuleNotFoundError: No module named 'pandas'`, the kernel selected in the notebook is not the one you installed pandas into. Re-check Step 7 — this is the failure mode that step exists to prevent.

## Harden it

A few things that go wrong in practice, and how to catch them before they cost you an hour:

**Never commit `.venv` to git.** It's large, platform-specific, and regeneratable. Add it to `.gitignore`:

```bash
echo ".venv/" >> .gitignore
```

Commit `requirements.txt` instead — that's the artifact that should travel with your code, not the environment itself.

**Sanity-check the environment before you trust it.** After any install, run:

```bash
pip check
```

This flags dependency conflicts (package A wants version X of a library, package B wants version Y) that installed silently but will break at import time. It's cheap and catches real problems.

**Don't use `sudo pip install`, ever.** If you find yourself typing `sudo` before a pip command, your venv isn't actually activated — you've fallen back to trying to modify system Python, which is the exact failure mode venvs exist to prevent. Re-run `source .venv/bin/activate` and try again without `sudo`.

**Be aware that `pip freeze` output is platform-sensitive.** A `requirements.txt` frozen on macOS can contain packages (or exact wheel builds) that don't resolve cleanly on Windows or Linux — this shows up most with packages that have OS-specific dependencies. For a small, personal project this rarely bites; for anything shared across machines or CI, keep an eye on install errors after `pip install -r requirements.txt` on a different OS, and pin only your direct dependencies (`pandas`, `jupyter`) in a separate minimal file if you hit this.

**Validate the version, don't just eyeball it.** In real setup scripts, don't trust "it printed something" — assert it:

```python
import pandas as pd
from packaging.version import Version

assert Version(pd.__version__) >= Version("2.0.0"), f"pandas too old: {pd.__version__}"
print("pandas OK:", pd.__version__)
```

This turns "looks fine" into a check that actually fails loudly when it should.

**If activation "works" but nothing changed:** you likely ran the activate script from a different shell than the one you're checking `which python` in, or you have a shell alias overriding `python`. `python -c "import sys; print(sys.executable)"` is the ground truth — trust it over the prompt prefix.

## Extend it

A few directions once this basic loop is solid:

- **Keep secrets out of the notebook entirely.** The moment this project needs an API key, don't hardcode it in a cell — load it from a `.env` file the way [Secrets and Config Management](/learn/python-data-apis/secrets-and-config-management) and [Loading Secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) describe. It's the same discipline as `requirements.txt`: keep what's reproducible in version control and what's sensitive out of it.
- **Separate direct dependencies from the full freeze.** Keep a short `requirements.in` (just `pandas`, `jupyter`) for humans to read, and treat the full `pip freeze` output as a generated lockfile. Tools like `pip-tools` automate this split once your dependency list grows past a handful of packages.
- **Let your editor pick the kernel for you.** In VS Code, opening the `.ipynb` file and running "Python: Select Interpreter" (or the notebook's own kernel picker) will list `.venv` automatically if it's in the project root — no manual `ipykernel install` needed for VS Code specifically, though the explicit registration from Step 7 still matters for the browser-based Jupyter UI.
- **Once the environment is solid, put real data through it.** Swap the toy `DataFrame` in Step 4 for something loaded from a CSV or API call — [Loading Data into pandas](/learn/python-data-apis/loading-data-into-pandas) picks up exactly where this lesson leaves off.
- **See where this fits in a full project.** [The Python Data Pipeline, Whole Game](/learn/python-data-apis/python-data-pipeline-whole-game) walks the environment-to-insight path end to end, with this setup as its first link.

**Related:** [Why Isolated Environments](/learn/python-data-apis/why-isolated-environments-intuition) · [Python Environments and venv](/learn/python-data-apis/python-environments-and-venv) · [Secrets and Config Management](/learn/python-data-apis/secrets-and-config-management) · [Loading Data into pandas](/learn/python-data-apis/loading-data-into-pandas) · [Environments & Tooling Quiz](/learn/python-data-apis/environments-tooling-quiz)
