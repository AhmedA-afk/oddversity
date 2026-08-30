---
title: "Why Arrays Are Fast (and Lists Aren't)"
track: "python-data-apis"
status: live
summary: "Wrote the full INTUITION-page lesson body (Markdown, no frontmatter/H1) for 'Why Arrays Are Fast (and Lists Aren't)' in Oddversity's Python & Data / NumPy Arrays module: a runnable"
duration: "14 min read"
---

## Why Arrays Are Fast (and Lists Aren't)

Sum a million numbers with a plain Python `for` loop, then sum the same million numbers with `np.sum`, and you're watching two machines do identical arithmetic at wildly different speeds — for a reason that has nothing to do with how cleverly either loop is written.

## Race them yourself

Before any explanation, run the thing:

```python
import time
import numpy as np

n = 1_000_000
data_list = [float(i) for i in range(n)]
data_array = np.array(data_list, dtype=np.float64)

# Plain Python loop
start = time.perf_counter()
total = 0.0
for x in data_list:
    total += x
loop_time = time.perf_counter() - start

# Built-in sum()
start = time.perf_counter()
total_builtin = sum(data_list)
builtin_time = time.perf_counter() - start

# NumPy
start = time.perf_counter()
total_np = np.sum(data_array)
numpy_time = time.perf_counter() - start

print(f"for-loop:  {loop_time:.4f}s")
print(f"sum():     {builtin_time:.4f}s")
print(f"np.sum():  {numpy_time:.4f}s")
```

Run it on your own machine — the exact numbers depend on your CPU and Python version, so don't take mine as gospel. But the shape of the result is extremely consistent across machines: the loop lands somewhere in the tenths-of-a-second range, `np.sum` lands somewhere in the low milliseconds, and `sum()` sits in between, closer to the loop. That's not a 20% difference you'd shrug off. It's an order of magnitude or two — the gap between "fine, I'll wait" and "I didn't notice it ran." If you're in a Jupyter notebook, `%timeit np.sum(data_array)` will give you a more stable reading by repeating the call automatically (see the [venv and Jupyter setup lesson](/learn/python-data-apis/setting-up-venv-and-jupyter) if you haven't got a notebook running yet).

Your intuition should now be itching. Same numbers, same operation, same CPU — so what's actually different?

## The warehouse, and the scavenger hunt across town

Here's the picture worth keeping in your head.

**The Python list** is a shipping manifest with a million addresses on it. Each address points to a box sitting somewhere in a warehouse the size of a city — box #4 might be across town from box #5, because Python allocated them whenever and wherever it felt like it. To read one price tag, you drive to the address, park, walk in, open the box, and — because the manifest doesn't actually guarantee what's inside — check the label to confirm it's a price tag and not a sticky note before you trust the number on it. Then you drive to the next address. You do this a million times, in sequence, one box at a time.

**The NumPy array** is one warehouse aisle. All million items sit on a single shelf, unwrapped, identical size, lined up edge to edge, in order. There's no manifest to consult and no boxes to open, because the shelf itself guarantees what's on it — the aisle is labeled "float64s, nothing else." A forklift with an eight-pronged fork drives down the aisle and scoops up eight items at a time in one motion, because it already knows, before it arrives, exactly what shape and size it's grabbing.

That's the whole story in miniature: **the list pays a toll on every single element for not knowing what it is or where it lives; the array pays that toll once, up front, for the whole collection.**

If you haven't already, it's worth grounding this against how [lists and dicts actually sit in memory](/learn/python-data-apis/lists-dicts-sets-intuition) — a Python list isn't storing your floats at all. It's storing pointers to them.

## What the CPU is actually doing, step by step

Let's trace one element through `total += x` inside the Python loop:

1. Pull the next pointer out of the list's internal array (that array of *pointers* is contiguous — the floats it points to are not).
2. Follow the pointer to wherever that particular float object lives on the heap — potentially a cache miss, since it could be anywhere.
3. Check the object's type tag to confirm it actually supports addition — Python doesn't know in advance, because a list can hold anything.
4. Unbox the raw 8-byte double from inside the Python float object (which also carries a reference count and a type pointer — overhead riding along with every number).
5. Run the addition through a general dispatch function that decides, based on step 3, which addition to actually perform.
6. Allocate a brand-new float object on the heap to hold the result — floats are immutable, so `total` can't be updated in place.
7. Rebind the name `total` to the new object and decrement the old one's reference count.
8. Repeat, a million times.

That's roughly seven sub-operations per element, including a heap allocation and a pointer-chase, for a single addition. `sum()` skips step 7's Python-level bytecode dispatch by doing the looping in C — which is why it beats the manual loop — but it still walks the same pointers, does the same type checks, and unboxes the same objects. It shrinks the tax. It doesn't remove it.

Now trace `np.sum(data_array)`:

1. Python makes one call into a compiled C routine, handing it a raw pointer to the start of a contiguous block of memory, a length, and a dtype.
2. Inside that routine there are no per-element type checks and no per-element allocation — the dtype was resolved once, before the loop started.
3. Because the bytes are contiguous, the CPU's prefetcher pulls the next chunk into cache before the loop even asks for it — the "next" element is always right next door in memory, never a surprise address across town.
4. Most modern CPUs (SSE, AVX, or AVX2 depending on age) can add several `float64` values in a single vector instruction — so the loop advances 4 or 8 elements at a time instead of 1.
5. Partial vector sums are combined into one number at the end.

> Aside: `np.sum` doesn't even add elements in the naive left-to-right order the Python loop uses. For large arrays it uses pairwise summation — splitting the array into chunks, summing each, then combining the partial sums — which vectorizes better *and* accumulates less floating-point rounding error than one long running total. Array-first code isn't just faster here; it's slightly more numerically correct too.

## The wrong intuition: "it's just that Python is slow"

The tempting explanation is that Python's interpreter is the bottleneck — that every loop iteration pays a tax for bytecode dispatch, and if you could just skip that tax you'd close the gap. The `sum()` timing is the test of that theory, and it fails: `sum()` removes the interpreter loop entirely (it's a C-level loop under the hood) and still comes nowhere near `np.sum`.

The real bottleneck isn't *the loop*. It's *the data structure the loop walks over*. A Python list is a scavenger hunt no matter which language walks it — pointer-chasing to scattered heap objects defeats CPU caching regardless of whether the walking code is Python bytecode or hand-written C, and boxed, individually-typed objects can't be fed into a vector instruction that needs to know it's grabbing eight identical 8-byte slots. You could rewrite the manual loop as a C extension and it would still lose to `np.sum`, because the fix was never "run less Python" — it's "stop storing the data as a list of boxes in the first place." Fast numeric code is a property of memory layout before it's a property of which language iterates over it. This is also the deeper reason [comprehensions and generators](/learn/python-data-apis/comprehensions-and-generators) speed up *Python-level* work without ever closing this particular gap — they still hand you boxed objects, one at a time.

## Why the whole AI stack bet on this

Once you've internalized "contiguous, single-type memory lets hardware stream instead of chase," a lot of the ecosystem stops looking like arbitrary API choices and starts looking inevitable. An embedding is a [vector](/learn/maths-foundations/what-is-a-vector) of a few hundred or thousand floats — you want it packed exactly the way the array in this lesson was packed, because you're about to compute dot products and norms over millions of them, over and over, in a retrieval loop or a training step. A PyTorch or TensorFlow tensor is the same contiguous-buffer idea, extended to GPUs, which push the "many identical items processed at once" trick from a handful of CPU vector lanes to thousands of GPU cores running in lockstep — same story, much bigger forklift. That's the throughline covered in the [AI hardware stack](/learn/ai-foundations/ai-hardware-stack) lesson: the entire numerical layer underneath modern AI — NumPy, pandas' backing columns, tensors, embedding indexes — is array-first because "array-first" is the only layout that lets the hardware actually run fast. Once you've got the instinct for *why*, the [formal vocabulary](/learn/python-data-apis/numpy-arrays-fundamentals) for it — dtype, shape, strides — will click into place instead of feeling like syntax to memorize. From there, [indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) and the [feature normalization example](/learn/python-data-apis/numpy-normalize-features-example) are both just this same idea applied to real work.

## When the analogy breaks

The warehouse-aisle picture is accurate, but it quietly assumes a few things that aren't always true.

**It assumes every item on the shelf is genuinely the same type and size.** Force NumPy to hold mixed Python objects and you rebuild the scavenger hunt on purpose:

```python
mixed = np.array([1, "two", 3.0], dtype=object)
print(mixed.dtype)   # object
```

An `object`-dtype array is a NumPy container wrapping ordinary boxed Python objects — you get the array *syntax* with none of the layout benefit. If a column of data must hold mixed types, you've stepped outside where this speedup applies.

**It assumes the shelf is worth walking at all.** The forklift has to be dispatched — there's a real, fixed cost to crossing from Python into NumPy's C layer. For a handful of elements, that fixed cost can outweigh everything it buys you, and a plain Python loop can genuinely win on tiny inputs. The advantage shows up once you're doing real volume, not on five numbers.

**It assumes the aisle is unbroken.** Slice with a stride and you get a *view* into the same memory, but no longer a straight walk through it:

```python
big = np.arange(1_000_000, dtype=np.float64)
every_other = big[::2]

print(big.flags["C_CONTIGUOUS"])          # True
print(every_other.flags["C_CONTIGUOUS"])  # False
```

`every_other` is still fast compared to a Python list, but it's skipping every second slot instead of walking edge-to-edge — some of the cache-line and vectorization benefit is gone. NumPy handles this correctly either way; it just isn't the clean, unbroken shelf the analogy pictures. The [indexing and broadcasting lesson](/learn/python-data-apis/numpy-indexing-and-broadcasting) is where this distinction actually starts to matter for how you write code, not just how fast it runs.

**Related:** [Lists, dicts, and sets intuition](/learn/python-data-apis/lists-dicts-sets-intuition) · [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) · [NumPy indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) · [The AI hardware stack](/learn/ai-foundations/ai-hardware-stack) · [What is a vector](/learn/maths-foundations/what-is-a-vector) · [Normalizing features with NumPy](/learn/python-data-apis/numpy-normalize-features-example)
