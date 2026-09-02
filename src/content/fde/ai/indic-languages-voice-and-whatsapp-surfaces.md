---
title: "Indic languages, voice, and WhatsApp as the interface"
phase: ai
module: guardrails-cost-and-choice
kind: lesson
summary: "For a large share of Indian users, the interface is WhatsApp, the language is a mix of Hindi and English inside the same sentence, and the network is not the one you built the pilot on. Design for all three from the start, not as a localisation pass at the end."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain what the WhatsApp Business API constrains that a custom chat UI does not, and design around it.
  - Handle Hinglish and transliterated input without treating it as a language-detection failure.
  - Design a voice or chat interaction that degrades gracefully on an unreliable mobile connection.
artifact: A short design note covering interface, language handling, and network resilience for one system from an earlier lab, reframed for a WhatsApp-first Indian deployment.
---

A textile exporter's operations team, a co-operative bank's rural branch customers, a district administration's grievance-redressal users: for a large share of the people an Indian enterprise deployment actually serves, the interface is not a web app or a downloaded native app. It is WhatsApp, because that is the app already installed, already trusted, and already used for everything else. Building for this audience means designing around WhatsApp's actual constraints, not treating it as a thin wrapper around a chat interface you built for something else.

## What the WhatsApp Business API actually constrains

WhatsApp's business platform is not a general-purpose chat channel with a WhatsApp logo. It has rules that shape what a conversational AI system can do, and they matter from the architecture stage, not as an afterthought:

- **Session windows.** A business can send free-form messages only within a limited window after the user's last message; outside that window, only pre-approved message templates can be sent. A system designed as if it can message the user freely at any time will silently fail to reach them once the session window closes — the workflow needs an explicit design for what happens when a response needs to go out after the window has lapsed, typically a template message re-opening the conversation.
- **Template approval.** Any proactive message — a status update, a reminder, a notification the user did not just ask for — needs a template submitted for approval in advance, with fixed structure around any variable content. This means you cannot design a workflow where the AI freely composes an arbitrary proactive notification; it composes content that fits into an approved template's variable slots, which is a real constraint on system design, not a formatting detail.
- **Opt-in requirements.** Users must explicitly opt in before a business can message them, and that opt-in has to be handled correctly at onboarding, not assumed. A support workflow that expects to message a user first, before they have opted in, will not work at all.

Design the workflow around these constraints from the first architecture conversation, because they determine what "proactive" can even mean in this deployment, and discovering them after the design is set is a rebuild, not a patch.

## Hinglish is not a language-detection failure

A real message from an Indian user might read "kal delivery ho jayegi kya" or mix scripts entirely — Devanagari for part of a sentence, Roman transliteration for the rest, English technical terms dropped in throughout. Treating this as noise to clean up before "real" language processing begins is the wrong frame. Code-mixing between Hindi and English, and transliteration of Hindi into Roman script, is simply how a large share of everyday communication happens for many Indian users — it is the input, not a malformed version of some cleaner input.

Practically, this changes two things about how you build. First, do not gate the system behind a language-detection step that tries to classify a message as "Hindi" or "English" before deciding how to handle it — a single sentence can legitimately be both, and a hard classification step will misroute exactly the messages that most need correct handling. Let the model handle code-mixed input directly in the prompt and response generation, since modern models are generally capable of reading and responding in Hinglish coherently without a separate translation step; test this directly against real code-mixed examples in your eval set rather than assuming it works. Second, build your eval set, from the evals-first module earlier in this phase, with code-mixed and transliterated examples specifically — a domain expert labelling only clean, single-language examples will not catch a system's Hinglish failures, and Hinglish input is common enough in the target user base that it deserves its own labelled slice in the eval, the same way you would slice by document type or channel elsewhere in this path.

Whether to respond in Hindi, English, Hinglish, or the register of the incoming message is itself a decision worth making explicitly and testing — matching the user's own register usually reads as more natural than defaulting to formal English regardless of how the question was asked, and the registers lesson in the field phase of this path covers this choice in more depth for spoken and written communication generally.

## Voice, and the network it actually runs on

A voice interface tested on an office wifi connection with a good microphone behaves nothing like the same interface used by someone on a patchy mobile network in a rural area, mid-call, on a budget phone's built-in speaker. Design for the second case, because it is the common one for a large share of the addressable users, not an edge case to handle later:

- **Keep individual turns short.** A long spoken response is more likely to be interrupted by a network hiccup partway through, and a user on an unreliable connection has less patience for a long uninterruptible reply than one on a fast, stable line. Favour shorter turns with an explicit opening for the user to interrupt or ask a follow-up, over one long monologue.
- **Design for reconnection, not just for the happy path.** A dropped call mid-conversation is a network event, not a system failure, and the interface layer needs an explicit path for resuming a conversation that was cut off — picking up context rather than starting over, where the channel allows it.
- **Build a text fallback.** Where the same workflow is available over WhatsApp text as well as voice, a user on a bad connection can drop to text rather than lose the interaction entirely. Designing both surfaces against the same underlying workflow, rather than as two separate builds, means this fallback is close to free once the core logic is channel-agnostic.
- **Treat transcription quality as part of the eval, not an assumption.** Speech-to-text accuracy on accented, code-mixed, or noisy audio is meaningfully worse than on clean studio recordings, and a voice system's eval set should include real, messy audio samples — not just clean test recordings — for exactly the reason the RAG lessons in this module insist on testing against real documents rather than clean synthetic ones.

## The FDE angle

None of this is a localisation checklist to run through once near the end of a build. A system designed WhatsApp-first, Hinglish-aware, and network-resilient from the start looks different at the architecture level than one designed for a clean web chat interface and adapted afterward — the session-window and template constraints alone shape what kinds of proactive workflows are even possible, and retrofitting them after a design assumes free-form messaging is a rebuild. Raise these constraints in the first discovery conversation with a customer whose users are WhatsApp-first, the same way you would raise data residency or an air-gapped requirement: as an architectural input, not a detail to handle during implementation.

## What you should be able to do now

Given a customer whose end users are primarily reached through WhatsApp on mobile networks of variable quality, you should be able to name the session-window and template constraints that shape the workflow design, explain why code-mixed input needs its own eval slice rather than a language-detection gate, and design at least one concrete network-resilience choice for a voice or chat interaction.

Write the design note now: take a system from an earlier lab in this path and reframe it for a WhatsApp-first Indian deployment, covering the interface constraints, how Hinglish input is handled, and one specific choice that keeps the interaction usable on an unreliable mobile connection.
