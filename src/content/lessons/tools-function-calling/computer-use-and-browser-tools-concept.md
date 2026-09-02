---
title: "Computer-Use and Browser-Control Tools"
track: "tools-function-calling"
status: live
summary: "When no API exists, the fallback isn't giving up — it's a screenshot-and-click loop that operates the UI a human would use."
duration: "6 min read"
---

When there's no API for the thing you need done, the fallback isn't "give up" — it's giving the model eyes and a mouse.

## What it is

A computer-use tool doesn't call a function; it returns one action at a time against a picture. The harness sends a screenshot (or, for browser-specific tools, a labeled list of clickable elements), the model responds with something like "click the coordinate at (412, 88)" or "type 'jane@example.com' into the focused field," the harness executes it and captures the new state, and the cycle repeats until the task is done.

## The mental model

Picture handing someone a photo of a screen every few seconds and a phone line to tell you where to click — that's the whole interface. There's no `submit_form()` function; "submit" is whatever pixel currently says Submit. The model isn't calling an API you designed, it's operating a UI you didn't design, the same way a human would.

## Why it works this way

This loop exists because most software was built for humans looking at pixels, not for programmatic callers — a legacy dashboard, a vendor's admin panel, a client's one-off internal tool almost never ships an API. Rather than reverse-engineering each one into a bespoke integration, computer use lets the model operate the same interface a person already uses. The cost of that generality is precision: a coordinate is only correct until the page re-renders, in a way a named function argument never is.

## A concrete example (shown)

```json
// harness → model: screenshot + goal
{ "goal": "Log a new expense of $42.10 for 'office supplies'", "screenshot": "<base64 png>" }

// model → harness: one action
{ "action": "click", "x": 224, "y": 380 }   // the "New Expense" button

// harness executes, captures new state, sends it back
{ "screenshot": "<base64 png, form now open>" }

// model → harness
{ "action": "type", "text": "42.10" }
```

Each turn is one action and one fresh screenshot — the model never gets to assume the previous screenshot is still accurate.

## Where it shows up

Testing your own product the way a real user experiences it, driving internal tools that never got an API, and any vendor SaaS where you're a customer, not the operator, and can't ask them to build you an endpoint.

## Watch out for

- **Treating it as a first choice.** It's slower, more expensive per step, and more brittle than an API call — reach for it only when [no API tool exists](/learn/tools-function-calling/api-tools-vs-computer-use).
- **Running it against your real environment.** A model with a mouse can click things you never intended it to reach. It needs the same isolation as any other high-authority tool — see [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution).
- **No task boundary.** Without an explicit goal check and step limit, a computer-use loop can wander off the task it was given, several screenshots deep into an unrelated part of the page.

## Where next

[Building a Browser-Control Loop](/learn/tools-function-calling/building-a-browser-tool-loop) implements this end to end. [API Tools vs. Computer Use for the Same Task](/learn/tools-function-calling/api-tools-vs-computer-use) works through the same job done both ways so the tradeoff is concrete instead of abstract. For the deeper failure-mode catalog and when this is genuinely the right call, see [Computer-Use and Browser-Control Tools](/learn/tools-function-calling/computer-use-and-browser-tools).

**Related:** [Building a Browser-Control Loop](/learn/tools-function-calling/building-a-browser-tool-loop), [API Tools vs. Computer Use for the Same Task](/learn/tools-function-calling/api-tools-vs-computer-use), [Computer-Use and Browser-Control Tools](/learn/tools-function-calling/computer-use-and-browser-tools), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution)
