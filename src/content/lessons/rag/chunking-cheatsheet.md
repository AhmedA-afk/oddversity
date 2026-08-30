---
title: "Chunking Cheatsheet"
track: "rag"
status: live
summary: "Starting chunk sizes, overlap, and splitter picks for prose, tabular docs, code, and transcripts — plus copy-paste splitter snippets for each."
duration: "7 min read"
---

You already know the tradeoffs from [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) — this page skips the theory and gives you numbers to type in. Treat every value here as a starting point, then measure with your own eval, not a target to hit.

## The one decision that matters before size does

Pick the splitter from document *structure*, not from a size you liked on a previous project. Size is the second decision, and it's mostly noise compared to getting the boundaries right.

- **If the doc is long-form prose with no reliable internal structure** (articles, books, narrative reports) → recursive character/token splitter, paragraph-first.
- **If the doc has headings and/or tables** (specs, policies, wikis, PDFs with tables) → split on heading hierarchy first, then recurse inside each section; keep tables whole.
- **If it's source code** → split at function/class boundaries with a language-aware splitter, never a raw character window.
- **If it's a transcript** (calls, meetings, podcasts) → split on speaker turns or a time window, not on punctuation.
- **If it's already atomic** (one FAQ entry, one product row, one ticket) → don't split it. One logical unit = one chunk.

## Starting points by document type

| Doc type | Chunk size (starting point) | Overlap (starting point) | Splitter |
|---|---|---|---|
| Prose / narrative | 500–800 tokens (~2,000–3,200 chars) | 10–15% (~50–100 tokens) | Recursive character/token splitter, paragraph → sentence → word fallback |
| Docs w/ headings & tables | 300–600 tokens per section | ~10% within a section, 0% across a table boundary | Header-aware split first, recursive splitter inside each section, tables kept as standalone chunks |
| Code | 100–200 lines (~800–1,200 tokens) | 0–10% | Language-aware / AST splitter at function or class granularity |
| Transcripts | 1–3 minutes or 5–10 speaker turns | 1 turn overlap (~15–20%) | Turn- or time-window grouping, speaker-aware |
| Short structured entries (FAQ, product rows) | 1 entry | 0% | No splitter — the record boundary *is* the chunk boundary |

These are defensible defaults for a first index, not benchmarked optima — swap in real numbers once you've run [chunking-worked-example](/learn/rag/chunking-worked-example) against your own corpus and query mix.

## Which splitter, one line each

- **Recursive character/token splitter** — the general-purpose default. Tries paragraph breaks, then sentences, then words, only falling back to a hard character cut when nothing else fits. Good enough for most prose unless you have reason to do better.
- **Header-aware splitter (Markdown/HTML)** — splits on `#`/`##`/heading tags before anything else, so every chunk inherits its section path as metadata. Run a recursive splitter *inside* each resulting section if it's still too long — don't apply it to the whole doc at once.
- **Language-aware / AST code splitter** — walks the language grammar (or uses a library's per-language separator list) so a chunk never ends mid-function-signature or mid-bracket. A plain character splitter on code will cut through the middle of a function about as often as not; treat that as disqualifying, not a rare edge case.
- **Semantic / breakpoint splitter** — chunks where the embedding distance between adjacent sentences actually jumps, instead of at a fixed size. Costs an embedding call per candidate boundary, so it's slower and pricier to build. Worth it on dense, argument-heavy prose (legal, medical, policy) where a fixed size reliably cuts mid-argument; overkill for most everything else.
- **Turn/time-window grouping (hand-rolled)** — transcripts don't have punctuation-based structure worth exploiting; the real unit is the speaker turn. No off-the-shelf text splitter models this well, so this is usually 15 lines of your own code, not a library call.

## Quick rules

- **Overlap is insurance, not a knob to maximize.** 10–20% catches boundary-split ideas; past ~25% you're paying storage and index cost to embed duplicate text with little retrieval benefit.
- **Size in tokens once you know your embedding model, not characters.** Token count is what determines silent truncation; character count is a proxy that lies to you differently for code, CJK text, and markup.
- **Match size to query type.** Point-lookup questions ("what's the timeout parameter") want small, precise chunks. Synthesis questions ("summarize the rollout plan") want more surrounding context — go bigger, or use [parent-document retrieval](/learn/rag/parent-document-retrieval) to keep small chunks for search but return the parent section for generation.
- **A table row without its header is meaningless.** Keep the whole table as one chunk, or if it must be split, repeat the header (or column names) in every resulting piece — don't rely on the model remembering it from three chunks back.
- **Code overlap buys little.** Functions and classes are already self-contained units; spend the token budget on keeping a function's imports or class context attached rather than duplicating lines across chunks.
- **Strip timestamps and speaker tags from the embedded text, keep them as metadata.** They add noise to the embedding but you still need them attached to the chunk for citation.
- **Re-measure whenever you change embedding models.** The "right" chunk size is a property of what the model saw in training, not a universal constant — a size that worked well with one embedding model can silently get truncated or diluted by another. See [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity).
- **Smaller chunks and bigger chunks fail in opposite directions**, and no single size dodges both: small chunks retrieve precisely but fragment context and need higher top-k; big chunks need less top-k but dilute the embedding with irrelevant sentences. Pick a lane deliberately — see [chunking strategies compared](/learn/rag/chunking-strategies-compared) — rather than splitting the difference and getting mediocre results on both queries.
- **Don't tune size twice on vibes.** Pick a starting point from the table above, wire up an eval, then adjust. See [evaluating RAG quality](/learn/rag/evaluating-rag-quality) — and if retrieval is fine but answers still miss context, the fix is often [contextual retrieval](/learn/rag/contextual-retrieval), not a smaller or bigger chunk.

## Snippets: copy, paste, adjust the numbers

**Prose — recursive splitter with a real token counter:**

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")

def token_len(text: str) -> int:
    return len(enc.encode(text))

splitter = RecursiveCharacterTextSplitter(
    chunk_size=650,       # tokens — starting point for prose
    chunk_overlap=80,     # ~12%
    length_function=token_len,
    separators=["\n\n", "\n", ". ", " ", ""],  # paragraph, then sentence, then word
)
chunks = splitter.split_text(document_text)
```

**Docs with headings and tables — split on structure, keep tables whole:**

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

headers_to_split_on = [("#", "h1"), ("##", "h2"), ("###", "h3")]
sections = MarkdownHeaderTextSplitter(headers_to_split_on).split_text(markdown_text)

sub_splitter = RecursiveCharacterTextSplitter(chunk_size=450, chunk_overlap=50)
chunks = []
for section in sections:
    if "|---" in section.page_content:        # crude table detector — refine per source
        chunks.append(section)                # keep the whole table as one chunk
    else:
        chunks.extend(sub_splitter.split_documents([section]))
```

**Code — split at function/class boundaries, not character windows:**

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,   # ~100-150 lines depending on line density
    chunk_overlap=50,  # small — function boundaries already carry context
)
chunks = splitter.split_text(source_code)
```

**Transcripts — group by speaker turn, keep timing as metadata:**

```python
def chunk_transcript(turns, max_turns=8, overlap_turns=1):
    # turns: list of {"speaker": str, "start": float, "text": str}
    chunks = []
    i = 0
    while i < len(turns):
        window = turns[i : i + max_turns]
        text = "\n".join(f"{t['speaker']}: {t['text']}" for t in window)
        chunks.append({
            "text": text,                                   # embed this
            "speakers": sorted({t["speaker"] for t in window}),
            "start": window[0]["start"],                    # keep for citation, don't embed
            "end": window[-1]["start"],
        })
        i += max_turns - overlap_turns
    return chunks
```

If none of these boundaries fit your source (nested JSON, slide decks, scanned PDFs with mixed layouts), that's a sign the document needs a custom parser before it needs a different chunk-size number — check the common failure patterns in [chunking common mistakes](/learn/rag/chunking-common-mistakes) before you assume it's a splitter problem.

**Related:** [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) · [Chunking Worked Example](/learn/rag/chunking-worked-example) · [Chunking Strategies Compared](/learn/rag/chunking-strategies-compared) · [Chunking Common Mistakes](/learn/rag/chunking-common-mistakes) · [Parent Document Retrieval](/learn/rag/parent-document-retrieval) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
