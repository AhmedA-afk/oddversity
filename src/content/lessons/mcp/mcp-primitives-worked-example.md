---
title: "Primitives, Worked: The Same Capability as a Tool, a Resource and a Prompt"
track: "mcp"
status: live
summary: "One feature — access to a policy document — built three ways, with the turn count, token cost and user experience of each, and the rule that falls out."
duration: "9 min read"
---

The three primitives are usually explained by definition. Definitions do not settle the question you actually have, which is *which one should this be*. So here is one capability built all three ways, with what each costs.

**The feature:** an assistant that answers questions about a company's refund policy, a 2,000-word document.

## Version A — as a tool

```python
@mcp.tool()
def get_refund_policy() -> str:
    """Return the current refund policy document."""
    return POLICY_PATH.read_text()
```

**The conversation:**

```
User:      Can I return a gift after 40 days?
Model:     [calls get_refund_policy]
Server:    → 2,000 words of policy
Model:     Gifts can be returned within 60 days with a gift receipt…
```

**What it cost.** Two model calls instead of one. The first produced no user-visible output; it existed only to fetch something the model could have been given. The tool's name, description and schema were also sent on every request in the conversation, whether or not it was needed.

**Where it actually fails.** The model has to *decide* to call it. Ask "what's your return window?" and it usually will. Ask something obliquely related — "I bought this in March, am I stuck with it?" — and it may answer from general knowledge without ever fetching the policy. You have made correctness contingent on a judgement call.

## Version B — as a resource

```python
@mcp.resource("policy://refunds")
def refund_policy() -> str:
    """The current refund policy, effective 2026-01-01."""
    return POLICY_PATH.read_text()
```

**The conversation:**

```
User:      [attaches policy://refunds] Can I return a gift after 40 days?
Model:     Gifts can be returned within 60 days with a gift receipt…
```

**What it cost.** One model call. The content is placed in context by the host, before the model reasons at all.

**What changed structurally.** The model no longer decides whether to fetch the policy — it is simply there. That removes the failure mode from version A entirely.

**Where it fails.** Someone or something has to attach it. In a client where the user picks resources manually, that is a step they may not take. And if the document were 200,000 words, putting it in context unconditionally would be wasteful — at that size you want retrieval, not a resource.

## Version C — as a prompt

```python
@mcp.prompt()
def check_refund_eligibility(purchase_date: str, item: str) -> str:
    """Check whether an item can be returned under the current policy."""
    return (
        f"Using the refund policy at policy://refunds, determine whether a "
        f"{item} purchased on {purchase_date} can be returned.\n"
        "State the applicable clause, the deadline, and any conditions.\n"
        "If the policy does not cover this case, say so rather than inferring."
    )
```

**The conversation:**

```
User:      [picks "Check refund eligibility"] → purchase_date: 2026-07-15, item: gift
Model:     Under clause 4.2, gifts purchased on 2026-07-15 may be returned until…
```

**What it cost.** One model call, plus the client surfacing a command.

**What changed.** The *workflow* is now the server's, not the user's. The prompt names the resource, states what to output, and — importantly — instructs the model to decline rather than infer when the policy is silent. A user typing freehand would not have added that last instruction, and it is the one that prevents a confident wrong answer.

## Side by side

| | Tool | Resource | Prompt |
|---|---|---|---|
| Model calls to answer | 2 | 1 | 1 |
| Who decides it is used | The model | The host or user | The user |
| Schema cost on every request | Yes | No | No |
| Fails when | The model does not think to call it | Nobody attaches it | The user does not find the command |
| Encodes *how* to use it | No | No | **Yes** |

## The rule this produces

**If the model must spend a turn calling something merely to *know* it, that thing is a resource.**

Tools are for *doing* — an action, a state change, or a fetch that genuinely depends on runtime arguments the model has to choose. `search_orders(email)` is a tool because the email is a real decision. `get_refund_policy()` is not, because there was never anything to decide.

Prompts are for when you know the right way to use your own server and want to ship it, rather than hoping each user reconstructs it.

## The version worth shipping

Usually more than one:

```python
@mcp.resource("policy://refunds")            # the content
def refund_policy() -> str: ...

@mcp.tool()                                  # a real decision: which order
def find_order(order_id: str) -> dict: ...

@mcp.prompt()                                # the workflow over both
def check_refund_eligibility(order_id: str) -> str: ...
```

Three primitives, three different jobs, no redundancy. The mistake is not choosing wrongly between them — it is making everything a tool because tools are the one people learn first.

---

Next: [tools, resources and prompts](/learn/mcp/mcp-tools-resources-and-prompts) for the full definitions, and [common mistakes](/learn/mcp/mcp-primitives-common-mistakes).
