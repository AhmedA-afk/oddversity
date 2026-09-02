---
title: "Streaming Structured Output Into Live Components"
track: "genai-app-dev"
status: live
summary: "Render a card as its JSON props stream in field by field, with a tolerant parser and a final validation gate."
duration: "8 min read"
---

A tool call's arguments stream in as JSON fragments the same way text streams in as words — which means a UI card can populate field by field instead of appearing all at once at the end. This builds that: a shipment-tracking card that fills in live, backed by a parser tolerant enough to handle JSON that isn't finished yet.

## What we're building

The model calls a `render_shipment_card` tool with `carrier`, `trackingNumber`, `status`, and `eta`. Instead of waiting for the full tool call to complete, the UI shows each field the moment it's parseable, with the rest visibly pending — then locks the card in only after a full schema validation pass on the complete object.

## Setup

The tool declaration, same shape as [Generative UI: Rendering Components from Model Output](/learn/genai-app-dev/generative-ui):

```json
{
  "name": "render_shipment_card",
  "input_schema": {
    "type": "object",
    "properties": {
      "carrier": { "type": "string" },
      "trackingNumber": { "type": "string" },
      "status": { "type": "string" },
      "eta": { "type": "string" }
    },
    "required": ["carrier", "trackingNumber", "status", "eta"]
  }
}
```

To get the arguments incrementally instead of all at once, opt into fine-grained tool streaming — a beta feature you enable with an `anthropic-beta` request header (check the current docs for the exact beta name, since these change):

```ts
// enable via the anthropic-beta header on the request; see the current API docs
const tools = [renderShipmentCardTool];
```

## Build it

### 1. Accumulate the raw JSON fragments as they arrive

```ts
let rawArgs = "";

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "input_json_delta") {
    rawArgs += event.delta.partial_json;
    const partialProps = tolerantParse(rawArgs);
    if (partialProps) renderPartialCard(partialProps);
  }
}
```

> **Why this step?** `input_json_delta` events carry `partial_json` — a fragment of the arguments string, not a fragment guaranteed to be valid JSON on its own. Concatenating fragments as they arrive reconstructs the string; parsing it is the harder part, covered next.

### 2. The half-valid-object problem, and a tolerant parser

Midway through streaming, `rawArgs` might look like this — a syntactically incomplete object:

```
{"carrier":"UPS","trackingNumber":"1Z999AA1012345678","status":"in_tran
```

`JSON.parse` throws on this outright. A tolerant parser's job is to recover whatever *is* complete, and silently ignore the rest until it arrives:

```ts
function tolerantParse(partial: string): Record<string, unknown> | null {
  try {
    return JSON.parse(partial); // fast path: it happens to already be complete
  } catch {
    // Close any trailing incomplete string, then balance braces/brackets.
    let repaired = partial;
    const openQuotes = (repaired.match(/(?<!\\)"/g) ?? []).length % 2;
    if (openQuotes) repaired += '"';
    const opens = (repaired.match(/[{[]/g) ?? []).length;
    const closes = (repaired.match(/[}\]]/g) ?? []).length;
    repaired += "}".repeat(Math.max(0, opens - closes));
    try {
      return JSON.parse(repaired);
    } catch {
      return null; // still not parseable — wait for the next chunk
    }
  }
}
```

> **Why this step?** This is a heuristic, not a real JSON parser — it closes an obviously-open string and balances bracket counts, which is enough to recover a *prefix* of complete fields (`carrier`, `trackingNumber`) while the field currently being written (`status`, mid-value) stays absent from the result until its closing quote actually arrives. Treat any field missing from the parsed result as `pending`, not as `null` — the model hasn't gotten there yet, and `null` would incorrectly imply an empty value.

### 3. Render the partial card, marking unfinished fields

```tsx
function ShipmentCard({ props, isFinal }: { props: Partial<ShipmentProps>; isFinal: boolean }) {
  return (
    <div className={`card ${isFinal ? "confirmed" : "pending"}`}>
      <Field label="Carrier" value={props.carrier} />
      <Field label="Tracking #" value={props.trackingNumber} />
      <Field label="Status" value={props.status} />
      <Field label="ETA" value={props.eta} />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return <div>{label}: {value ?? <Skeleton />}</div>; // show a skeleton for fields not yet parsed
}
```

> **Why this step?** Fields render as they become available, in whatever order the model happened to write them — usually schema order, but never assume it. The skeleton placeholder communicates "coming, not missing," which matters for a card the user is actively watching fill in, the same way a typing cursor communicates "still generating" in plain text.

### 4. Final validation before locking the card in

```ts
if (event.type === "content_block_stop") {
  const parsed = JSON.parse(rawArgs); // now guaranteed complete — no tolerant parsing needed
  const result = ShipmentPropsSchema.safeParse(parsed);
  if (result.success) {
    commitCard(result.data);   // isFinal: true — the confirmed, styled state
  } else {
    renderFallbackText(rawArgs); // schema mismatch — fall back rather than show wrong data as if it were right
  }
}
```

> **Why this step?** Everything before `content_block_stop` was best-effort, for perceived responsiveness — it is not the safety check. The real validation happens exactly once, against the complete, final JSON, using the same schema discipline as [Generative UI: Rendering Components from Model Output](/learn/genai-app-dev/generative-ui): a structurally valid tool call is not automatically a semantically correct one, so run it through your schema (`zod`, `pydantic`, or equivalent) before treating it as trustworthy enough to display as confirmed.

## Run it

Watch the card populate: `carrier` and `trackingNumber` typically resolve first (they're early fields in most model orderings), `status` and `eta` fill in over the next few hundred milliseconds, and the card's border or badge flips from "pending" to "confirmed" the instant `content_block_stop` fires and validation passes.

## Harden it

- **Never render a field the schema doesn't declare.** A tolerant parser recovers whatever JSON-shaped fragment exists — including a hallucinated extra field the model invented. Filter parsed output through the schema's known keys before rendering, not just at final commit.
- **Cap how often you re-render.** Calling `tolerantParse` and re-rendering on every single delta is wasteful when fragments arrive faster than the eye can follow — throttle to once every render frame (`requestAnimationFrame`) rather than once per event.
- **Handle parallel tool calls independently.** If the model emits more than one `render_*` call in a turn, each has its own `content_block_start`/`content_block_stop` pair and its own accumulator — don't share one `rawArgs` string across them.

## Extend it

The same tolerant-parse-then-validate shape works for any structured output streamed into a UI, not just tool-call cards — see [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps) and [JSON Schema and Validation](/learn/genai-app-dev/json-schema-and-validation) for the validation layer this borrows from, and [Structured Output Failure Modes and How to Spot Them](/learn/genai-app-dev/structured-output-failures) for what to do when the final parse fails outright.

**Related:** [Generative UI: Rendering Components From Model Output](/learn/genai-app-dev/generative-ui-rendering-components), [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps), [Structured Output Failure Modes and How to Spot Them](/learn/genai-app-dev/structured-output-failures)
