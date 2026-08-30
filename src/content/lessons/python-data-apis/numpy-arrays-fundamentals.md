---
title: "NumPy Arrays: Shape, dtype, Axis"
track: "python-data-apis"
status: live
summary: "Explains the NumPy ndarray as a typed, fixed-shape grid — using 10,000 embedding vectors as the running example — and shows why shape, dtype, and axis let one vectorized call repla"
duration: "14 min read"
---

You call an embedding API 10,000 times, get back 10,000 lists of 768 numbers, and now you need to find which ones are similar to each other. Store that as a Python list of lists and every operation on it — normalizing, averaging, comparing — means writing a loop. Store it as one NumPy array and the same operations become single function calls that run orders of magnitude faster. The difference isn't syntax sugar; it's a completely different way of laying the data out in memory.

## What it is

A NumPy `ndarray` is a single block of memory holding numbers of **one fixed type** (its `dtype`), arranged into a fixed number of dimensions (its `shape`), where each dimension is called an **axis**. That's the whole definition — the rest of this lesson is about what falls out of it.

Contrast that with a Python list of lists. If you stored your 10,000 embeddings as `embeddings_list = [[0.12, -0.04, ...], [0.31, 0.02, ...], ...]`, what you actually have is one outer list holding 10,000 pointers to 10,000 separate list objects, each of which holds 768 pointers to individual Python `float` objects scattered across memory. Nothing enforces that every inner list has exactly 768 elements, or that every value is a float and not accidentally a string. It's flexible, and that flexibility is exactly what makes it slow and error-prone for numeric work — see [why arrays beat lists](/learn/python-data-apis/why-arrays-beat-lists-intuition) for the fuller case.

A NumPy array collapses all of that into one contiguous slab:

```python
import numpy as np

# 10,000 embedding vectors, each 768 numbers long
rng = np.random.default_rng(42)
embeddings = rng.standard_normal((10000, 768)).astype(np.float32)

print(type(embeddings))   # <class 'numpy.ndarray'>
print(embeddings.shape)   # (10000, 768)
print(embeddings.dtype)   # float32
print(embeddings.ndim)    # 2 -- two axes: axis 0 (rows) and axis 1 (columns)
```

`shape` is a tuple telling you the size along every axis. `dtype` is the single type every element is guaranteed to be. `ndim` is just `len(shape)`. There is no per-element bookkeeping — the array *is* the 10,000-by-768 grid, nothing more, nothing less.

## The mental model

Stop picturing an array as "a list that contains lists." Picture it as a spreadsheet, or better, as one long strip of numbers that NumPy *interprets* as having a certain shape. Physically, `embeddings` is 7,680,000 float32 values sitting back-to-back in memory. The shape `(10000, 768)` is a lens NumPy lays over that strip so that `embeddings[3]` means "give me the slice from position 3×768 to 4×768," reshaped into a 1D view of length 768.

This is why **axis** numbering works the way it does: axis 0 is the outermost dimension (walking it moves you between rows), axis 1 is the next one in (walking it moves you between columns within a row). When you reduce along an axis — take a mean, a sum, a max — think of it as **the axis you name is the one that disappears** from the resulting shape:

```python
row_norms = np.linalg.norm(embeddings, axis=1)   # collapse axis 1 (768 cols) -> one number per row
print(row_norms.shape)                            # (10000,)

centroid = embeddings.mean(axis=0)                # collapse axis 0 (10000 rows) -> one number per column
print(centroid.shape)                             # (768,)
```

Read `axis=1` as "reduce across each row's 768 values" and `axis=0` as "reduce down each column's 10,000 values." If you keep asking "which dimension am I collapsing away?" instead of memorizing which number means what, the confusion mostly disappears. This is the same shape discipline you'll lean on later for [broadcasting and indexing](/learn/python-data-apis/numpy-indexing-and-broadcasting).

## Why it works this way

The fixed dtype and fixed shape aren't restrictions for their own sake — they're what make the contiguous memory layout possible, and the contiguous layout is what makes vectorization possible.

Because every element is the same dtype and the same fixed number of bytes, NumPy knows in advance exactly how many bytes to skip to get from one row to the next (its "strides"). That means an operation like `np.linalg.norm(embeddings, axis=1)` doesn't need to ask Python "what type is this element? does it support multiplication? is it boxed?" 7.68 million times — it hands the whole memory block to a compiled C loop that already knows the layout, and that loop just marches through memory doing the same fixed operation on the same fixed-size chunks.

A Python list of lists can't offer that guarantee. Each element could, in principle, be a different type, so every `+` or `*` has to go through Python's normal dynamic dispatch — check the type, look up the right method, unbox the value, do the math, rebox the result. That overhead is paid **per element, per operation**, which is why a Python `for` loop over 7.68 million numbers is doing a lot more work than it looks like it's doing.

This is also why dtype matters beyond "just picking a type": `float32` uses half the memory of `float64`, so for the same shape you get half the memory traffic, which matters when 10,000×768 is small compared to what you'll actually work with (embedding datasets in production are often millions of vectors).

## A concrete example

Let's actually replace a loop with a vectorized call and see what each side is doing. First, the setup — the same 10,000-by-768 array of "embeddings" as before:

```python
import numpy as np
import math

rng = np.random.default_rng(42)
embeddings = rng.standard_normal((10000, 768)).astype(np.float32)

print(embeddings.shape)   # (10000, 768)
print(embeddings.nbytes)  # 30720000
```

That `nbytes` number is arithmetic you can check yourself: 10,000 rows × 768 columns = 7,680,000 float32 values, each 4 bytes, so 7,680,000 × 4 = 30,720,000 bytes (~30.7 MB, or ~29.3 MiB if you count in binary). Switch to `float64` and it doubles:

```python
embeddings64 = embeddings.astype(np.float64)
print(embeddings64.nbytes)  # 61440000 -- exactly double, since float64 is 8 bytes per element
```

If this were still a list of 10,000 Python lists, each of those 7.68 million numbers would also carry the overhead of being a full Python `float` object rather than a packed 4-byte slot — how much overhead depends on your interpreter, but it's real, and it's why the plain array is both smaller and faster to move around.

Now the actual task: compute the L2 norm of every embedding — a normalization step you'd run before, say, [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) search. Here's the vectorized way:

```python
row_norms = np.linalg.norm(embeddings, axis=1)   # one call, one compiled loop
print(row_norms.shape)     # (10000,)
print(row_norms[:3])       # e.g. array([27.9 , 27.6 , 27.85], dtype=float32)
```

And here's the loop you'd have to write without an array, if your data really were a list of lists:

```python
embeddings_list = embeddings.tolist()   # 10000 plain Python lists of 768 floats each

row_norms_slow = []
for row in embeddings_list:
    total = 0.0
    for x in row:
        total += x * x
    row_norms_slow.append(math.sqrt(total))

print(row_norms_slow[:3])   # matches row_norms above, up to float32/float64 rounding
```

Both produce the same answer (small differences in the last decimal place are just float32-vs-float64 accumulation, not a bug). But the loop version is doing 7.68 million individual multiplications and additions **at the Python interpreter level**, each one paying that dynamic-dispatch overhead described above. The `np.linalg.norm` call does the identical arithmetic, but dispatches once into a compiled loop that already knows it's working with a fixed 10000×768 block of float32 — that's the entire reason "vectorize it" is standard advice rather than a micro-optimization.

## Where it shows up

- **Embedding storage for retrieval and RAG.** A batch of embeddings from an API or a local model almost always lands as one 2D array (rows = items, columns = dimensions), which you then normalize, search, or feed to a similarity function — see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity).
- **Feature matrices for ML.** Any tabular dataset headed into a model becomes a 2D array of shape `(n_samples, n_features)` — in fact a pandas DataFrame's `.values` is exactly this underneath the hood.
- **Images and audio as tensors.** An image is commonly a 3D array of shape `(height, width, channels)` with `dtype=uint8`; a batch of images adds a fourth axis on the front.
- **Batching for API calls.** When you [batch requests to an LLM or embedding API](/learn/python-data-apis/batching-llm-calls-for-throughput), the responses you collect are exactly the kind of uniform, fixed-shape numeric data arrays are built for.
- **Any per-row or per-column statistic** — average embedding (a centroid), per-example L2 norm, per-feature min/max for scaling — is a one-line `axis=` reduction instead of a loop.

## Watch out for

- **Ragged or mixed-type input breaks the grid.** `np.array([[1, 2, 3], [1, 2]])` doesn't quietly become "a list of lists in disguise" — recent NumPy versions raise a `ValueError` because the shape isn't rectangular (older versions would silently fall back to a slow `dtype=object` array). If you're building an array from JSON or API responses, make sure every row really is the same length before you convert.
- **Growing an array row-by-row is a trap.** `np.vstack` or `np.append` inside a loop reallocates and copies the *entire* block on every iteration, because arrays are fixed-size once created. If you're collecting 10,000 embeddings one API call at a time, append them to a plain Python list first and call `np.array(...)` once at the end.
- **Axis mix-ups fail silently, not loudly.** `embeddings.mean(axis=0)` and `embeddings.mean(axis=1)` both run without error — they just give you 768 numbers instead of 10,000, or vice versa. Get in the habit of checking `.shape` right after any reduction; a wrong axis rarely crashes, it just quietly poisons the next several steps of your pipeline.

## Where next

Once shape, dtype, and axis feel natural, the next step is combining arrays of different shapes without writing loops — that's [indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting), followed by a full [normalize-features worked example](/learn/python-data-apis/numpy-normalize-features-example) that puts axis reductions to work end to end. If embeddings as a concept are still fuzzy, [what is a vector](/learn/maths-foundations/what-is-a-vector) and [the geometry of embeddings](/learn/maths-foundations/the-geometry-of-embeddings) give you the math picture this lesson's array picture sits on top of.

**Related:** [why arrays beat lists](/learn/python-data-apis/why-arrays-beat-lists-intuition) · [NumPy indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) · [normalize features example](/learn/python-data-apis/numpy-normalize-features-example) · [NumPy quiz](/learn/python-data-apis/numpy-quiz) · [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) · [what is RAG](/learn/rag/what-is-rag-and-when-to-use-it)
