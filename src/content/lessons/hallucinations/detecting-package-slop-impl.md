---
title: "Implementation: A Guard Against Hallucinated Packages"
track: "hallucinations"
status: live
summary: "A runnable checker that parses generated code and flags fabricated imports and methods before any of it executes."
duration: "8 min read"
---

This builds the check that [the API-hallucination walkthrough](/learn/hallucinations/code-hallucination-walkthrough) argued you need: something that looks at model-generated code *before* it runs and flags a package that doesn't exist or a method that was never part of the real API.

## What we're building

A small static-analysis pass, using only the Python standard library, that:

1. Parses every `import` in a block of generated code and checks the top-level package name against a real registry.
2. Parses every dotted function call (`requests.get_json_safe(...)`) and, for packages you've already vetted and installed, checks whether that attribute actually exists.
3. Returns a list of human-readable problems instead of raising — so the caller decides whether to block execution, ask the model to retry, or escalate to a human.

## Setup

No dependencies beyond the standard library: `ast` for parsing, `dataclasses` for clean result types, `importlib` for the resolvability and attribute checks.

```python
from __future__ import annotations
from dataclasses import dataclass
import ast
import importlib
import importlib.util
```

## Build it

### Step 1: Extract every import and every dotted call

```python
@dataclass
class ImportFinding:
    name: str        # top-level package, e.g. "requests_async"
    alias: str | None
    lineno: int

@dataclass
class CallFinding:
    root: str        # the name the call is rooted at, e.g. "requests"
    chain: str       # full dotted path, e.g. "requests.get_json_safe"
    lineno: int

def extract_imports_and_calls(source: str) -> tuple[list[ImportFinding], list[CallFinding]]:
    tree = ast.parse(source)
    imports: list[ImportFinding] = []
    calls: list[CallFinding] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                top_level = alias.name.split(".")[0]
                imports.append(ImportFinding(top_level, alias.asname, node.lineno))
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                top_level = node.module.split(".")[0]
                imports.append(ImportFinding(top_level, None, node.lineno))
        elif isinstance(node, ast.Call):
            chain = _dotted_chain(node.func)
            if chain:
                calls.append(CallFinding(chain.split(".")[0], chain, node.lineno))

    return imports, calls

def _dotted_chain(node: ast.AST) -> str | None:
    """Turn `requests.get_json_safe` into "requests.get_json_safe".
    Returns None for anything more dynamic than a plain dotted name
    (a call result, a subscript, getattr with a variable) — those
    can't be checked statically and are handled separately."""
    parts: list[str] = []
    while isinstance(node, ast.Attribute):
        parts.append(node.attr)
        node = node.value
    if isinstance(node, ast.Name):
        parts.append(node.id)
        return ".".join(reversed(parts))
    return None
```

> **Why this step?** `ast.parse` gives you the exact structure the interpreter itself would use — no regex guessing at what counts as an import. Walking for `ast.Call` nodes and collecting only the plain dotted-name ones deliberately narrows scope: dynamic call targets (`getattr(mod, name)()`) aren't checkable this way, and pretending otherwise would produce false confidence, not false positives.

### Step 2: Check package names against a real index

```python
def package_is_resolvable(name: str) -> bool:
    """True if `name` is importable in this environment right now.

    In production, replace this with (a) a check against your lockfile
    or already-installed set, and (b) for anything not already vetted,
    a real registry lookup — PyPI's JSON API at
    https://pypi.org/pypi/<name>/json returns 404 for names nobody has
    ever published, which is the fastest way to catch a name that was
    never real in the first place. Checking local resolvability first
    is what you want on the hot path: it's free, and it already catches
    the common case of an entirely invented name."""
    return importlib.util.find_spec(name) is not None
```

> **Why this step?** A hallucinated package name usually isn't installed *anywhere* — not in your environment, not on the registry — because nothing ever published it. Checking local resolvability first means most fabrications are caught with zero network calls; only names your environment doesn't recognize need the slower registry round-trip.

### Step 3: Check methods only against packages you already trust

```python
def method_is_resolvable(
    root_package: str, chain: str, allowlisted_packages: set[str]
) -> bool | None:
    """Returns True/False if the check ran, None if it didn't apply.

    Deliberately refuses to import anything outside `allowlisted_packages`
    just to check it — importing arbitrary model-suggested names before
    they've been vetted defeats the entire point of a pre-run gate."""
    if root_package not in allowlisted_packages:
        return None
    obj = importlib.import_module(root_package)
    for attr in chain.split(".")[1:]:
        if not hasattr(obj, attr):
            return False
        obj = getattr(obj, attr)
    return True
```

> **Why this step?** The method check needs a *real, already-installed* module to inspect against — you're asking "does this attribute exist on the thing I actually have," which only makes sense for packages already in your dependency set. Anything else falls through to the import check in Step 2 instead.

### Step 4: Resolve aliases, then assemble the gate

```python
def check_generated_code(source: str, allowlisted_packages: set[str]) -> list[str]:
    imports, calls = extract_imports_and_calls(source)
    alias_map = {imp.alias: imp.name for imp in imports if imp.alias}
    problems: list[str] = []

    for imp in imports:
        if not package_is_resolvable(imp.name):
            problems.append(
                f"line {imp.lineno}: `{imp.name}` is not an installed or "
                f"resolvable package — likely hallucinated."
            )

    for call in calls:
        real_root = alias_map.get(call.root, call.root)
        ok = method_is_resolvable(real_root, call.chain, allowlisted_packages)
        if ok is False:
            problems.append(
                f"line {call.lineno}: `{call.chain}` does not exist on "
                f"the installed `{real_root}` — likely a hallucinated API."
            )

    return problems
```

> **Why this step?** Aliases (`import numpy as np`) mean the name used in a call (`np.something()`) isn't the real package name — resolving `alias_map` before the method check is what keeps `np` from being wrongly treated as an unresolvable package instead of correctly mapped back to `numpy`.

## Run it

```python
GENERATED_CODE = "\n".join([
    "import requests_async",                       # line 1
    "",                                             # line 2
    "def fetch(url):",                              # line 3
    "    return requests_async.get_json(url)",      # line 4
    "",                                             # line 5
    "import requests",                              # line 6
    "",                                             # line 7
    "def fetch_safe(url):",                         # line 8
    "    resp = requests.get(url)",                 # line 9
    "    return requests.get_json_safe(url)",       # line 10
])

problems = check_generated_code(GENERATED_CODE, allowlisted_packages={"requests"})
for p in problems:
    print(p)
```

This flags exactly two things: line 1, because `requests_async` isn't a resolvable package in the environment; and line 10, because the real, installed `requests` module has no `get_json_safe` attribute. Line 9's `requests.get(url)` passes cleanly — `requests` genuinely has a top-level `get` function, so `method_is_resolvable` returns `True` and nothing is reported. Line 4's `requests_async.get_json` is left to the import-level finding on line 1 rather than double-flagged, because `requests_async` was never in the allowlist to begin with.

## Harden it

- **Cache resolvability checks.** A hallucinated name doesn't change between runs — don't re-hit the registry (or even `importlib.util.find_spec`) on every single generation.
- **Treat dynamic call targets as unverifiable, not clean.** `_dotted_chain` already returns `None` for a call like `getattr(obj, name)()` — surface those separately as "cannot verify statically" rather than silently passing them, since silence there would read as a guarantee you didn't actually make.
- **Maintain an internal-package allowlist.** Your own private packages will never resolve against a public registry lookup; without an explicit allowlist entry they'll be flagged as hallucinated every time.

## Extend it

- **Wire it in as a pre-run gate.** Before any sandbox executes model-written code, run `check_generated_code` first. A non-empty result means: don't execute, hand the findings back to the model for a self-correction pass, or escalate to a human reviewer for anything touching a write path.
- **Port the same shape to npm/Node.** Swap `ast` for a JS/TS parser, swap the registry check for the npm registry's package-metadata endpoint, and the two-part structure — resolvable package, resolvable method — carries over unchanged.
- **Feed findings into your eval set.** Every hallucinated import or method this catches in the wild is a real example worth keeping — see [fact-checking pipelines](/learn/hallucinations/fact-checking-pipelines) for folding this kind of catch into a continuous review loop rather than a one-off script.

**Related:** [Worked Example: Hallucinated APIs and Slopsquatting](/learn/hallucinations/code-hallucination-walkthrough), [Code Hallucination and Package Slop](/learn/hallucinations/code-hallucination-and-package-slop), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [Fact-Checking Pipelines](/learn/hallucinations/fact-checking-pipelines)
