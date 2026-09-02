---
title: "Accepting Multimodal Input: Images, Audio, Files"
track: "genai-app-dev"
status: live
summary: "Base64, URL, or file reference — the three shapes non-text input takes, and what each one costs before the call."
duration: "6 min read"
---

[Handling Multimodal Input: Images, Audio, and Files](/learn/genai-app-dev/handling-multimodal-input) covers resizing, transcription, and extraction — turning a raw upload into content the model can read. This lesson is one layer earlier: the three *shapes* that content can take in the request itself, and how choosing between them changes what your server has to do and what each call costs.

## What it is

Every non-text input a model accepts — an image today, and increasingly audio and other file types — can reach the API in one of three ways: **inline base64** (the bytes travel inside the request body itself), **a hosted URL** (the model's own infrastructure fetches the bytes from somewhere you don't control the timing of), or **a file reference** (you upload the bytes once through a dedicated endpoint, get back an ID, and reuse that ID across many later requests without re-sending the bytes at all).

## The mental model

The question that decides between them is: **who is hosting the bytes at the moment of the API call, and how many times will this exact asset be sent?** Base64 means *you* host them, inline, every single time — simple, but you pay the encoding and transfer cost on every call, even the fifth call about the same image. A URL means *someone else already* hosts them, so your payload stays small — but you're now trusting the model's fetcher to reach that URL successfully, on its schedule, not yours. A file reference means *the provider* hosts them, after one upload — the cheapest shape for anything reused, at the cost of an extra round trip the first time.

## Why it works this way

Base64 avoids a dependency (no extra fetch, no external host that has to be reachable) at the cost of size: base64 encoding inflates raw bytes by roughly a third, and that inflated string then travels over the wire on *every* call that includes it — a repeated cost with no memory of the previous call. URLs keep the request small but introduce a live dependency at generation time — a private image behind auth, a URL that's since expired, or a host that's temporarily down all become model-call failures instead of upload-time failures. File references trade a one-time upload cost for zero marginal cost on every subsequent reference — the right shape specifically when "subsequent" is plural.

## A concrete example (shown)

The same image, three ways, in a message's content array:

```json
// Inline base64 — bytes travel with every request
{ "type": "image", "source": { "type": "base64", "media_type": "image/png", "data": "iVBORw0KG..." } }

// Hosted URL — the model fetches it
{ "type": "image", "source": { "type": "url", "url": "https://cdn.example.com/receipt-42.png" } }

// File reference — uploaded once, reused by ID
{ "type": "document", "source": { "type": "file", "file_id": "file_abc123" } }
```

A decision in code, not just in principle:

```ts
function pickImageSource(image: UploadedImage, priorUseCount: number) {
  if (priorUseCount > 0) return { type: "file", file_id: image.fileId }; // reused asset — upload once, reference many
  if (image.hostedUrl) return { type: "url", url: image.hostedUrl };     // already hosted somewhere reachable
  return { type: "base64", media_type: image.mimeType, data: image.base64 }; // one-off, not hosted anywhere yet
}
```

## Where it shows up

A chat app handling a single screenshot a user just dropped in has no reason to upload it anywhere first — base64, inline, done. A document-QA app answering twenty follow-up questions against the same PDF should upload it once and reference the file ID from then on, rather than re-sending the same megabytes twenty times. A pipeline that's scraping images that are already hosted publicly should pass the URL directly rather than downloading, re-encoding, and re-uploading bytes the model could have fetched itself.

## Watch out for

- **Budgeting the raw file size, not the base64 size.** Base64 encoding adds roughly 33% to the byte count before it ever leaves your server — a 3MB image becomes a 4MB payload, and that's before accounting for the tokens the image itself costs once decoded on the model's side. See [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) for tracking that spend.
- **URL images that require auth the model's fetcher doesn't have.** A signed URL that expired, or an image behind a login wall, fails at generation time with an error that looks like a model problem but is actually a hosting problem — verify the URL is fetchable without any session context before relying on it.
- **One big image quietly dominating the token budget.** In a message mixing text, an image, and other content, the image can easily outweigh everything else combined — budget for it the way you'd budget for a long attached document, not as an afterthought next to a short prompt.

## Where next

Choosing the right shape is only half the feature — [From File Upload to a Multimodal Call](/learn/genai-app-dev/uploading-and-sending-images) builds the whole path from a user's file picker to a working vision call, including the resizing and validation that has to happen before any of these three shapes gets constructed.

**Related:** [Handling Multimodal Input: Images, Audio, and Files](/learn/genai-app-dev/handling-multimodal-input), [From File Upload to a Multimodal Call](/learn/genai-app-dev/uploading-and-sending-images), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope)
