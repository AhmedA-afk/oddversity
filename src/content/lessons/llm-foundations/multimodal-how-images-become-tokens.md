---
title: "Multimodal LLMs: How Images Become Tokens"
track: "llm-foundations"
status: live
summary: "A vision encoder patchifies pixels into a grid, a projection layer maps patches into the LLM's embedding space, then fusion strategy diverges."
duration: "7 min read"
---

[Multimodal LLMs, explained](/learn/llm-foundations/multimodal-llms-explained) tells you the destination: pixels and words end up in the same embedding space. This page is about the two-stage machinery that gets an image there, and the fork in the road once it arrives.

## What it is

Getting an image into a transformer that only knows how to consume a sequence of vectors takes two separate steps, done by two separate components:

1. **Patchify and encode.** A vision encoder — typically a Vision Transformer (ViT) — slices the image into a fixed grid of small square patches (commonly 14×14 or 16×16 pixels), flattens each patch into a vector of raw pixel values, and runs that sequence of patch vectors through its own transformer layers, producing one output vector per patch. This is the same [attention mechanism](/learn/llm-foundations/attention-mechanism-explained) used in the language model, just running over patches instead of text tokens, with its own positional encoding marking each patch's row and column.
2. **Project into the LLM's space.** The vision encoder's output vectors live in *its own* dimensionality, which almost never matches the language model's embedding dimension. A separate, usually small, learned projection — a linear layer or a short MLP — maps every patch vector from the vision encoder's dimension into the language model's embedding dimension. Only after this projection do the image's vectors look, structurally, like any other row in the [embedding table](/learn/llm-foundations/what-are-embeddings) the language model already knows how to process.

## The mental model

Think of the vision encoder as a translator that only speaks "vision dimension," and the projection layer as the actual interpreter that converts its output into "language-model dimension." The vision encoder is often trained separately (sometimes frozen entirely, sometimes fine-tuned) — its job is purely to turn pixels into a good visual representation. The projection layer is what's specifically trained to make that representation legible to *this* language model, and it's frequently the cheapest part of the whole system to train: bolt a new projection layer between an existing vision encoder and an existing language model, train just that (and maybe lightly fine-tune the rest), and you have a working multimodal system without training either large component from scratch.

## Why it works this way

Once a patch vector has been projected into the language model's embedding dimension, the language model has no architectural way to tell it apart from a text token's embedding — both are just rows of the same size, sitting in the same sequence, about to be summed with positional information and fed into the same [transformer blocks](/learn/llm-foundations/the-transformer-architecture). That's the entire trick: unify the *shape* of the representation, and the same self-attention machinery that already knows how to relate text tokens to each other can relate an image patch to a word, or two image patches to each other, without any modality-specific logic inside the language model itself.

Two different architectures take that unified representation and use it differently:

- **Early fusion (inline tokens):** the projected image-patch vectors are inserted directly into the token sequence, interleaved with text tokens, and every layer of the language model attends over the combined sequence exactly as it would over text alone. This is architecturally the simplest approach — no changes to the language model's attention mechanism — but it means image patches consume [context window](/learn/llm-foundations/context-window-mechanics) budget exactly like text tokens do, and attention cost grows with the combined sequence length.
- **Cross-attention fusion:** the language model's main sequence stays text-only, but extra cross-attention layers are inserted into the language model that let text tokens attend to a fixed set of image feature vectors at every layer, without those image vectors ever occupying a slot in the primary token sequence. This keeps the text-side context budget untouched by image size and can be cheaper for very high-resolution images or many images, at the cost of a more complex architecture with dedicated cross-attention layers rather than reusing the existing self-attention path.

## A concrete example (shown)

A single 224×224 image, patchified at 14×14 pixels per patch, gives a grid of `224 / 14 = 16` patches per side, or `16 × 16 = 256` patches total — 256 vectors entering the projection layer, and (under early fusion) 256 tokens added to the context window for that one image, before a single word of the actual question has been read. Double the image resolution to 448×448 with the same patch size and the grid becomes `32 × 32 = 1024` patches — a 4x increase in image tokens for a 2x increase in linear resolution, since patch count scales with image *area*. This is the concrete arithmetic behind why high-resolution images and multi-image prompts are disproportionately expensive under an inline-token approach, and why some systems tile or downsample large images before patchifying them.

## Where it shows up

Every "paste a screenshot and ask about it" interaction runs through exactly this pipeline: patchify, encode, project, then either splice into the sequence or cross-attend, depending on the architecture. It's also why context-window budgeting for a multimodal prompt has to account for images as real token consumers, not as free attachments — a handful of high-resolution images under an early-fusion architecture can use up more of the context window than several pages of text.

## Watch out for

- **A shared embedding space doesn't mean shared training.** The vision encoder is frequently pretrained on a separate objective (often contrastive image-text matching, not next-token prediction) before ever being connected to the language model — the projection layer is what has to be trained (or fine-tuned) specifically to make the two halves cooperate.
- **Understanding images and generating them are different capabilities.** Most multimodal chat models are multimodal on the *input* side only — they consume image tokens through the pipeline above but still emit only text tokens via ordinary [next-token prediction](/learn/llm-foundations/next-token-prediction). Producing pixels or audio as output typically requires a separate downstream decoder (a diffusion model, an audio vocoder), not an extension of this same token-prediction loop.
- **Patch count, not file size, drives token cost.** A visually simple image at high resolution can cost far more tokens than a visually complex one at lower resolution, because the pipeline counts patches, not information content.

## Where next

[Multimodal LLMs, explained](/learn/llm-foundations/multimodal-llms-explained) covers what this unification unlocks in practice and where output-side generation diverges from this pipeline.

**Related:** [Multimodal LLMs, Explained](/learn/llm-foundations/multimodal-llms-explained), [What Are Embeddings?](/learn/llm-foundations/what-are-embeddings), [Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
