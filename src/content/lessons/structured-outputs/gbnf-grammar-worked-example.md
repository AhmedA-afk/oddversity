---
title: "Writing a GBNF Grammar by Hand"
track: "structured-outputs"
status: live
summary: "Build a GBNF grammar for a contact record, trace what it blocks after a literal keyword, and see where a rigid grammar forces its own failure."
duration: "8 min read"
---

Not every target format is JSON. Here's a grammar for one that isn't, built and traced by hand.

## The setup

Say a downstream system needs contact records in a fixed legacy text format — no JSON, no braces, just `Name <name> Phone <digits>` — because that's what a decades-old import job expects. [JSON Schema can't express this at all](/learn/structured-outputs/grammar-constrained-beyond-json), since the target isn't JSON. A hand-written grammar can.

Source text to extract from: *"Contact: Jordan Kim, reachable at 555-201-8834 ext 12."*

## Step by step

### Step 1 — write the grammar

```gbnf
root   ::= "Name " name " Phone " phone
name   ::= word (" " word)?
word   ::= [A-Za-z]+
phone  ::= digit digit digit digit digit digit digit digit digit digit
digit  ::= [0-9]
```

> **Why this step?** Each rule becomes one region of the state machine described in [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive). `root` fixes the two literal keywords and their order; `name` allows one or two words (a first name, optionally a last); `phone` is spelled out as exactly ten `digit` rules rather than a repeat-count shorthand, so the grammar's shape is unambiguous without relying on a specific engine's extended syntax.

### Step 2 — load it into the decoding loop

```bash
./llama-cli -m model.gguf \
  --grammar-file contact.gbnf \
  -p "Extract as 'Name <name> Phone <digits>': Contact: Jordan Kim, reachable at 555-201-8834 ext 12."
```

> **Why this step?** The `--grammar-file` flag is what actually wires the grammar into the sampling loop — without it, this is just a prompt asking nicely for a format, with all the guardrails-vs-guidance gap that implies (see [Asking Nicely vs a Physical Rail](/learn/structured-outputs/guardrails-vs-guidance-intuition)).

### Step 3 — trace the mask right after the literal "Phone "

This is the riskiest boundary in the whole grammar: the model has just emitted `Name Jordan Kim Phone `, and the source text contains an extension (`ext 12`) the model might be tempted to carry over. Here's what the constraint does at that exact position — the specific token strings below are illustrative, meant to show the *mechanism*, not a captured trace:

| Candidate continuation | Would produce | Masked? | Why |
|---|---|---|---|
| `"5"` | `Phone 5...` | allowed | matches `digit` |
| `" "` (a second space) | `Phone  5...` | masked | not in the `digit` class |
| `"ext"` | `Phone ext...` | masked | letters aren't `digit` |
| `"("` | `Phone (555)...` | masked | punctuation isn't `digit` |
| `"N/A"` | `Phone N/A` | masked | not `digit` |

Every one of the masked continuations is something a model reaching for "helpful, natural-sounding text" might otherwise rank highly — a parenthesis for area-code formatting, a note that there's an extension. All of it is unreachable. What comes out the other side is exactly `Name Jordan Kim Phone 5552018834` — ten digits, nothing else, guaranteed.

## Where it breaks (+ fix)

Notice what just happened to the extension: `ext 12` had nowhere to go. The grammar has no rule that accepts it, so the information is silently dropped, not flagged. That's a real failure — the grammar didn't produce *wrong* output, but it produced *incomplete* output with no signal that anything was lost.

A second, sharper version of the same problem: if the source number had 11 digits (a leading country code) or only 7 (no area code), the `phone` rule still demands exactly ten `digit` tokens. The model is not permitted to emit nine or eleven — the grammar forces it to pad or truncate to fit, which means a too-rigid grammar can *manufacture* a wrong-but-legal digit sequence. This is a distinct failure mode from having no constraint at all: unconstrained, the model might paraphrase or hedge; over-constrained, it is compelled to output a fabricated-looking value that passes every check the grammar performs.

**Fix:** loosen the grammar to match reality instead of a single assumed format — allow a bounded digit range instead of a hard ten, and add an optional extension slot:

```gbnf
root   ::= "Name " name " Phone " phone ext?
phone  ::= digit digit digit digit digit digit digit (digit digit digit)?
ext    ::= " Ext " digit digit?
digit  ::= [0-9]
```

And, regardless of how tight the grammar is, treat grammar validity as necessary but not sufficient — a downstream check that flags suspiciously uniform digit runs (`0000000000`) or a record that dropped a token count mismatch from the source is still worth having. That's the same validation-layer discipline covered in [The Validation Layer](/learn/structured-outputs/the-validation-layer), applied to a plain-text grammar instead of JSON.

## Takeaways

- A grammar can only mask toward paths it was given — it cannot invent a slot for information nobody wrote a rule for.
- The tightest, most literal-sounding grammar (fixed ten digits) is not automatically the safest one; over-constraining can force fabrication just as reliably as no constraint forces hallucination.
- Trace the mask at the position right after your riskiest literal — that's exactly where a plausible-sounding but wrong continuation would otherwise slip through, and exactly where a too-narrow rule silently discards real information.

**Related:** [Grammars Beyond JSON](/learn/structured-outputs/grammar-constrained-beyond-json), [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive), [Turning On Structured Modes in Code](/learn/structured-outputs/enabling-structured-modes-across-sdks), [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes)
