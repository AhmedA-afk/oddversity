---
title: "Vector DB Cheatsheet"
track: "rag"
status: live
summary: "A no-benchmarks capability matrix for pgvector, Qdrant, Weaviate, Milvus, and Pinecone, plus decision rules, index-parameter starting points, and copy-paste snippets."
duration: "7 min read"
---

This is the sequel to [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) — read that first if you're still deciding whether you need a dedicated engine at all. Here we assume you've decided, and you want to know which one, why, and what to type first.

## The capability matrix

No benchmark numbers below — they go stale in a release cycle and vary wildly by hardware, dataset, and how honestly they were run. What doesn't go stale as fast is *how each system is built*, which is what actually determines whether it fits your constraints.

| Database | Hosting | Native filtering | Native hybrid search | Scale sweet spot | Ops burden |
|---|---|---|---|---|---|
| **pgvector** | Extension inside Postgres — self-host or any managed Postgres (Supabase, Neon, RDS, Cloud SQL) | Full SQL `WHERE` — joins and transactions included, the strongest filtering story here | None built in — fuse full-text (`tsvector`) and vector search yourself | Small-to-mid collections living next to your relational data | Lowest, if you already run Postgres |
| **Qdrant** | Self-host (single binary/Docker) or Qdrant Cloud | Native payload filter DSL, built to stay fast alongside HNSW | Dense + sparse vectors on the same point, with fusion | Prototype through large scale — shards and replicates horizontally when you outgrow one node | Low–moderate |
| **Weaviate** | Self-host (Docker/k8s) or Weaviate Cloud | Native property filters integrated with the index | Built-in BM25 + vector hybrid query with a tunable fusion weight | Prototype through large scale; strong multi-tenant story for many small isolated collections | Moderate |
| **Milvus** | Self-host (Standalone for small setups; full distributed mode adds etcd, object storage, a message queue) or Zilliz Cloud (managed) | Scalar filtering alongside vector search | Native dense + sparse hybrid, plus a choice of ANN index types (HNSW, IVF, DiskANN…) | Built for the very large end — distributed by design, hundreds of millions of vectors and up | High self-hosted; low on Zilliz Cloud |
| **Pinecone** | Fully managed only — no self-host option, that's the trade | Native metadata filters | Dense + sparse hybrid via a single upsert, weighted at query time | Serverless scaling from prototype to large, without you touching shard counts | Lowest overall — the entire pitch is zero ops |

## Decision rules: match the tool to the constraint

- **If you already run Postgres and you're under a few million vectors** → start with pgvector. One less service, and you keep transactions and joins for free.
- **If you need hybrid search working well with minimal glue code** → Weaviate or Qdrant. Both fuse lexical and vector search natively instead of making you hand-roll it.
- **If your team has no dedicated infra/ops capacity** → Pinecone, or a managed Postgres with pgvector bundled in. Managed means you don't own uptime.
- **If you want open-source and self-hostable but don't want to stand up a distributed system on day one** → Qdrant. It's a single binary that scales out later, when you actually need it.
- **If you're past tens of millions of vectors and still growing, or need multiple index types for a memory/speed/disk trade-off** → Milvus, or its managed form Zilliz Cloud.
- **If compliance requires data to stay in your own VPC or on-prem** → self-hosted only. That rules out Pinecone outright; pgvector, Qdrant OSS, Weaviate OSS, and Milvus OSS all qualify.
- **If you're a solo builder or early prototype** → resist adding a dedicated vector database before you need one. pgvector (or even an in-process ANN index) gets you further than people expect. See the anchor concept above for that framework.
- **If you need many small, isolated tenant collections** → Weaviate's per-tenant partitioning or Qdrant's collections are built for exactly this; a single giant collection with a `tenant_id` filter works too, but check [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) for where that pattern breaks down.

## Index parameters: starting points, then measure

These are the parameters behind the HNSW and IVF indexes most of these engines use under the hood — see [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) for what they're actually doing. The values below are sane places to start, not tuned numbers — measure recall and latency on your own data before trusting them.

| Parameter | Controls | Starting point | Raising it trades... |
|---|---|---|---|
| HNSW `m` | max graph connections per node | 16 | better recall for more memory and slower builds |
| HNSW `ef_construction` | search width while building | 64–200 | better index quality for much slower builds |
| HNSW `ef_search` (`ef`) | search width at query time | 40–100 | better recall for higher query latency |
| IVF `nlist` | number of clusters | roughly `sqrt(N)` for N vectors | finer partitioning for slower training |
| IVF `nprobe` | clusters scanned per query | 8–16 | better recall for higher query latency |

Worked example: if you have 4M vectors, `sqrt(4,000,000) ≈ 2000`, so `nlist ≈ 2000` is a reasonable IVF starting point — not a rule, a starting guess to measure from.

## Filtering: pre-filter vs. post-filter

Two ways an engine can combine "find nearest neighbors" with "only from tenant X," and it matters which one you're getting:

- **Post-filter** — run the ANN search first, then throw away results that don't match the filter. Simple, but if the filter is selective, your top-k nearest overall might contain zero matches, and you return fewer results than you asked for.
- **Pre-filter (or filter-aware search)** — restrict the candidate set before or during graph traversal, so the search only ever looks where the filter allows. Qdrant's filterable HNSW and pgvector's planner-chosen `WHERE` both work this way, which is why filtering was called out as a strength for each above.

If you've hit this wall already — fewer results than expected once a filter is added — that's the failure mode this section describes. Full depth on the pattern lives at [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval).

## Hybrid search: what "native" means per engine

"Supports hybrid" hides real differences in how the fusion actually happens:

- **Weaviate** — one query API runs BM25 and vector search, then fuses with a tunable `alpha` (0 = pure keyword, 1 = pure vector).
- **Qdrant** — store dense and sparse vectors on the same point; query both and fuse with its built-in fusion query or your own logic.
- **Milvus** — multiple vector fields per collection (dense + sparse), with a hybrid search API that fuses across them.
- **Pinecone** — a single upsert carries both sparse and dense values; you weight them at query time.
- **pgvector** — no fusion built in. Run full-text search (`tsvector`/`ts_rank`) and vector search as two separate SQL queries, then fuse the rankings yourself, typically with reciprocal rank fusion.

The fusion math itself — why RRF works, how to pick weights — is covered in [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector); this section is only about which engines hand it to you versus which make you build it.

## Copy-paste starting points

Minimal, working shapes for each. Swap in your real embedding dimension and filter fields.

### pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id bigserial PRIMARY KEY,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

CREATE INDEX ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- filtering is just SQL, no separate filter API
SELECT id, content
FROM documents
WHERE metadata->>'tenant_id' = 'acme'
ORDER BY embedding <=> '[0.01, 0.02, 0.03]'::vector
LIMIT 10;
```

### Qdrant

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, Filter, FieldCondition, MatchValue

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="docs",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

client.upsert(
    collection_name="docs",
    points=[{"id": 1, "vector": embedding, "payload": {"tenant_id": "acme"}}],
)

hits = client.search(
    collection_name="docs",
    query_vector=embedding,
    query_filter=Filter(must=[FieldCondition(key="tenant_id", match=MatchValue(value="acme"))]),
    limit=10,
)
```

### Weaviate

```python
import weaviate
from weaviate.classes.query import Filter

client = weaviate.connect_to_local()
docs = client.collections.get("Document")

# alpha=0 -> pure BM25, alpha=1 -> pure vector, 0.5 -> even blend
results = docs.query.hybrid(
    query="refund policy for annual plans",
    alpha=0.5,
    filters=Filter.by_property("tenant_id").equal("acme"),
    limit=10,
)
```

### Milvus

```python
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")

client.create_collection(
    collection_name="docs",
    dimension=1536,
    metric_type="COSINE",
    index_params={"index_type": "HNSW", "params": {"M": 16, "efConstruction": 64}},
)

results = client.search(
    collection_name="docs",
    data=[embedding],
    filter='tenant_id == "acme"',
    limit=10,
)
```

### Pinecone

```python
from pinecone import Pinecone

pc = Pinecone(api_key="...")
index = pc.Index("docs")

index.upsert(vectors=[{"id": "1", "values": embedding, "metadata": {"tenant_id": "acme"}}])

results = index.query(
    vector=embedding,
    filter={"tenant_id": {"$eq": "acme"}},
    top_k=10,
    include_metadata=True,
)
```

## Before you migrate

None of these are drop-in replacements for each other. Switching means re-embedding or at least re-indexing everything, retuning ANN parameters from scratch (a `nprobe` that worked on Milvus tells you nothing about `ef_search` on Qdrant), and rebuilding your filter logic in the new engine's syntax. Budget for that as a real migration, not a config change. If you want to see these trade-offs play out on one concrete dataset rather than in the abstract, walk through the [Vector DB Worked Example](/learn/rag/vector-db-worked-example) — and check [Vector DB Common Mistakes](/learn/rag/vector-db-common-mistakes) before you commit, since most of the expensive ones happen at selection time, not migration time.

**Related:** [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Vector DB Worked Example](/learn/rag/vector-db-worked-example) · [Vector DB Common Mistakes](/learn/rag/vector-db-common-mistakes)
