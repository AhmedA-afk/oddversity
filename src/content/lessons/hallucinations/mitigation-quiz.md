---
title: "Quiz: Reducing Hallucination"
track: "hallucinations"
status: live
summary: "Twelve questions on choosing mitigations, diagnosing why a RAG setup still fails, and telling structure fixes from truth fixes."
duration: "10 min read"
---

Twelve questions covering the whole mitigation module. Each answer links back to the lesson with the full reasoning if you want to review it.

## 1. A support bot invents a specific dollar figure for a cancellation fee when no policy document was ever supplied to it. Which lever should be applied first?

A. Constrain the output to a JSON schema
B. Ground the answer in the actual retrieved policy document
C. Add a "don't hallucinate" instruction to the system prompt
D. Raise the abstention threshold

<details><summary>Answer</summary>

**Correct: B.** The model has no evidence at all for this fact — the problem is missing information, which grounding fixes directly by giving it the real document to read instead of recall from. See [grounding fundamentals](/learn/hallucinations/grounding-fundamentals).

- A is wrong: a schema would only constrain the *shape* of the fabricated number (say, forcing it to be a valid currency format) — it wouldn't stop the model from inventing a number in the first place, since there's no schema constraint here.
- B is correct.
- C is wrong: a vague "don't hallucinate" instruction gives the model no new information and no specific behavior change — see [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).
- D is wrong: raising the abstention threshold might make the model refuse more often, but it doesn't address why it was confidently wrong in the first place, and it's a blunter, more coverage-costly fix than just giving it the evidence.

</details>

## 2. A retriever, given the query "What's the SLA for enterprise uptime?", returns only pricing and onboarding chunks — nothing in the corpus actually discusses uptime SLAs. The model still states a specific uptime percentage confidently. Which RAG failure mode is this?

A. The model ignores context in favor of parametric memory
B. Retrieval misses the answer
C. Context contradicts itself
D. The model over-extrapolates beyond the passage

<details><summary>Answer</summary>

**Correct: B.** Nothing relevant was ever retrieved — the failure starts at the retrieval step, not at how the model used what it got. See [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates).

- A is wrong: this describes the model overriding correct, relevant context that *was* retrieved — here nothing relevant was retrieved at all.
- B is correct.
- C is wrong: there's no second, conflicting source in this scenario — only an absence of the right one.
- D is wrong: over-extrapolation means stretching a real, relevant passage past what it says; here there's no relevant passage to stretch.

</details>

## 3. A retrieved passage says "the Enterprise plan includes SSO." Asked whether Enterprise includes SCIM provisioning, the model answers "yes" and cites the same passage. Which RAG failure mode is this?

A. Retrieval misses the answer
B. Context contradicts itself
C. The model over-extrapolates beyond the passage
D. The model ignores context in favor of parametric memory

<details><summary>Answer</summary>

**Correct: C.** The citation is real and the passage was genuinely retrieved and used — but the model extended it into a claim (SCIM support) the passage never made. See [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) and [the citation verification loop](/learn/hallucinations/citation-verification-loop), which is exactly the check this failure needs.

- A is wrong: the relevant passage about the plan was retrieved fine.
- B is wrong: there's only one source here, so there's nothing to contradict it.
- C is correct.
- D is wrong: the model didn't override the passage with a prior belief — it used the passage as a jumping-off point for an unsupported inference, a different mechanism.

</details>

## 4. One retrieved chunk (an old pricing page) says a plan costs $10/month; another retrieved chunk (a newer page) says $12/month. The model answers "$11/month." Which failure mode is this?

A. Retrieval misses the answer
B. Context contradicts itself
C. The model over-extrapolates beyond the passage
D. The model ignores context in favor of parametric memory

<details><summary>Answer</summary>

**Correct: B.** Two retrieved sources disagree, and the model resolved the disagreement by blending them into a number that matches neither source — a fabrication dressed up with real citations. See [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates).

- A is wrong: both relevant chunks were retrieved successfully.
- B is correct.
- C is wrong: over-extrapolation is about going beyond a single passage's claim, not reconciling two conflicting ones.
- D is wrong: the model didn't ignore the retrieved context — it used both pieces, just badly.

</details>

## 5. A retrieved passage explicitly states "the fiscal year begins in April." Asked when the fiscal year starts, the model answers "January," matching the far more common pattern in general business writing. Which failure mode is this?

A. The model ignores context in favor of parametric memory
B. Retrieval misses the answer
C. Context contradicts itself
D. The model over-extrapolates beyond the passage

<details><summary>Answer</summary>

**Correct: A.** The correct, relevant passage was retrieved and available, but a strong parametric prior (most fiscal years follow the calendar year) won out over the weaker in-context signal. See [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) and [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding) on how position and prominence affect whether this happens.

- A is correct.
- B is wrong: the answer-bearing passage was retrieved successfully.
- C is wrong: there's only one source, so nothing contradicts.
- D is wrong: the model didn't extend the passage's claim — it contradicted it outright.

</details>

## 6. A tool call is schema-constrained so `customer_id` must be one of the real ids currently in scope for the conversation. The model still selects a real customer id — but the wrong one for this specific request. What does this show?

A. The constraint failed and needs a stricter schema
B. Constrained generation fixes output structure, not the truth of the selected value
C. Constrained decoding doesn't work for tool calls
D. The enum should have included a "correct" flag per id

<details><summary>Answer</summary>

**Correct: B.** This is the central limit of constrained generation: it makes an invalid *shape* of output (a fabricated id) unreachable, but it says nothing about which of the *valid* shapes is the right one for this specific query. See [constrained generation](/learn/hallucinations/constrained-generation-concept) and [structured output decoding](/learn/hallucinations/structured-output-decoding-impl).

- A is wrong: the constraint did its job perfectly — it prevented a fabricated id, which was its entire purpose.
- B is correct.
- C is wrong: the constraint worked exactly as designed; this scenario isn't a failure of the technique, it's a limit of what the technique claims to fix.
- D is wrong: schemas constrain shape and membership, not correctness for a given context — that needs grounding or verification layered on top, not a schema field.

</details>

## 7. A model's answer includes the sentence "The warranty covers accidental damage for 12 months [doc1]." `doc1` is a real, retrieved document. An automated check confirms `doc1` exists in the retrieved set and passes the citation. Is that enough to trust the claim?

A. Yes — if the citation points to a real, retrieved document, the claim is verified
B. No — the check only confirmed the citation exists, not that `doc1` actually supports the claim; an entailment check is still needed
C. Yes, as long as the document was retrieved with a high similarity score
D. No — the citation format itself is invalid, that's the real problem

<details><summary>Answer</summary>

**Correct: B.** This is precisely the gap [the citation verification loop](/learn/hallucinations/citation-verification-loop) walks through: `doc1` might actually say the warranty does *not* cover accidental damage. An existence check catches fabricated ids; it says nothing about whether the cited text supports the specific claim next to it. That needs a separate entailment check — see [NLI entailment grounding checks](/learn/hallucinations/nli-entailment-grounding-check-impl).

- A is wrong: this is the exact "decorative citation" trap called out in [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).
- B is correct.
- C is wrong: similarity score reflects retrieval relevance, not whether the passage's content entails the specific claim.
- D is wrong: the format is fine — `[doc1]` is a correctly formatted, real citation. The problem is content, not format.

</details>

## 8. A brainstorming tool helps a marketer draft tagline options for a new product. There's no source document to check them against. Which mitigation stack fits this task best?

A. Strict-RAG grounding plus a cite-or-abstain instruction
B. Schema-constrain the output to a fixed enum of pre-approved taglines
C. Minimal grounding and constraint — let the model generate freely
D. A high abstention threshold that refuses uncertain suggestions

<details><summary>Answer</summary>

**Correct: C.** There's no factual claim being made and no ground truth to be faithful to — the task is generative by design. Forcing grounding, citations, or constraint onto it doesn't reduce a meaningful hallucination risk; it just makes the tool worse at its actual job. See [when hallucination is desirable](/learn/hallucinations/when-hallucination-is-desirable) and [mitigation by task type](/learn/hallucinations/mitigation-by-task-type).

- A is wrong: there's nothing to ground against or cite — this would make the tool refuse to do the one thing it's for.
- B is wrong: an enum of pre-approved taglines defeats the purpose of a tool meant to generate new ones.
- C is correct.
- D is wrong: a high abstention threshold on a creative task just produces unhelpful refusals with no faithfulness benefit, since there's no factual claim to be unfaithful to.

</details>

## 9. An agent can call a `cancel_subscription(customer_id)` tool. The risk is the model inventing a plausible-looking but wrong `customer_id`, which would cancel the wrong account. What's the strongest first mitigation?

A. Add a prompt instruction asking the model to double-check the id before calling the tool
B. Schema-constrain `customer_id` to only the real ids currently in scope for the conversation
C. Add more retrieved context about the customer
D. Require a citation for the `customer_id` argument

<details><summary>Answer</summary>

**Correct: B.** This is a structural fabrication risk with a bounded, known set of valid values — exactly the case constrained generation is built for. Making a fabricated id structurally unreachable is a much stronger guarantee than asking the model to be careful. See [structured output decoding](/learn/hallucinations/structured-output-decoding-impl) and [tool-call argument fabrication](/learn/hallucinations/tool-call-argument-fabrication).

- A is wrong: a prompt instruction is a policy nudge, not a guarantee — exactly the "prompting isn't a switch" limit from [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).
- B is correct.
- C is wrong: more context can help pick the *right* id among valid ones, but it doesn't prevent a fabricated one — that's a constraint problem, not a grounding one.
- D is wrong: citation requirements are built for verifiable claims in prose, not for constraining a single structured argument to a known-valid set.

</details>

## 10. A team makes their support bot's grounding requirements very strict. It now fabricates almost nothing, but abstains on 40% of all queries, and users are frustrated. A teammate says "hallucination is solved." What's the flaw in that claim?

A. There's no flaw — zero fabrication is the only goal that matters
B. It ignores that abstention has a real coverage cost; the right operating point depends on the task's actual cost of a wrong answer versus an unanswered one, not just minimizing fabrication
C. Abstention prompts don't actually reduce fabrication rates
D. Adding more citations would fix the abstention rate without any tradeoff

<details><summary>Answer</summary>

**Correct: B.** This is the coverage-faithfulness-abstention triangle: pushing hard on faithfulness pushed coverage down, and a 40% abstention rate is a real cost that "hallucination is solved" ignores entirely. See [the coverage-faithfulness-abstention triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive) and the "abstention is free" mistake in [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).

- A is wrong: this treats coverage as worthless, which is only true for tasks where a wrong answer is far more costly than no answer — not a general rule.
- B is correct.
- C is wrong: the scenario shows abstention *did* reduce fabrication — the flaw is calling that "solved" while ignoring the coverage cost, not doubting the mechanism worked.
- D is wrong: citations address whether a *given* answer is checkable — they don't address how often the system chooses to answer at all.

</details>

## 11. A user asks, "Why did the enterprise SSO feature fail last month?" — but no such failure occurred. Which prompting pattern specifically catches this?

A. Permission to say unknown
B. Quote evidence before concluding
C. Explicit premise-checking
D. Separating stated facts from inference

<details><summary>Answer</summary>

**Correct: C.** The question embeds a false claim (that a failure occurred) rather than simply lacking an answer. Only explicit premise-checking treats the *question itself* as something to verify before answering. See [prompting patterns that lower hallucination](/learn/hallucinations/prompting-patterns-to-reduce-fabrication) and [adversarial and leading prompts](/learn/hallucinations/adversarial-and-leading-prompts).

- A is wrong: "permission to say unknown" helps when the answer to a legitimate question isn't available — it doesn't prompt the model to question whether the question's premise is true in the first place.
- B is wrong: quote-before-conclude helps ground a real answer in real evidence, but a model can still find a plausible-sounding quote-adjacent passage and build a fabricated narrative around a false premise.
- C is correct.
- D is wrong: separating stated fact from inference helps a reader tell which parts of an answer are grounded — it doesn't prompt the model to reject the question's premise before answering at all.

</details>

## 12. A team retrieves the top 20 chunks for every query "to be safe," instead of the top 3. Answers become vaguer and start blending facts from clearly unrelated sections. What's the fix?

A. Retrieve even more chunks so the right one is more likely to be included
B. Add a relevance-grading step and retrieve fewer, more precisely scoped chunks
C. Turn off the citation requirement so the model can synthesize more freely
D. Force the entire output into a rigid JSON schema

<details><summary>Answer</summary>

**Correct: B.** This is the "dump huge unfiltered context" antipattern directly: more retrieved chunks doesn't mean more grounding, it means more dilution and more chances for an irrelevant or contradictory chunk to pull the answer off course. See [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns), [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding), and [corrective RAG](/learn/hallucinations/corrective-rag-pattern-impl) for the grading mechanism.

- A is wrong: this is the same mistake taken further — more volume doesn't fix a precision problem, it worsens dilution.
- B is correct.
- C is wrong: removing citations makes the output less checkable without addressing why it's vague and blended in the first place.
- D is wrong: a rigid schema constrains output *shape* — it doesn't fix the underlying context-dilution problem, which is about what evidence the model is reading, not how the answer is formatted.

</details>

**Related:** [The Mitigation Landscape](/learn/hallucinations/mitigation-strategy-landscape), [Mitigation Cheatsheet](/learn/hallucinations/mitigation-cheatsheet), [Why RAG Still Hallucinates](/learn/hallucinations/why-rag-still-hallucinates), [Mitigation Antipatterns](/learn/hallucinations/mitigation-antipatterns)
