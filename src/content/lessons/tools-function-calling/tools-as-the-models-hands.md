---
title: "Tools Are the Model's Only Hands"
track: "tools-function-calling"
status: live
summary: "A model can only produce tokens — a tool call is the one structured way it reaches past its own text stream."
duration: "5 min read"
---

Everything a language model does, it does by predicting the next token. No exceptions, no side channel. Once that sinks in, tool calling stops looking like magic and starts looking like the only mechanism it could possibly be.

## The analogy

Picture a brilliant analyst locked in a windowless room, reachable only by a slip of paper passed under the door. The analyst can think, reason, draft — but cannot walk outside, check a stock ticker, or open a filing cabinet. If they need today's exchange rate, they can't get up and look. All they can do is write a very specific, well-formatted request on their outgoing slip: "Please check the USD/JPY rate and tell me." Someone on the other side of the door reads that request, actually checks the rate, and slides the answer back in.

The model is the analyst. The "slip of paper" is a tool call. The person on the other side of the door — the one who actually checks the rate — is your application code. The analyst never leaves the room. They never touch the ticker. They only ever get better at *writing precise requests* and *reading what comes back*.

## Walk it through

1. You ask the model, "What's USD/JPY trading at right now?"
2. The model has no live connection to any market — its only output channel is text. It cannot query anything directly.
3. If a tool named `get_exchange_rate` is available, the model writes a structured request for it instead of guessing a number. That request is the entire extent of its "reach" — a formatted slip under the door.
4. Your code — the only thing in this picture with hands — receives that request, calls a real exchange-rate API, and gets back an actual number.
5. Your code writes that number on a return slip and passes it back in.
6. The model reads the slip and writes the final sentence: "USD/JPY is trading around 149.30."

At no point did the model touch the network. It asked, in writing, for someone else to look.

## The wrong intuition — and the correction

The common wrong mental model is that the tool call *is* the action — that when the model "calls" `get_exchange_rate`, something out in the world has already happened, the way a function call in a running program executes immediately. It hasn't. A tool call is inert until your code decides to act on it. The model emitting `{"name": "delete_account", "input": {"id": 42}}` deletes nothing by itself — nobody's account is gone until your handler runs and you chose to let it. This is why unchecked execution is a designed-in risk, not a bug: see [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely) and [The Authority Problem](/learn/tools-function-calling/the-authority-problem) for what changes once you accept that the model is only ever *asking*.

The contrast that makes this concrete: ask a model without tools for a stock price and it will often produce a plausible-looking number anyway — trained to keep talking, it fills the gap with its best guess from stale training data, wrong and confident. Give the same model a `get_quote` tool and the honest move becomes available: stop, ask, wait for a real number, then answer. Nothing about the model got smarter. It just got a way to stop bluffing.

## When the analogy breaks

The room-and-slip picture is good for one call, but it strains once you have a whole conversation running as a loop — the analyst doesn't get one slip and one reply, they get to keep asking follow-up questions, look at what came back, and decide whether they need *another* lookup before they can answer. That repeating exchange is the subject of [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) — the hands metaphor tells you why a single request has to leave the room at all, but not how a multi-step investigation gets built out of several of them in sequence, which is where [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) picks up. The metaphor also doesn't explain *how* the model learned to write well-formed slips instead of vague prose — that's a training-time fact, covered in [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools).

**Related:** [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools), [It's Still Text In, Text Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely), [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop)
