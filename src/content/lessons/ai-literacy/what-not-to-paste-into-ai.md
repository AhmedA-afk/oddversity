---
title: "What you should never paste into AI"
track: "ai-literacy"
status: live
summary: "A worked example — sanitizing a real HR complaint step by step — that turns 'don't paste sensitive data into AI' from a vague warning into a repeatable redaction reflex, plus the d."
duration: "11 min read"
---

A prompt box feels like a private notebook, but it behaves more like a support ticket: what you type can be logged, read by a human reviewer, and in some tools reused to train the next model. The fix isn't "never use AI for sensitive work" — it's a 60-second redaction habit you run before you hit send. Below is exactly how to do that, using a real HR complaint as the test case.

## The setup (specific)

Start with the quick sort, because most people don't need a rulebook — they need to recognize the shape of the problem in about two seconds.

**Never paste, in any form:**

- **Passwords, API keys, tokens, 2FA codes.** There's no "sanitized" version of a password — if you need help with a login error, describe the error, not the secret: *"my API call returns 401 Unauthorized, here's the header format I'm sending with the key blanked out."*
- **Full financial or medical records.** A scanned bank statement, a lab result with your name and record number on it, a credit report. Extract only the specific number you need help interpreting.
- **Other people's personal data**, gathered without their knowledge — a coworker's home address, a friend's immigration status, anyone's salary but your own.
- **Confidential work documents** — unreleased financials, a client's proprietary source code, an internal strategy memo — even if you personally have access to them.
- **Anything under NDA.** Sometimes the content isn't even the risk; the fact that the document exists is what you agreed not to disclose.

**Usually fine:**

- **Anonymized questions** — "how do I structure a performance improvement plan for repeated lateness" instead of the real complaint with real names.
- **Public information** — a published policy, a public API's docs, a news article.
- **Your own low-risk drafts** — a blog post you're free to publish, your resume with the SSN line removed.

That list is easy to agree with and easy to get wrong in the moment, because real documents mix all of these together in one paste. So the rest of this page carries one messy, realistic document all the way through the redaction process, because that's where the list actually gets tested.

## Step by step

Here's the raw complaint text, as it might land in your inbox from an employee (names, company, and details invented for this example):

```text
Complaint filed 3/14 by Priya Anand (Employee ID 88213, Marketing,
Building C) against her manager, David Kowalski (Employee ID 55010).
Priya alleges that during the March 12 team meeting, David said in
front of the whole team: "Maybe if you spent less time on maternity
leave you'd know how the new CRM works." She says this is the third
time he's referenced her leave since she returned in January. She's
asking HR to move her to a different reporting line before her
performance review on April 2, since she believes David will give
her a low rating in retaliation. Her salary is $84,500 and she's
worried a bad review will cost her the $6,000 raise she was told to
expect. Attached is an email she forwarded from December where David
wrote: "Priya - not sure you're cut out for the pace we need right
now, might want to think about whether this role is still right for
you." His signature: David Kowalski, Senior Marketing Manager,
Alderpoint Logistics, dkowalski@alderpoint-logistics.com,
(415) 555-0148.
```

You want AI's help thinking through next steps — but you don't want two employees' names, IDs, salary, and a manager's direct email sitting in a vendor's logs. Here's the pass.

**Step 1 — Inventory every identifier before you touch the wording.**

Read once, just to list what's identifying: 2 full names, 2 employee IDs, 3 specific dates, a department and building, a salary figure, a raise figure, two direct quotes, and — easy to miss — a forwarded email signature with a work email and phone number.

> **Why this step?** If you jump straight to rewriting sentences, you fix the ones you notice and miss the ones buried in what looks like an attachment rather than "the complaint." An inventory turns a fuzzy feeling ("this seems sensitive") into a checklist you can actually clear.

**Step 2 — Build a redaction map you keep on your machine, never in the prompt.**

| Real | Placeholder | Sent to the AI? |
|---|---|---|
| Priya Anand | `[EMPLOYEE_A]` | yes (as placeholder) |
| David Kowalski | `[MANAGER_A]` | yes (as placeholder) |
| Employee ID 88213 / 55010 | — | no, dropped entirely |
| Marketing, Building C | `[DEPT]` | yes |
| 3/14, March 12, April 2 | `[DATE]`, "a team meeting," "her upcoming review" | yes, generalized |
| $84,500 / $6,000 | "her salary" / "an expected raise" | yes, without figures |
| dkowalski@alderpoint-logistics.com, (415) 555-0148 | — | no, dropped entirely |

> **Why this step?** Not everything gets a placeholder — some things just get deleted. The employee IDs and the manager's direct contact info add zero value to an AI helping you think through *process*, so the right move isn't to disguise them, it's to leave them out. Ask "does the AI's job actually require this fact?" for each row, not just "is this a name?" The dollar figures are a judgment call: if you were asking the AI to check whether a raise matches a stated policy percentage, you'd keep the numbers and drop the names instead — you rarely need to protect both at once.

**Step 3 — Rewrite using the map, keeping the substance.**

```text
An employee has filed a complaint that her manager, [MANAGER_A], made
repeated comments referencing her recent parental leave, including once
in front of the team: "Maybe if you spent less time on leave you'd know
how the new system works." This is the third such comment since she
returned from leave. She's asking to be moved to a different reporting
line before her upcoming performance review, since she's concerned the
review will be used to retaliate. She's also worried a low rating will
cost her an expected raise.
```

> **Why this step?** Notice the quote survived, reworded only to drop the product name. In an HR complaint the *exact words* are often the evidence — sanitizing isn't about vagueness, it's about removing what identifies the people, not what makes the case real.

**Step 4 — Reread it as a stranger and ask "could I still name these people?"**

If Marketing at this company has one employee who returned from leave in January, "[EMPLOYEE_A], Marketing, back from leave since January" is a re-identifying description even with the name gone — it's a category of one. For this draft, generalizing "Marketing" to "her department" and dropping "since January" closes that gap. Keep asking this question every time you strip an identifier; it's the step people skip because the text *looks* anonymous once names are gone.

**Step 5 — Send the sanitized version and use the output for what it's actually good for.**

```text
I'm an HR generalist. An employee has filed a complaint that her
manager made repeated comments referencing her recent parental leave,
including once in a team meeting. She's asking to be moved to a
different reporting line before her upcoming performance review,
since she's worried the review will be used to retaliate. What are
the standard next steps for investigating a complaint like this, and
how should we handle the overlap with her scheduled review?
```

This gets you back genuinely useful process guidance — separate the investigation from the review timeline, document dates and witnesses independently of who does the rating, loop in whoever handles retaliation claims before the review date arrives — without a single real name, ID, or dollar figure ever leaving your machine. That's the trade you're making throughout: the AI is good at *process*, and process rarely needs identity.

**Step 6 — Reinsert the real names yourself, from your local map, when you write the actual case file.**

Never ask the AI to do this reinsertion for you — that means pasting the real names back into the same chat you were trying to keep clean. The map lives in a notes file only you hold; you're the one who closes the loop.

## Where it breaks

Redaction fails quietly, not loudly — you don't get an error message. Here's exactly how it broke in this example, before Step 1 caught it.

**Failure 1: the part that didn't look like "the complaint."** A first pass at sanitizing focused on the narrative paragraph and left the forwarded email at the bottom untouched, because it read as an attachment, not as the thing being redacted:

```text
...Attached is an email she forwarded from December where David wrote:
"Priya - not sure you're cut out for the pace we need right now..."
His signature: David Kowalski, Senior Marketing Manager, Alderpoint
Logistics, dkowalski@alderpoint-logistics.com, (415) 555-0148.
```

That's a real name, employer, work email, and phone number sitting in a vendor's logs, protected by nothing. Forwarded threads and signature blocks carry structured identifiers that plain narrative text doesn't — treat anything with a "From:"/"Sent:" header, an `@`, or a phone-number shape as its own object to strip, not text to skim along with the rest.

If you're comfortable with a little code, a mechanical backstop catches exactly this kind of miss before you paste:

```python
import re

text = open("complaint_draft.txt").read()

patterns = {
    "email": r"[\w.+-]+@[\w-]+\.[\w.-]+",
    "phone": r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}",
    "employee_id": r"\b(?:employee\s*id|id)\s*#?\s*\d{4,}\b",
    "forwarded_header": r"^(From|Sent|To|Subject):",
}

for label, pattern in patterns.items():
    hits = re.findall(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
    if hits:
        print(f"{label}: {hits}")
```

Run against the unfixed draft, this prints the email and phone number immediately. It's not a substitute for reading your own text — it's a net for the one line you'll skim past when you're tired.

**Failure 2: redaction that technically works but doesn't anonymize.** Even with every name and contact detail gone, "the only employee in Marketing back from parental leave since January" is still one specific person to anyone who works there. No amount of placeholder-swapping fixes a population of one — that's not a technical failure, it's a hard limit. The real fix is scope, not more redaction: use the sanitized prompt only for the process-level question ("how do we structure this investigation") that needs zero identifying detail, and keep the case-specific narrative — names, dates, and all — inside whatever system your company actually has a data agreement with. That's a policy question, not a wording one; see [data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) for what those agreements do and don't promise, and [what happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type) for why the vendor's policy is a second layer, not a replacement for redacting in the first place.

## Takeaways

- **Redact before you send, not after you regret it.** Build the habit as a pause between "paste" and "enter," not a cleanup step afterward.
- **Inventory first, rewrite second.** Skimming for what "seems sensitive" misses forwarded headers and signature blocks; a deliberate list doesn't.
- **Delete, don't just disguise, anything the AI's task doesn't need.** IDs and direct contact info usually add nothing — drop them rather than placeholder them.
- **Test re-identification, not just name removal.** "Anonymous" and "not one specific person" aren't the same thing, especially in small teams.
- **Keep the redaction map local.** It's the one artifact in this whole process that should never touch a prompt.
- **Some documents don't get a sanitized version.** If the NDA covers the document's existence, or the free tool you're using [prices your data as the product](/learn/ai-literacy/your-data-can-be-the-price), the answer is a different tool or no AI at all — not a better find-and-replace.

**Related:** [Data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy) · [What happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type) · [Your data can be the price](/learn/ai-literacy/your-data-can-be-the-price) · [Using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly) · [Where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) · [Privacy, bias, and ethics quiz](/learn/ai-literacy/privacy-bias-and-ethics-quiz)
