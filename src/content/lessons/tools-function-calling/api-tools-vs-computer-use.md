---
title: "API Tools vs. Computer Use for the Same Task"
track: "tools-function-calling"
status: live
summary: "Book the same table four different ways and see exactly where computer use is worth its cost and where it isn't."
duration: "7 min read"
---

Take one task — book a table for four at 7pm — and solve it four different ways. The task never changes; only the mechanism does, and the differences are stark enough to turn into a rule.

## 1. A dedicated booking API tool

```json
{
  "name": "book_table",
  "input_schema": {
    "type": "object",
    "properties": {
      "restaurant_id": { "type": "string" },
      "party_size": { "type": "integer" },
      "time": { "type": "string", "description": "ISO 8601 datetime" }
    },
    "required": ["restaurant_id", "party_size", "time"]
  }
}
```

**How it works:** the model fills four typed fields, your handler calls the reservation platform's API (OpenTable, Resy, or the restaurant's own system), and gets back a structured confirmation or a structured error.

**When it wins:** whenever the restaurant, or a platform it's listed on, exposes one. This is the default — reach for it first, always.

**Failure mode:** the API doesn't cover every restaurant. Small independent places frequently have no booking API at all, only a phone number or a website form.

**Relative cost:** one tool call, low latency, cheap. The floor every other option is measured against.

## 2. Computer-use / browser automation on the restaurant's website

**How it works:** the [screenshot-action loop](/learn/tools-function-calling/computer-use-and-browser-tools-concept) — the model sees the reservation widget, clicks the date picker, clicks a time slot, fills the party-size field, clicks confirm, several turns each with a fresh screenshot.

**When it wins:** exactly the case where option 1 doesn't exist — a restaurant with only a bespoke web widget and no API behind it.

**Failure mode:** the reservation widget re-renders after the date picker closes, the "7:00 PM" slot the model clicked is now six pixels to the left, and the click lands on "7:30 PM" instead. Silent, hard-to-detect wrong outcome, not a clean error.

**Relative cost:** many round trips (each carrying a full screenshot), materially slower and pricier per booking than option 1, and the most brittle of the four.

## 3. Hybrid: API first, computer use as fallback

**How it works:** try the API tool; if the restaurant isn't found on any integrated platform, fall back to a computer-use pass against its own site.

**When it wins:** a production booking assistant that needs to cover both chain restaurants (usually API-integrated) and independents (usually not) without maintaining two separate user-facing flows.

**Failure mode:** the fallback triggers more than expected because the API-coverage check is too conservative — you end up paying computer-use costs on restaurants that did have an API, just not one your integration layer knew about.

**Relative cost:** API cost most of the time, computer-use cost on the long tail. The best average cost of the four if your fallback trigger is accurate.

## 4. Human-executes, model-assists

**How it works:** the model has no execution tool at all. It produces a pre-filled deep link or a step-by-step instruction ("open resy.com, search 'Lupo', 7pm, party of 4") and a person clicks it themselves.

**When it wins:** the task is sensitive enough (a payment, an irreversible booking with a cancellation fee) that you don't want any automated click to be the one that commits it — see [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools).

**Failure mode:** it isn't automation at all — if the user isn't available to click, nothing happens. This is a deliberate ceiling, not a bug.

**Relative cost:** zero execution cost, but zero autonomy. The safest option and the least useful one, by design.

## Decision table

| Approach | Reliability | Latency | Cost | Brittleness |
|---|---|---|---|---|
| API tool | High | Low | Low | Low |
| Computer use | Medium | High | High | High |
| Hybrid (API + fallback) | High on covered cases | Mixed | Mixed | Medium |
| Human-executes | Highest (human judgment) | Depends on human | Lowest (compute) | None (no automation to break) |

## How to choose

Default to the API tool whenever one exists — it's cheaper, faster, and fails in ways you can catch programmatically instead of ways you have to notice visually. Reserve computer use for the genuine long tail where no API exists and the task still needs to be automated. If the task is both API-less *and* consequential enough that a misclick is expensive (a non-refundable booking, a real payment), skip automation entirely and hand it to a human with the model doing the prep work — the fourth option isn't a downgrade, it's the right tool when the other three all cost more than they're worth.

**Related:** [Computer-Use and Browser-Control Tools](/learn/tools-function-calling/computer-use-and-browser-tools-concept), [Building a Browser-Control Loop](/learn/tools-function-calling/building-a-browser-tool-loop), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Classifying Tool Risk Tiers](/learn/tools-function-calling/classifying-tool-risk-tiers)
