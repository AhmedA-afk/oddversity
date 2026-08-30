---
title: "Building an MCP Server: Common Mistakes"
track: "mcp"
status: live
summary: "Six server-design mistakes that pass the demo and fail in use — stdout writes, vague tool descriptions, tools that should be resources, and unbounded arguments."
duration: "9 min read"
---

Every one of these produces a server that works when you test it. That is what makes them worth naming.

## 1. Writing to stdout

**You probably think** a `print()` is harmless debugging.

**Why it breaks:** a local server speaks JSON-RPC over stdin and stdout. Anything else written to stdout lands in the middle of a protocol message and the framing fails. It is not a logging problem, it is a corruption problem, and the client reports it as a connection error — pointing you at exactly the wrong place.

It is rarely your own `print()` that does it, either. A library that logs to stdout by default, a warning from a dependency, a stray `pprint` in a helper — any of them will do it.

**The correct model:** stdout is the wire. Configure logging to stderr in the first five lines of the file, before you import anything that might log.

```python
import logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
```

**How to spot it live:** the server connects and then dies the first time a specific tool runs. If a tool works in isolation and fails in the client, look for output.

## 2. Tool descriptions that describe rather than direct

**You probably think** the description is documentation.

**Why it breaks:** it is not documentation, it is the selection criterion. The model sees a list of names, descriptions and schemas, and picks. "Order lookup tool" gives it nothing to choose on. When two of your tools are both plausible, it will pick wrong roughly as often as chance.

**The correct model:** write the description for a reader who has to choose between your tool and four others. Say what it does, when to reach for it, and what it does *not* cover.

```python
# Weak
"""Search the knowledge base."""

# Strong
"""Search internal support articles by keyword.

Use for how-to and troubleshooting questions about the product.
Does not cover account or billing data — use find_account for those.
Returns up to 10 article excerpts with their URLs.
"""
```

**How to spot it live:** the model calls the wrong tool, or asks the user a clarifying question it had the tools to answer itself.

## 3. Making everything a tool

**You probably think** three primitives is over-engineering and tools can do it all.

**Why it breaks:** it can, and the cost is a wasted turn plus a wasted schema slot on every conversation. A `get_schema()` tool means the model must decide to call it, wait, and read the result before it can do the actual work. A resource is fetched by the host without spending a turn.

**The correct model:**

- **Tool** — the model wants to *do* something, or fetch something conditionally.
- **Resource** — content the client should be able to read into context directly.
- **Prompt** — a workflow you want to offer, that a person triggers.

**How to spot it live:** your traces show the same informational tool called at the start of nearly every conversation. That is a resource wearing a tool's clothes.

## 4. Trusting tool arguments

**You probably think** the arguments come from your own model, so they are basically yours.

**Why it breaks:** they come from a model that has been reading text you did not write — a document, a ticket, a web page. An instruction in that content can shape the arguments. A `limit` of 10,000,000, a path of `../../.ssh/id_rsa`, a SQL fragment in a string field.

**The correct model:** validate at the tool boundary as though the argument arrived from an anonymous HTTP request, because in effect it did.

```python
target = (Path.cwd() / path).resolve()
if not target.is_relative_to(Path.cwd()):
    raise ValueError("path escapes the working directory")
```

**How to spot it live:** you cannot, until it happens. This one is prevented, not detected.

## 5. Swallowing errors

**You probably think** returning an empty result on failure is graceful.

**Why it breaks:** the model receives nothing, treats it as "no results", and tells the user there are no orders — which is a different and much worse claim than "the lookup failed". You have converted an error into a confident falsehood.

**The correct model:** return the real message and mark it as an error. The model is a capable reader and will often recover.

```python
# Weak
except Exception:
    return []

# Strong — the model can act on this
except sqlite3.OperationalError as exc:
    raise ValueError(f"order database unavailable: {exc}")
```

**How to spot it live:** a user reports a confidently wrong "nothing found" that you cannot reproduce.

## 6. One server, thirty tools

**You probably think** more capability is more useful.

**Why it breaks:** every tool's name, description and full schema is sent on every request. Thirty verbose tools is a standing cost on every turn — real money, and real crowding out of the context you wanted to use. Selection quality also drops as the list grows.

**The correct model:** few sharp tools per server, and separate servers for unrelated capability groups so a user can enable only what they need. If your server exposes thirty tools, the honest question is whether it is one server or three.

**How to spot it live:** measure it. Sum the serialised length of your tool list and compare it to a typical request. If schemas are a meaningful fraction, you have found a cost line nobody was looking at.

---

Next: [the server cheatsheet](/learn/mcp/mcp-server-cheatsheet) for the shapes to copy, and [check yourself](/learn/mcp/mcp-server-quiz).
