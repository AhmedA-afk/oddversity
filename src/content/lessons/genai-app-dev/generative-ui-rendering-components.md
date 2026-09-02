---
title: "Generative UI: Rendering Components From Model Output"
track: "genai-app-dev"
status: live
summary: "Guessing structure from prose after the fact versus declaring it up front — and why one of these barely works."
duration: "6 min read"
---

[Generative UI: Rendering Components from Model Output](/learn/genai-app-dev/generative-ui) covers the mechanism — tool calls as UI intents, mapped to real components. This lesson steps back one level, to the design choice underneath that mechanism: how did the app arrive at "this is weather data" in the first place, and why does that choice determine almost everything else about how reliable the feature is.

## What it is

There are exactly two ways an app gets from "the model responded" to "render a specific component with specific props." One: let the model write prose, then parse that prose after the fact — regex, keyword matching, a second classification pass — to guess what it was about and what data it contains. Two: constrain the model up front with a schema so its output *is* the props already, validated, before your rendering code ever sees it. Nearly every early, brittle "AI card" implementation is the first kind; nearly every one that survives contact with real users is the second.

## The mental model

Think of it as **guess-then-classify** versus **declare-then-fill**. Guess-then-classify hands the model an open-ended writing task, then tries to reverse-engineer structure out of whatever comes back — which means every ambiguity in the model's prose becomes an ambiguity in your parser. Declare-then-fill hands the model a fixed target shape from the start — a schema with named fields — so there's no structure to *reconstruct*, only values to *fill in*.

## Why it works this way

Language models are far more reliable at selecting and populating a declared schema than they are at producing prose a downstream parser can perfectly and consistently extract from. This isn't a coincidence — a schema gives the model (and any validation layer downstream) a fixed, checkable target: "does this input satisfy `input_schema`" is a mechanical question with a yes/no answer. "Does this sentence describe weather" is not — it's a judgment call your regex is making badly, on the model's behalf, after the fact.

## A concrete example (shown)

The guess-then-classify version — parsing free text after generation:

```ts
const reply = await callModel("What's the weather in Austin?");
// reply.text: "It's currently 89°F and sunny in Austin, Texas."

const match = reply.text.match(/(\d+)°F.*?in (\w+)/);
// Works today. Breaks the moment the model phrases it as
// "Austin is sunny right now, around 89 degrees" — no match, silent failure.
if (match) renderWeatherCard({ tempF: Number(match[1]), location: match[2] });
```

This regex is coupled to one specific sentence structure. It has no idea the model is even capable of phrasing the same fact a dozen different ways, and every one of those alternate phrasings is a silent miss, not a loud error.

The declare-then-fill version constrains the *generation* instead of parsing the *output* — exactly the tool-schema approach built out in [Generative UI: Rendering Components from Model Output](/learn/genai-app-dev/generative-ui):

```json
{
  "name": "render_weather_card",
  "input_schema": {
    "type": "object",
    "properties": { "location": { "type": "string" }, "tempF": { "type": "number" }, "condition": { "type": "string" } },
    "required": ["location", "tempF", "condition"]
  }
}
```

There's no sentence to parse, because there's no sentence — the model's output is already `{ location: "Austin", tempF: 89, condition: "sunny" }`, structurally, regardless of how it might have phrased the same fact in prose.

## Where it shows up

Dashboards that summarize agent status, action-confirmation cards ("book this flight for $340"), and any assistant reply that's fundamentally data with a known shape rather than open-ended writing — these are exactly the cases where declare-then-fill pays off, because the shape of the answer is known before the model ever runs.

## Watch out for

- **Treating "a tool was called" as proof the data is safe to render.** Schema conformance means the *types* match — it says nothing about whether a `tempF` of 340 is a plausible temperature. Structural validity and semantic correctness are different checks; do both, as covered in [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps).
- **Writing a bespoke parser for every new UI intent instead of extending the schema.** Each one-off regex is a maintenance liability the moment the model's phrasing habits shift even slightly — usually after a model upgrade you didn't ask for and can't fully control.
- **Assuming the whole object has to arrive before anything can render.** Declare-then-fill solves the reliability problem, but it introduces a new one: the model still has to *finish* generating the JSON object before a naive implementation can parse it, which means the user stares at nothing while a growing card's worth of data streams in behind the scenes.

## Where next

That last point is the entire subject of the next lesson: once you've committed to schema-constrained output, the fields don't have to arrive all at once — they can populate a live component field by field, the same way text tokens populate a sentence. [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui) builds exactly that.

**Related:** [Generative UI: Rendering Components from Model Output](/learn/genai-app-dev/generative-ui), [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps), [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui)
