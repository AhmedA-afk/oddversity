---
title: "From Prose to Parsed, Step by Step"
track: "structured-outputs"
status: live
summary: "One messy review, converted into a validated object in five explicit stages, including the broken first attempt."
duration: "8 min read"
---

One real paragraph of model prose, turned into `{sentiment, topics[], rating}` in five stages you can reuse on any extraction task.

## The setup

Here's the raw text you're starting from — a model's answer to "summarize this product review":

```text
I read through this review a couple of times. The customer clearly
liked the product overall — they specifically call out the battery
life lasting "way longer than expected" and say the camera takes
"genuinely impressive" low-light photos. Their one complaint is that
the packaging arrived a little dented, though they note the product
itself was undamaged. If I had to put a number on it, I'd call this a
4 out of 5.
```

The target: a `ReviewSummary` object with `sentiment`, `topics` (a short list), and `rating` (1–5).

## Step by step

**1. Identify the target fields — before writing any code.** Read the paragraph once as a human would and name the values you'd expect, without committing to a schema yet: sentiment is positive overall despite a minor complaint; topics are battery life, camera, and packaging; rating is 4.

> **Why this step?** If you skip straight to code, you'll design fields around whatever's easiest to extract from *this* paragraph's exact wording, instead of what the task actually needs. Naming the answer first keeps the schema honest.

**2. Write the schema.**

```python
from pydantic import BaseModel, Field
from typing import Literal

class ReviewSummary(BaseModel):
    sentiment: Literal["positive", "negative", "mixed"]
    topics: list[str] = Field(min_length=1, max_length=5)
    rating: int = Field(ge=1, le=5)
```

> **Why this step?** The schema is where every implicit assumption becomes an explicit, checkable rule: `sentiment` can't be "somewhat positive," `rating` can't be 6 or the string `"four"`, `topics` can't come back as an empty list or fifteen items.

**3. Prompt for it, using schema-constrained decoding rather than a prose instruction.** You pass `ReviewSummary.model_json_schema()` to the API alongside the review text, in a mode that constrains generation to that schema (see [JSON Mode Basics](/learn/structured-outputs/json-mode-basics)). The raw completion comes back as:

```json
{"sentiment": "mixed", "topics": ["battery life", "camera", "packaging"], "rating": 4}
```

> **Why this step?** This is the step that decides whether steps 4 and 5 are trivial or painful. A schema you never actually enforced at generation time is just a comment nobody's required to read.

**4. Parse.**

```python
import json
data = json.loads(raw_completion)
```

> **Why this step?** Separating "is this parseable" from "does it match my shape" (step 5) means a syntax failure and a shape failure produce different, specific error messages instead of one confusing crash.

**5. Validate.**

```python
review = ReviewSummary.model_validate(data)
```

> **Why this step?** This is where layer 2 — schema conformance — gets enforced, per [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means). Once this call succeeds, `review.rating` is genuinely an `int` between 1 and 5, not a string that merely looks like one.

## Where it breaks (+fix)

Here's what actually happens on a first attempt that skips step 3's discipline — asking in plain prose ("please return JSON with sentiment, topics, and rating") instead of enforcing the schema at generation time:

```text
Sure! Here's the structured version:
{"sentiment": "Positive", "topics": "battery life, camera, packaging", "rating": "4/5"}
```

This fails before validation even gets a chance to run: `json.loads()` on the raw string throws immediately, because of the leading `"Sure! Here's the structured version:"` text. Even if you strip that, three separate schema failures are waiting: `"Positive"` (capitalized) doesn't match the `Literal["positive", "negative", "mixed"]` values exactly; `topics` arrived as one comma-joined string instead of a list; `rating` is the string `"4/5"`, not an integer.

The fix has two parts. First, use an actual schema-constrained mode or tool call instead of a prose request — that structurally prevents the leading text and the type drift from happening in the first place (see [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview)). Second, keep a validation step regardless — case drift (`"Positive"` vs `"positive"`) and stringified numbers (`"4"` instead of `4`) still show up occasionally even under constrained decoding, and a normalization pass or a bounded repair loop catches what the schema alone doesn't (see [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)).

## Takeaways

- Prose-to-parsed is five separable steps: name the fields, write the schema, prompt against it, parse, validate. Skipping the schema step means you're improvising fields from whatever the first output happened to look like.
- The schema step catches assumptions early, while they're cheap to fix; the validate step catches drift late, when a bad value is one line away from your database.
- A good schema doesn't save you from a bad prompting mode — the raw completion can still misbehave until the output is enforced structurally, not requested politely.

**Related:** [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition) · [JSON Schema for Outputs](/learn/structured-outputs/json-schema-for-outputs) · [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction) · [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) · [One Task, Four Mechanisms](/learn/structured-outputs/same-task-four-ways-mini-tour)
