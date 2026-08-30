---
title: "Chunking, Worked: One PDF Through Three Strategies"
track: "rag"
status: live
summary: "One 40-page switch manual, chunked three real ways with actual token counts and cosine scores, showing exactly where fixed-size chunking slices a table mid-word and how recursive."
duration: "7 min read"
---

Chunking advice tends to stay abstract — "fixed-size is fast but dumb, semantic is smart but slower." Fair enough, but does that survive contact with an actual document? Below is one real PDF excerpt, split three different ways, with the literal byte-for-byte cuts each method makes and the real numbers behind them — then one question that only some of those cuts can actually answer.

## The setup

You're building a support bot for a network hardware vendor. The source document is the *SC-2400 Managed Switch Installation and Configuration Guide*, a fairly ordinary 40-page PDF:

1. Overview & safety (pp. 1–6)
2. Unboxing & mounting (pp. 7–14)
3. Web UI initial setup (pp. 15–18)
4. Port and PoE specifications (pp. 19–20)
5. VLAN configuration (pp. 21–30)
6. Troubleshooting (pp. 31–36)
7. Warranty & compliance (pp. 37–40)

You ran it through a layout-aware PDF extractor that preserves tables as Markdown pipes (how faithfully a given extractor does that is its own rabbit hole — assume here it worked cleanly). Section 4, pages 19–20, comes out as this string — 504 words, and, tokenized with `cl100k_base` (the tokenizer behind OpenAI's embedding and GPT-4 model families, and a reasonable stand-in for "how big is this chunk" no matter which embedding model you actually call), 751 tokens:

```markdown
### 4.1 Port Groups

The SC-2400 provides 24 RJ45 Gigabit Ethernet ports (numbered 1 through 24) and 4 SFP+
uplink slots (numbered 25 through 28). Ports 1-24 support IEEE 802.3at (PoE+) power
delivery to connected devices such as access points, IP cameras, and VoIP phones. Ports
25-28 do not supply power and are intended for uplinks to a core switch, router, or fiber
aggregation device. All PoE-capable ports auto-negotiate power class with the connected
powered device (PD) during the initial link handshake, and the switch will not energize a
port until a valid PD signature is detected, which protects non-PoE equipment from
accidental power injection.

Each port group is independently monitored by the switch's onboard power controller,
which reports per-port draw in 0.1W increments to the management CPU every four seconds.
This telemetry is exposed through the web UI's Power dashboard, through SNMP (see
Appendix C for the full MIB reference), and through the CLI command `show power inline`.
Administrators can set per-port power limits below the 802.3at maximum of 30W if a
deployment requires stricter budget control, for example when provisioning a large number
of low-draw sensors on a shared budget.

Before cabling any port, confirm the installation site meets the environmental limits in
Section 2.4 (operating temperature 0-45°C, non-condensing humidity 10-90%). Ports left
unused for extended periods should be capped with the supplied dust plugs to keep the
internal chassis rated at IP30 for particulate ingress. Rack-mount installations should
preserve at least 25mm of clearance on both side-vent panels to maintain the airflow path
the thermal model in Section 4.3 assumes.

### 4.2 Port and PoE Table

The table below summarizes port type, link speed, PoE class, and maximum per-port power
draw for both port groups on the SC-2400.

| Port Range | Type | Speed | PoE Class | Max Power per Port | Max Cable Length |
|---|---|---|---|---|---|
| 1-24 | RJ45 | 10/100/1000BASE-T | 802.3at (PoE+) | 30W | 100m (Cat5e or better) |
| 25-28 | SFP+ | 10GBASE-T / fiber | N/A (no PoE) | N/A | 100m copper / 300m fiber (OM3) |

### 4.3 PoE Power Budget and Thermal Derating

The switch has a total PoE power budget of 370W shared across all 24 PoE-capable ports.
Under normal operating conditions, defined as ambient temperature at or below 40°C, each
port can draw up to its full 30W class allocation, subject only to the 370W aggregate
ceiling across the whole port group.

When ambient temperature exceeds 40°C, the switch's thermal management firmware derates
the total PoE budget by 15% to protect internal components, which reduces the usable
aggregate budget to approximately 314W. During a derating event, ports 21 through 24 are
the first to have power shed if aggregate demand exceeds the reduced budget; the switch
logs a PoE-DERATE warning to the system log and emits SNMP trap 6.14 to any configured
trap receivers. Full power to ports 21-24 is restored automatically once ambient
temperature drops back below 38°C and stays there for five consecutive minutes.
```

Here's the question you'll run against all three chunkings below: **"What's the maximum PoE power available to port 24 if the room hits 42°C?"** The honest answer needs two facts from two different paragraphs — port 24 is in the 1–24 group, class 802.3at, normally good for 30W (that's the table); and above 40°C the firmware derates the aggregate budget by 15% and sheds power to ports 21–24 *first* (that's two paragraphs later, in 4.3). Retrieve only one of those and you'll answer confidently — and wrong.

## Step by step

### Step 1 — Fixed 512-token chunks: count, cut, don't look back

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
tokens = enc.encode(section_4_text)
print(len(tokens), "tokens total")

chunk_size = 512
chunks = [enc.decode(tokens[i:i + chunk_size]) for i in range(0, len(tokens), chunk_size)]
for i, c in enumerate(chunks):
    print(i, len(enc.encode(c)), "tokens")
```

```text
751 tokens total
0  512 tokens
1  239 tokens
```

Two chunks. Token 512 lands here — mid-row, mid-*word*:

```text
# end of chunk 0
...| 1-24 | RJ45 | 10/100/1000BASE-T | 802.3at (PoE+) | 30W | 100m (Cat5e or better) |
| 25-28 | SFP+ | 10
```
```text
# start of chunk 1
GBASE-T / fiber | N/A (no PoE) | N/A | 100m copper / 300m fiber (OM3) |

### 4.3 PoE Power Budget and Thermal Derating
...
```

`10GBASE-T` gets split into `10` and `GBASE-T`. Chunk 0 keeps the header row and the full 1–24 row (port 24's own row, incidentally) intact, but the SFP+ row is orphaned — its remaining cells land in chunk 1 with no header and no row label to say what "300m fiber" even refers to. And because there was room left over, chunk 1 also swallows all of section 4.3 whole, purely by accident of where the counter happened to be.

> **Why this step?** Nobody picks fixed-size chunking because they think it's *smart* — they pick it because it's the cheapest thing that works at scale. It's deterministic, needs zero model calls to compute, and gives every chunk a predictable size for cost and context-window budgeting — genuinely valuable if you're indexing 50,000 manuals, not one. The failure here isn't that the idea is bad; it's that a token counter has no concept of "table row" or "sentence," and on any real document with tables, lists, or code blocks, it will eventually land exactly where you don't want it. This one just happens to land in a particularly ugly spot.

### Step 2 — Recursive chunking: headings first, then paragraphs, then sentences

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

header_docs = MarkdownHeaderTextSplitter(
    headers_to_split_on=[("###", "section")], strip_headers=False
).split_text(section_4_text)

splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base", chunk_size=512, chunk_overlap=0
)
final_chunks = [c for doc in header_docs for c in splitter.split_text(doc.page_content)]
for i, c in enumerate(final_chunks):
    print(i, len(enc.encode(c)), "tokens")
```

```text
0  382 tokens   -> ### 4.1 Port Groups (all three paragraphs)
1  164 tokens   -> ### 4.2 Port and PoE Table (intro + full table)
2  209 tokens   -> ### 4.3 PoE Power Budget and Thermal Derating
```

It first splits on `###` headers, then within each header-section keeps recursing on the separator hierarchy (`\n\n`, then `\n`, then sentence, then word) *only if* a section is still over 512 tokens. All three of ours fit under the limit on their own, so nothing gets sub-split — chunk 1 is the table intro plus the entire table, byte-for-byte:

```text
### 4.2 Port and PoE Table

The table below summarizes port type, link speed, PoE class, and maximum per-port power
draw for both port groups on the SC-2400.

| Port Range | Type | Speed | PoE Class | Max Power per Port | Max Cable Length |
|---|---|---|---|---|---|
| 1-24 | RJ45 | 10/100/1000BASE-T | 802.3at (PoE+) | 30W | 100m (Cat5e or better) |
| 25-28 | SFP+ | 10GBASE-T / fiber | N/A (no PoE) | N/A | 100m copper / 300m fiber (OM3) |
```

No mid-word carnage this time. But notice: 4.2 and 4.3 are now two *separate* chunks, split cleanly at the heading. Hold that thought — it matters in a minute.

> **Why this step?** The separator hierarchy (heading → blank line → newline → word) is a heuristic that tracks how people actually write: a paragraph is usually one thought, a new heading usually starts another. That's why this generally outperforms fixed-size chunking with almost no extra cost — you're just respecting structure the author already gave you for free. But it's respecting the *author's* organization, not the *reader's* future questions. The manual's writer split "the spec" (4.2) from "the caveat" (4.3) into neighboring subsections because that's good technical writing — not because they knew a support bot would need both in the same breath.

### Step 3 — Semantic chunking: split where the meaning changes, not where the markup does

Semantic chunking skips headings and page breaks entirely. You embed each sentence (or small group of sentences), walk the cosine similarity between consecutive units, and place a breakpoint wherever similarity drops sharply — the "weakest link" in the chain — rather than at a fixed size or a markup boundary. See [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) for how that similarity call works and [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for the math underneath it.

You don't need an API key to see the mechanism — here it is with TF-IDF vectors as a free, local stand-in for a real embedding model (a real one would likely sharpen this curve further, but the shape is the same):

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

units = [para_4_1a, para_4_1b, para_4_1c, table_4_2, para_4_3a, para_4_3b]  # 6 sub-units
X = TfidfVectorizer().fit_transform(units)
sims = cosine_similarity(X)
gaps = [round(sims[i][i + 1], 3) for i in range(len(units) - 1)]
print(gaps)
```

```text
[0.22, 0.131, 0.098, 0.204, 0.27]
```

Read those as: (4.1 §1→§2, 0.220), (4.1 §2→§3, 0.131), (**4.1 §3 → the table, 0.098**), (table → 4.3 §1, 0.204), (4.3 §1→§2, 0.270). The weakest link — by a clear margin — is the one *before* the table, not the one after it. A breakpoint algorithm cutting at the weakest gap draws exactly one boundary here: **before 4.2, not between 4.2 and 4.3.** That leaves two chunks: all of 4.1 on one side, and the table plus both 4.3 paragraphs fused into a single 373-token chunk on the other (literally: the 164-token table chunk and the 209-token derating chunk from Step 2, concatenated — 164 + 209 = 373).

That's the interesting result: the table and the derating rule are more alike, in plain lexical terms, than either is to the cabling-and-clearance paragraph that precedes the table. A structure-blind splitter picks that up; a heading-bound one structurally can't, no matter how it's tuned.

> **Why this step?** This isn't free intelligence — it's a different cost, not a lower one. Every candidate unit needs an embedding call *before* you've written a single chunk to your index, chunk sizes become unpredictable (382 and 373 tokens here, but on a wordier document the weakest link might not fire until you've accumulated 3,000 tokens of similar-sounding filler), and the "weakest link" heuristic has its own failure mode: two genuinely different topics that happen to share vocabulary can look falsely similar and never get split at all. It earned its keep on this specific excerpt because structure and meaning happened to diverge. It won't always.

## Where it breaks

Score all five candidate chunks against the query — "What's the maximum PoE power available to port 24 if the room hits 42°C?" — with the same TF-IDF proxy used above, purely as a stand-in for what a real retriever's vector search would rank:

| Chunk | Similarity to query |
|---|---|
| Fixed chunk 0 (table, no derating info) | 0.092 |
| Fixed chunk 1 (derating + orphaned row tail) | 0.316 |
| Recursive 4.2 (table only) | 0.093 |
| Recursive 4.3 (derating only) | 0.321 |
| Semantic merged (table + derating) | 0.318 |

Look at rows one and two, then three and four: in **both** fixed and recursive chunking, the query scores roughly 3.4× higher against the derating chunk than the table chunk. That makes sense — "42°C," "derate," "shed" are the query's own vocabulary, and they live in 4.3. A top-1 (or even a tight top-2) vector search on either chunk set is going to retrieve the derating paragraph and stop there.

That chunk tells you, correctly, that above 40°C the switch derates and sheds ports 21–24 first — but it never says port 24 is even in the 30W/802.3at group to begin with. Hand that alone to a generator and it either drops the base number from its answer or, worse, guesses one, since 30W never made it into context. Fixed chunking adds a second, gratuitous problem: even a top-2 retrieval that also pulls chunk 0 gets a table fragment ending in a dangling `"| 25-28 | SFP+ | 10"` — collateral damage on a row the query didn't even need, purely because the cut fell where it fell.

The semantic chunk is the only one of the three that answers this cleanly with a single top-1 retrieval, because — for this specific document — the table and the derating rule happened to land in the same chunk.

**The fix is two separate moves, not one:**

1. **Never let a splitter cut inside an atomic unit.** Tables, code blocks, and list items should be detected and treated as indivisible regardless of token count — most recursive splitters support a "keep together" override, or you table-detect before chunking and skip recursion inside a matched span. This is necessary. It is *not* sufficient, as the data above shows: recursive chunking already did this and still failed the query, because 4.2 and 4.3 are still two chunks.
2. **Close the gap between structurally-separate, topically-related facts.** Three ways to do it, in order of how much machinery they cost you: use similarity-based breakpoints (Step 3) so facts group by meaning instead of markup; add enough chunk overlap that a neighboring fact rides along —
   ```python
   splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
       encoding_name="cl100k_base", chunk_size=512, chunk_overlap=220  # >= the 209-token
       # neighbor you actually need to pull in, not a token count picked at random
   )
   ```
   (220 tokens of overlap here is large enough to swallow all of 4.3 into 4.2's tail — at which point you've basically rediscovered the semantic chunker's answer by brute force, just without it deciding *where* that overlap was actually needed); or retrieve the small chunk that matched and expand out to its section siblings before it reaches the generator, which is the [parent document retrieval](/learn/rag/parent-document-retrieval) pattern and avoids guessing an overlap size up front.

## Takeaways

- Fixed-size chunking doesn't fail occasionally — it fails wherever the token counter happens to land, and on any real document with tables or lists, that's eventually mid-row or mid-word. It's cheap and deterministic, which is why it's still used at scale, but it has no concept of "don't cut here." (This specific mistake — table row across a chunk boundary — is common enough to be its own entry on [chunking's common-mistakes list](/learn/rag/chunking-common-mistakes).)
- Recursive splitting fixes *structural* violence, not semantic distance. It will keep a table intact every time — and it still separated a spec from its caveat two paragraphs later, because a heading boundary isn't a promise that everything a future question needs sits under one heading.
- Semantic chunking earns its keep exactly where structure and meaning diverge, as it did here — but it trades a predictable chunk size and zero-embedding-cost indexing for variable sizes and a similarity call per candidate unit. It's not a strictly-better default; it's a different bet.
- Whichever splitter you choose, test it against the actual questions people ask, not against how clean the chunks look. A 3.4× retrieval-similarity gap between the chunk that has your answer and the one that doesn't is invisible until you run the query — see [chunking strategies compared](/learn/rag/chunking-strategies-compared) for how the three approaches trade off beyond this one example.

**Related:** [Chunking strategies for documents](/learn/rag/chunking-strategies-for-documents) · [Embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) · [Cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Parent document retrieval](/learn/rag/parent-document-retrieval) · [Chunking common mistakes](/learn/rag/chunking-common-mistakes) · [Chunking strategies compared](/learn/rag/chunking-strategies-compared)
