---
title: "From File Upload to a Multimodal Call"
track: "genai-app-dev"
status: live
summary: "The full path from a file picker to a vision call: validate, resize client-side, and construct the message envelope."
duration: "8 min read"
---

This builds the whole path, end to end: a user picks a receipt photo, the browser validates and resizes it before it ever leaves the machine, and the server turns it into a multimodal call that asks the model to describe it.

## What we're building

A working "describe this receipt" feature: a file input in React, client-side validation and resizing, an upload to a server route, and a server-side call that constructs the image content block from [Accepting Multimodal Input: Images, Audio, Files](/learn/genai-app-dev/multimodal-input-images-audio-files).

## Setup

No new dependencies beyond what's already in a typical Next.js + Anthropic SDK app. The client-side resize uses the browser's native `Canvas` API — no image library needed for this.

## Build it

### 1. Validate before touching the file at all

```tsx
const MAX_BYTES = 10 * 1024 * 1024; // 10MB, before any resizing
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Please upload a PNG, JPEG, or WEBP image.";
  if (file.size > MAX_BYTES) return "Image is too large — please use a file under 10MB.";
  return null;
}
```

> **Why this step?** Rejecting a bad file before you've spent any CPU decoding it is free; discovering the same problem after a failed, billed API call is not — the same principle [Handling Multimodal Input](/learn/genai-app-dev/handling-multimodal-input) calls out. This check happens client-side for instant feedback, but never *only* client-side — see Harden it below.

### 2. Resize on the client before upload

```tsx
async function resizeImage(file: File, maxDimension = 1568): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9));
}
```

> **Why this step?** A 12MB phone photo at 4000px on its long edge wastes bandwidth and tokens for no quality benefit — most models internally downscale to a maximum dimension anyway, so shrinking to roughly 1568px before it ever leaves the browser costs nothing in the model's actual read of the image and meaningfully cuts both upload time and the request payload size. `createImageBitmap` also normalizes EXIF orientation as a side effect on most browsers, which sidesteps the classic "the model read it sideways" bug.

### 3. Upload the resized image to your server

```tsx
async function uploadAndDescribe(file: File) {
  const error = validateFile(file);
  if (error) return setError(error);

  const resized = await resizeImage(file);
  const base64 = await blobToBase64(resized);

  const res = await fetch("/api/describe-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg" }),
  });
  return res.json();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]); // strip the data: prefix
    reader.readAsDataURL(blob);
  });
}
```

> **Why this step?** The client sends already-resized, already-validated bytes — the server does no image processing of its own, only the API call. Stripping the `data:image/jpeg;base64,` prefix matters: the Anthropic API wants the raw base64 payload in `source.data`, not a data URL.

### 4. Construct the multimodal message server-side

```ts
// app/api/describe-receipt/route.ts
export async function POST(req: Request) {
  const { imageBase64, mediaType } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: "Describe this receipt: vendor, date, total, and line items." },
      ],
    }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return Response.json({ description: text, usage: response.usage });
}
```

> **Why this step?** The image block comes *before* the text block in `content` — a common convention that gives the model the visual context first, then the instruction about what to do with it. `response.usage` is returned to the client here specifically so you can surface or log the token cost of this call, since images are one of the few inputs that can silently dominate a request's token count.

## Run it

Pick a receipt photo, watch the request payload shrink noticeably after the client-side resize (check your network tab — a 4MB original often becomes a few hundred KB), and confirm the description comes back referencing the actual vendor and total on the receipt, not a generic "this looks like a receipt."

## Harden it

- **Re-validate type and size on the server, not just the client.** A client-side check is a UX nicety, not a security boundary — anyone can call your API route directly, bypassing your React component entirely. Repeat the `ALLOWED_TYPES` and `MAX_BYTES` checks server-side before the image ever reaches the model call.
- **Never log the raw base64 payload.** Receipts, IDs, and photos frequently contain personal data — application logs are not the place for the actual image bytes; log metadata (size, dimensions, a hash) instead.
- **Retry on transient failures, not on validation failures.** A 429 or a network blip is worth a backoff-and-retry per [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies); a rejected file type or an oversized image should surface to the user immediately, not silently retry against the same bad input.

## Extend it

For an image that's going to be referenced across many follow-up questions rather than described once, swap the base64 path for a file-reference upload and reuse the ID — the tradeoff worked through in [Accepting Multimodal Input: Images, Audio, Files](/learn/genai-app-dev/multimodal-input-images-audio-files). Add a transcription step ahead of this same message-construction pattern and you have the audio path from the same lesson.

**Related:** [Accepting Multimodal Input: Images, Audio, Files](/learn/genai-app-dev/multimodal-input-images-audio-files), [Handling Multimodal Input: Images, Audio, and Files](/learn/genai-app-dev/handling-multimodal-input), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
