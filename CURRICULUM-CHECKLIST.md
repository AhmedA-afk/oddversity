# Fieldguide — Curriculum Checklist

> 16 tracks · 220 concepts · **62 written** (62 pages live) · 158 scheduled.

Legend: `[x]` page is live · `[ ]` = scheduled (coming).


## Foundations


### 01 · Maths Foundations
_The minimum maths — vectors, probability, and gradients — needed to actually reason about how LLMs compute, not just use them._

- [x] **Vectors: The Basic Unit of Data** — A vector is just an ordered list of numbers — see how AI represents words, images, and preferences as points in space.
- [ ] **The Dot Product, Explained** — The dot product multiplies and sums two vectors to measure how much they point the same direction — the core operation behind attention and search. _(coming)_
- [x] **Cosine Similarity: Measuring How Alike Two Things Are** — Cosine similarity normalizes the dot product into a -1..1 score that ignores vector length — the standard metric for comparing embeddings.
- [ ] **Matrices as Transformations** — A matrix is a machine that transforms vectors — rotating, scaling, and mixing them — which is exactly what every neural network layer does. _(coming)_
- [ ] **Probability Basics for AI** — Probability distributions assign likelihoods to outcomes; understand them to read a model's confidence and its next-token predictions correctly. _(coming)_
- [x] **The Softmax Function** — Softmax turns a list of raw scores into a valid probability distribution that sums to 1 — how every LLM converts scores into a choice of next word.
- [ ] **Temperature: Reshaping a Probability Distribution** — Temperature rescales the softmax distribution before sampling — low temperature sharpens toward the top choice, high temperature flattens toward randomness. _(coming)_
- [ ] **Logarithms for Machine Learning** — Logarithms turn multiplication into addition and tame vanishingly small probabilities into numbers you can compute with — essential for reading loss and log-probs. _(coming)_
- [ ] **Perplexity: How Language Models Are Scored** — Perplexity measures how 'surprised' a model is by real text — the standard yardstick for comparing language model quality. _(coming)_
- [ ] **Gradients: Slopes in Many Dimensions** — A gradient is just a multi-dimensional slope — the direction and steepness that tells a function how to change to increase or decrease. _(coming)_
- [x] **Gradient Descent, Intuitively** — Gradient descent nudges a model's parameters a little at a time in the direction that reduces error — the engine behind all neural network training.
- [ ] **Backpropagation: How Networks Assign Blame** — Backpropagation applies the chain rule layer by layer, letting a network trace its error back to every individual weight that contributed to it. _(coming)_
- [ ] **Why High-Dimensional Space Feels Weird** — Intuitions from 2D and 3D space break down in the hundreds or thousands of dimensions where embeddings actually live — here's what changes and why it still works. _(coming)_
- [ ] **The Geometry of Embeddings** — Embedding spaces arrange meaning geometrically — synonyms cluster, analogies become directions, and 'nearest neighbor' becomes a search algorithm. _(coming)_

### 02 · AI Foundations
_The ground floor of AI: what these systems are, how they learn, and a working mental model of what they can and can't do._

- [x] **How LLMs Work** — A plain-language walkthrough of how a large language model turns your prompt into a response, one predicted token at a time.
- [x] **Tokens, Context, and Cost** — How text becomes tokens, how the context window bounds what a model can see, and how both drive what you pay per call.
- [x] **Choosing a Model** — How to pick the right model for a task by weighing capability, speed, context length, and cost instead of always reaching for the biggest one.
- [x] **AI vs. Machine Learning vs. Deep Learning** — AI, machine learning, and deep learning are nested fields, not synonyms — see exactly where each boundary sits and why it matters for what you're building.
- [x] **What a Neural Network Actually Is** — A neural network is layers of simple weighted-sum-and-threshold units stacked together — the one building block underneath every modern AI system.
- [ ] **Narrow AI vs. General AI** — Today's AI, including LLMs, is narrow — extremely capable within limits, not the general intelligence the word 'AI' implies to newcomers. _(coming)_
- [ ] **Supervised Learning, Explained** — Supervised learning trains a model on labeled input-output pairs until it can predict the label from the input alone — the classic ML recipe. _(coming)_
- [ ] **Self-Supervised Learning: Training Without Labels** — Self-supervised learning generates its own labels from raw data — the trick that let LLMs train on the whole internet without human-labeled examples. _(coming)_
- [ ] **Training vs. Inference** — Training adjusts a model's weights over many passes through data; inference just runs the frozen weights forward on your input — two very different cost and speed profiles. _(coming)_
- [ ] **Generalization vs. Overfitting** — A model that memorizes its training data instead of learning the underlying pattern fails the moment it sees something new — generalization is the actual goal. _(coming)_
- [ ] **Foundation Models, Explained** — A foundation model is trained once on broad data, then adapted to many downstream tasks — the paradigm shift that made today's AI products possible. _(coming)_
- [ ] **The Data the Model Learned From** — Everything a model can tell you traces back to its training data — its knowledge cutoff, blind spots, and biases all come from what it read. _(coming)_
- [ ] **AI Benchmarks and What They Miss** — Benchmark scores measure performance on specific test sets, not real-world competence — learn what leaderboards capture and what they systematically hide. _(coming)_
- [x] **A Mental Model for What LLMs Can and Can't Do** — A working mental model of LLM strengths (pattern completion, synthesis, code) and hard limits (arithmetic, up-to-date facts, true reasoning) so you stop being surprised.
- [ ] **AI Agents vs. Chatbots** — An agent that plans, calls tools, and takes multi-step action is a fundamentally different system than a chatbot that just replies to you — know which one you're building. _(coming)_

### 03 · LLM Foundations
_How large language models work under the hood, from tokenization through attention and pretraining to the fine-tuning that makes them useful assistants._

- [x] **Tokenization: How Text Becomes Tokens** — LLMs never see words — they see tokens, subword chunks produced by a tokenizer, and everything from cost to weird spelling failures traces back to this step.
- [ ] **Embeddings: Turning Tokens Into Geometry** — Each token gets mapped to a learned vector that encodes its meaning — the embedding layer that turns discrete text into geometry a network can compute on. _(coming)_
- [x] **The Attention Mechanism, Explained** — Self-attention lets every token look at every other token and decide how much to weigh it — the mechanism that replaced recurrence and made transformers parallelizable.
- [ ] **Positional Encoding: How Transformers Track Order** — Attention alone has no sense of word order, so transformers inject position information directly into the embeddings — here's how models still know 'dog bites man' from 'man bites dog'. _(coming)_
- [x] **The Transformer Architecture** — Stack attention and feed-forward blocks with residual connections and normalization, and you get the transformer — the architecture behind every major LLM since 2018.
- [x] **Next-Token Prediction: The One Objective** — Every LLM, at its core, is trained to do one thing — predict the next token given everything before it — and that single objective is enough to produce reasoning, code, and conversation.
- [ ] **Pretraining: Learning From the Whole Internet** — Pretraining is next-token prediction run at massive scale across a huge slice of the internet, and it's where an LLM acquires nearly all of its raw knowledge and capability. _(coming)_
- [ ] **Context Window Mechanics** — The context window is the fixed number of tokens the model can attend to at once — a hard architectural limit set by how attention scales, not just a product setting. _(coming)_
- [ ] **Sampling: Temperature, Top-k, and Top-p** — Turning next-token probabilities into actual text requires a decoding strategy — greedy, temperature, top-k, and top-p each trade off coherence against variety differently. _(coming)_
- [ ] **Instruction Tuning and RLHF** — A raw pretrained model just completes text; instruction tuning and RLHF reshape it to follow instructions and prefer helpful, safe responses — the step that turns a predictor into an assistant. _(coming)_
- [ ] **Emergent Abilities in LLMs** — Some capabilities — like multi-step arithmetic or chain-of-thought reasoning — appear suddenly past a scale threshold rather than improving gradually, and researchers still debate why. _(coming)_
- [ ] **Mixture of Experts, Explained** — Mixture-of-experts models route each token to a handful of specialized sub-networks instead of running the whole model, trading a fixed parameter count for far cheaper inference. _(coming)_
- [ ] **Model Families: Base, Instruct, Chat, Reasoning** — Base, instruct, chat, and reasoning variants of the 'same' model behave completely differently — know what each training stage actually changes before you pick one. _(coming)_
- [ ] **Multimodal LLMs, Explained** — Modern LLMs read images, audio, and video by encoding them into the same token and embedding space as text — one architecture, multiple input types. _(coming)_

## Working with Models


### 04 · Prompt Engineering
_Reliable, repeatable prompting techniques for getting the output you actually want out of a model._

- [x] **Answer-First Prompting** — Ask the model to commit to its answer before it explains, so you get the decision up front and the reasoning as backup.
- [x] **System Prompts vs User Prompts** — How the system prompt sets standing behavior while the user prompt carries the per-turn ask, and what happens when you conflate them.
- [x] **Delimiters: Fencing Off Instructions from Content** — Using XML tags, markdown headers, or triple-quotes to keep instructions, examples, and user content from bleeding into each other.
- [ ] **Role Prompting: What Personas Actually Change** — What assigning a persona actually changes in a model's output, and where it's cosmetic versus functional. _(coming)_
- [x] **Few-Shot Prompting: Teaching by Example** — Showing input-output examples instead of describing a task, and how many examples actually move the needle.
- [ ] **Zero-Shot vs Few-Shot: When Examples Earn Their Tokens** — Deciding when a well-written instruction is enough and when examples are worth the extra tokens. _(coming)_
- [x] **Chain-of-Thought: Getting the Model to Show Its Work** — Prompting the model to reason step by step before answering, and where it helps versus wastes tokens.
- [ ] **Decomposition: Splitting One Big Prompt into a Pipeline** — Breaking a task too complex for one prompt into a chain of smaller, verifiable prompts. _(coming)_
- [ ] **Self-Consistency: Voting Across Multiple Reasoning Paths** — Sampling several independent reasoning paths and taking a majority vote to catch one-off reasoning errors. _(coming)_
- [ ] **Why 'Don't Do X' Backfires** — Why telling a model what not to do is less reliable than describing the behavior you actually want. _(coming)_
- [ ] **Prompt Templates: Building Reusable, Parameterized Prompts** — Turning a working prompt into a reusable template with variables, ready for production traffic. _(coming)_
- [ ] **Prompt Anti-Patterns to Stop Doing** — Recurring mistakes — vague asks, buried instructions, contradictory constraints — that quietly wreck output quality. _(coming)_
- [ ] **Evaluating Prompts Before You Ship Them** — Testing prompt variants against a fixed set of cases and a rubric before picking a winner. _(coming)_

### 05 · Context Engineering
_Curating what actually goes into the context window so the model has the right information, in the right order, at the right cost._

- [x] **Context Engineering vs Prompt Engineering** — Why what you put in the context window is a separate discipline from how you phrase the instruction.
- [ ] **Relevance Filtering: Deciding What Doesn't Make the Cut** — Deciding what information earns a place in the context window before it ever reaches the prompt. _(coming)_
- [ ] **Context Ordering: Why Position Changes What the Model Notices** — Why content near the start and end of the context gets more attention than content buried in the middle. _(coming)_
- [x] **Retrieval vs Stuffing: Fetch Just-in-Time or Load It All** — Choosing between fetching relevant context just-in-time versus loading everything up front.
- [ ] **Token Budgeting: Splitting a Fixed Context Window** — Allocating a fixed context window across instructions, history, retrieved docs, and room for output. _(coming)_
- [ ] **Memory vs State: What Persists Across Turns and Sessions** — Separating what lives only in the current context from what needs to persist across sessions. _(coming)_
- [ ] **Compaction: Summarizing History to Reclaim Context Space** — Compressing long conversation history into a summary so it stops eating the context budget. _(coming)_
- [ ] **Sliding Windows: Rolling Off Old Turns Without Losing the Thread** — Dropping old turns on a rolling basis in long conversations without breaking continuity. _(coming)_
- [x] **Context Rot: When More Tokens Make the Model Worse** — How adding more tokens, even relevant ones, can degrade output quality well before the context limit is hit.
- [ ] **Structuring Injected Context So the Model Can Actually Use It** — Formatting retrieved or tool output — tables, IDs, sections — so the model can reliably reference it. _(coming)_
- [ ] **Merging Context from Multiple Tools Without Contradictions** — Combining context pulled from several tools or retrievals without introducing contradictions or duplicates. _(coming)_
- [ ] **Long-Context Strategies for Million-Token Windows** — Chunking, hierarchical summaries, and other techniques for using very large context windows effectively. _(coming)_
- [ ] **Testing Whether More Context Actually Helps** — Measuring empirically whether adding more context actually improves a given task's output. _(coming)_

### 06 · Structured Outputs
_Getting models to return machine-parseable, schema-valid data instead of free text._

- [x] **Why Structured Output: Free Text vs Machine-Parseable Data** — Why machine-parseable output matters for pipelines, and what breaks when you parse free text instead.
- [ ] **JSON Mode: Forcing Valid JSON Out of the Model** — Turning on a model's native JSON mode to guarantee syntactically valid JSON. _(coming)_
- [x] **JSON Schema: Specifying Your Exact Data Contract** — Writing a JSON Schema that pins down your exact data contract, not just 'valid JSON'.
- [ ] **Enums: Locking a Field to a Fixed Set of Values** — Restricting a field to a fixed set of values so the model can't drift into free text. _(coming)_
- [ ] **Nested Objects and Arrays in Output Schemas** — Designing schemas for nested objects, arrays, and optional fields without ambiguity. _(coming)_
- [ ] **Tool Schemas as a Structured-Extraction Mechanism** — Using a tool/function definition as a structured-extraction contract, separate from actual tool calling. _(coming)_
- [ ] **Pydantic and Zod: Deriving Schemas from Code** — Generating JSON Schema straight from Pydantic or Zod models so code and schema never drift apart. _(coming)_
- [ ] **Schema Design Choices That Reduce Model Errors** — Field naming, descriptions, and required-vs-optional choices that measurably cut model errors. _(coming)_
- [ ] **Constrained Decoding: How Guaranteed-Valid Output Actually Works** — How grammar-constrained decoding guarantees schema-valid output at the token level, not just via prompting. _(coming)_
- [x] **Validation and Auto-Repair: Catching and Fixing Bad Output** — Validating model output against a schema and automatically re-prompting to fix what fails.
- [ ] **Streaming Structured Output: Parsing Before the Response Finishes** — Parsing structured fields incrementally as they stream instead of waiting for the full response. _(coming)_
- [ ] **Structured Output Failure Modes and How to Spot Them** — Common breakage — schema drift, hallucinated fields, truncation, type mismatches — and how to spot each. _(coming)_

### 07 · Hallucinations & Reliability
_Understanding why models fabricate, and the concrete techniques to ground, verify, and contain it._

- [ ] **What a Hallucination Actually Is** — Defining hallucination precisely: fluent, confident output that isn't supported by facts or sources. _(coming)_
- [x] **Why Models Hallucinate: The Mechanics Behind Confident Wrong Answers** — The training and inference mechanics — next-token prediction, no built-in fact-check — behind confident wrong answers.
- [ ] **Hallucination Risk Factors: Which Tasks Are Most Dangerous** — Which task types (long-tail facts, dates, citations, math) are most prone to fabrication. _(coming)_
- [ ] **Leading Questions and False Premises That Induce Hallucination** — How leading questions and false premises coax a model into confirming things that aren't true. _(coming)_
- [x] **Grounding: Constraining Answers to Supplied Sources** — Constraining an answer to only what's actually present in supplied source material.
- [ ] **RAG as Hallucination Mitigation** — Using retrieval to hand the model something real to answer from, cutting fabrication at the source. _(coming)_
- [ ] **Citations: Making Every Claim Traceable to a Source** — Requiring claims to cite a specific source or span so they can be checked, not just asserted. _(coming)_
- [x] **Teaching a Model to Say 'I Don't Know'** — Prompting and evaluation choices that make abstention a rewarded answer instead of a failure.
- [ ] **Self-Verification: Having the Model Check Its Own Work** — Having the model re-read, critique, or re-derive its own output before it's treated as final. _(coming)_
- [ ] **Confidence Signals: What Model Certainty Actually Reflects** — What a model's stated or sampled confidence actually reflects, and how to elicit something closer to calibrated. _(coming)_
- [ ] **Fact-Checking Pipelines Before Output Ships** — Building an automated verification pass that checks claims against a trusted source before output ships. _(coming)_
- [ ] **Guardrails for High-Stakes Output** — Layering programmatic checks — blocklists, validators, human review — around generation for risk-sensitive use cases. _(coming)_
- [ ] **Measuring Hallucination Rate Instead of Spot-Checking** — Measuring hallucination rate systematically instead of relying on anecdotal spot checks. _(coming)_

## Building


### 08 · GenAI App Dev
_Turn a working prompt into a shipped product: streaming UX, cost and latency budgets, and the plumbing that keeps a GenAI feature alive in production._

- [x] **Anatomy of a GenAI Feature** — Map the pieces of a real LLM feature — client, backend, provider call, prompt, and guardrails — before you build one.
- [ ] **Your First LLM API Call** — Make a raw API call to a model provider from your own backend and read the response object end to end. _(coming)_
- [x] **Streaming Responses to the UI** — Stream tokens from the provider to the browser so users see words appear instead of waiting on a spinner.
- [ ] **Designing Chat UX That Doesn't Feel Broken** — Handle message history, stop/regenerate, typing indicators, and error states so a chat interface feels trustworthy. _(coming)_
- [ ] **Trimming Conversation History for Context Limits** — Decide what to keep, summarize, or drop as a conversation grows past what fits in one request. _(coming)_
- [ ] **Prompt Caching for Speed and Cost** — Cache stable prompt prefixes so repeat calls get cheaper and faster without changing model behavior. _(coming)_
- [ ] **Setting Latency Budgets for LLM Features** — Set a time budget for each step of a request and decide where to stream, cache, or cut scope to hit it. _(coming)_
- [ ] **Cost Budgets and Usage Tracking** — Estimate per-request cost up front and instrument usage so spend doesn't surprise you in production. _(coming)_
- [x] **Rate Limits and Retry Strategies** — Handle 429s and transient provider failures with backoff, jitter, and queuing instead of crashing the request.
- [ ] **Building a Provider Abstraction Layer** — Write one interface over multiple model providers so you can swap or fall back without rewriting call sites. _(coming)_
- [ ] **Handling API Keys and Secrets Safely** — Keep provider keys off the client and out of version control using server-side proxying and secret managers. _(coming)_
- [ ] **Error Handling for LLM Calls** — Distinguish provider errors, content filters, and malformed output, and design a graceful fallback for each. _(coming)_
- [ ] **Guardrails and Input Validation** — Validate and sanitize what goes into a prompt and what comes out before it reaches users or downstream code. _(coming)_
- [x] **Shipping Your First End-to-End GenAI App** — Assemble streaming, caching, retries, and error handling into one deployed app, from request to response.

### 09 · RAG
_Ground model answers in your own data — from chunking and embeddings through hybrid retrieval, reranking, and knowing when to skip RAG entirely._

- [x] **What Is RAG and When to Use It** — Understand the retrieve-then-generate pattern and the failure modes it's built to fix.
- [x] **Chunking Strategies for Documents** — Split source documents into chunks that preserve meaning, sized for both retrieval precision and context budget.
- [x] **Embeddings and Semantic Similarity** — Turn text into vectors and understand what 'similar' means in embedding space.
- [ ] **Similarity Search and ANN Indexes** — Use approximate nearest neighbor search (HNSW, IVF) to find relevant vectors fast at scale. _(coming)_
- [ ] **Choosing a Vector Database** — Compare vector database options on indexing, filtering, hosting, and scale, and pick one for your workload. _(coming)_
- [ ] **Metadata Filtering in Retrieval** — Combine vector similarity with structured filters so retrieval respects permissions, dates, and categories. _(coming)_
- [ ] **Hybrid Search: Lexical and Vector Combined** — Blend keyword (BM25) and vector search so retrieval catches exact terms and paraphrases alike. _(coming)_
- [ ] **Query Rewriting and Expansion** — Rewrite vague or conversational queries into forms that retrieve better before the search even runs. _(coming)_
- [ ] **Reranking Retrieved Results** — Apply a second-pass reranker to reorder retrieved chunks by relevance before they reach the prompt. _(coming)_
- [ ] **Grounding Answers with Citations** — Attach retrieved sources to generated answers so users and evaluators can verify claims. _(coming)_
- [ ] **Building a RAG Pipeline End to End** — Wire ingestion, retrieval, reranking, and generation into one working pipeline. _(coming)_
- [x] **Evaluating RAG Quality** — Measure retrieval precision/recall and answer faithfulness so you know if a RAG change actually helped.
- [ ] **When RAG Is the Wrong Tool** — Recognize when long context, fine-tuning, or plain search beats RAG, and stop over-applying the pattern. _(coming)_

### 10 · Tools & Function Calling
_Give a model hands: design tool schemas it can call correctly, execute them safely, and handle the ways tool calling breaks._

- [x] **What Is Tool Calling** — Understand how a model requests a function call instead of just generating text, and how your code executes it.
- [x] **Designing a Tool Schema** — Define tool names, parameters, and types so the model calls your functions with valid, usable arguments.
- [x] **Writing Tool Descriptions Models Actually Follow** — Write tool and parameter descriptions precisely enough that the model picks the right tool and fills it in correctly.
- [ ] **Tool Choice and Forcing Tool Use** — Control whether the model can, must, or must not call a tool on a given turn. _(coming)_
- [ ] **Executing Tool Calls Safely** — Validate model-generated arguments before executing them against real systems. _(coming)_
- [ ] **Sandboxing Tool Execution** — Isolate tool execution — filesystem, network, and shell — so a model's tool call can't do unbounded damage. _(coming)_
- [ ] **Returning Tool Results to the Model** — Format tool outputs so the model can reason over them correctly on the next turn. _(coming)_
- [ ] **Handling Tool Errors and Retries** — Surface a failed tool call back to the model in a way that lets it recover instead of looping. _(coming)_
- [ ] **Parallel Tool Calls** — Let the model call multiple independent tools in one turn and merge their results. _(coming)_
- [ ] **Sequential, Multi-Step Tool Use** — Chain tool calls across turns so the model can plan, act, observe, and act again. _(coming)_
- [ ] **Structured Output vs. Tool Calls** — Choose between a tool call and a structured JSON response mode for extracting data without side effects. _(coming)_
- [ ] **Common Tool-Calling Failure Modes** — Recognize hallucinated arguments, wrong tool selection, and infinite tool loops, and know the fix for each. _(coming)_
- [ ] **Testing and Debugging Tool Calls** — Log, replay, and unit test tool-calling flows so failures are debuggable instead of mysterious. _(coming)_

### 11 · MCP
_The protocol that lets any AI app plug into any tool or data source: servers, primitives, transports, auth, and running MCP in production._

- [x] **What Is MCP** — Understand what MCP standardizes — a common protocol between AI apps and external tools and data — and why it beats one-off integrations.
- [x] **Your First MCP Server** — Build and run a minimal MCP server, expose one tool, and connect a client to call it.
- [x] **MCP Architecture: Hosts, Clients, Servers** — Map the host, client, and server roles in MCP and how a request travels between them.
- [x] **MCP Tools, Resources, and Prompts** — Distinguish MCP's three primitives — tools to call, resources to read, and prompts to reuse — and when a server should expose each.
- [ ] **MCP Transports: stdio vs. HTTP** — Choose between stdio and HTTP/SSE transports based on where the server runs and who connects to it. _(coming)_
- [ ] **Connecting a Client to an MCP Server** — Configure a host application to discover and connect to an MCP server, and verify the handshake. _(coming)_
- [ ] **MCP Tool Discovery and Schemas** — See how a client lists a server's tools and schemas at connection time and passes them to the model. _(coming)_
- [x] **MCP and the Context Window** — How every connected MCP server's tools and schemas consume context budget, and how to keep that footprint small.
- [ ] **MCP Auth Fundamentals** — Add authentication to an MCP server so only permitted clients and users can call its tools. _(coming)_
- [x] **The Agent That Dies Overnight: OAuth** — Why a long-running agent's MCP connection silently breaks when an OAuth token expires, and how to keep it authenticated.
- [ ] **Securing MCP Servers Against Prompt Injection** — Treat data returned from MCP resources and tools as untrusted input and defend against injected instructions. _(coming)_
- [ ] **Inspecting and Testing MCP Servers** — Use the MCP Inspector and manual probes to verify a server's tools, resources, and prompts before shipping it. _(coming)_
- [ ] **MCP Registries and Discovery** — Publish and find MCP servers through registries instead of hardcoding connection details. _(coming)_
- [ ] **Versioning MCP Servers Without Breaking Clients** — Change a server's tools and schemas over time without breaking clients already connected to it. _(coming)_
- [ ] **Running MCP Servers in Production** — Handle deployment, logging, monitoring, and uptime for an MCP server serving real traffic. _(coming)_
- [ ] **Debugging Common MCP Failures** — Diagnose the most frequent MCP failures — silent tool errors, schema mismatches, transport drops — and fix each. _(coming)_

## Agentic


### 12 · Agentic AI
_What an agent actually is, the loop that makes one work, and when to reach for one instead of a plain prompt or workflow._

- [x] **What Makes Something an Agent** — Distinguish an agent from a chatbot or single LLM call by autonomy, goal pursuit, and the ability to take multiple self-directed steps.
- [x] **The Agent Loop: Sense, Think, Act** — The observe-reason-act cycle agents run through repeatedly, and the stop conditions that decide when the loop ends.
- [ ] **Giving Agents Tools** — How an agent calls external functions or APIs, parses their results, and feeds them back into its next decision. _(coming)_
- [x] **ReAct: Interleaving Reasoning and Acting** — The ReAct pattern of alternating thought and action steps, and why it curbs hallucination compared to pure chain-of-thought.
- [ ] **Planning Before Acting** — Plan-and-execute architectures that break a goal into ordered subtasks before any tool call happens. _(coming)_
- [ ] **Short-Term vs Long-Term Memory** — Separating an agent's working context from persistent memory it carries across sessions, like files, summaries, or a vector store. _(coming)_
- [ ] **Reflection: Letting an Agent Grade Itself** — Adding a self-critique step where the agent evaluates its own output and decides whether to retry or revise. _(coming)_
- [ ] **Recovering When Tools Fail** — Designing retry logic, backoff, and fallback paths for malformed tool calls and failed API responses. _(coming)_
- [ ] **Multi-Agent Patterns: Orchestrator, Pipeline, Debate** — Common topologies for splitting work across specialized agents, and which topology fits which kind of task. _(coming)_
- [ ] **Choosing an Orchestration Framework** — What frameworks like LangGraph and CrewAI actually add over a hand-rolled loop, and how to pick one for your use case. _(coming)_
- [ ] **Setting the Autonomy Dial** — Choosing where an agent sits between fully autonomous and human-approved-every-step, as a deliberate design decision. _(coming)_
- [x] **When a Workflow Beats an Agent** — Recognizing tasks where a deterministic pipeline or a single prompt is more reliable and cheaper than an agent loop.
- [ ] **Diagnosing Agent Failure Modes** — Recognizing loops, tool misuse, and context drift as they happen so you can fix them during development. _(coming)_
- [ ] **Reading an Agent's Trace** — Inspecting step-by-step traces and logs to debug agent behavior before you ever write a formal eval. _(coming)_

### 13 · Harness Design
_The engineering scaffold — control loop, tool routing, policy, sandboxing, state — that turns a raw model into a working, controllable agent._

- [x] **The Harness: Everything Around the Model** — Define the harness as the code that turns a raw LLM into a working agent: the loop, tool router, policy layer, and prompt assembly.
- [x] **Building the Control Loop** — How a harness implements read-plan-act-observe in code, turning model output into tool calls and feeding results back in.
- [ ] **Routing Tool Calls to Real Code** — How a harness maps a model's tool-call request to an actual function implementation, including schema validation and dispatch. _(coming)_
- [ ] **Composing the System Prompt at Runtime** — Assembling the system prompt from static instructions, dynamic context, and tool schemas without blowing the token budget. _(coming)_
- [x] **Deny-Floors: Rules No Prompt Can Override** — Hard-coded refusal and permission rules enforced outside the model's control, as the floor no jailbreak or instruction can talk it past.
- [x] **Allow/Ask/Deny: Designing Approval Gates** — Designing allow, ask, and deny rules for tool calls, and where human-in-the-loop approval fits into the control loop.
- [ ] **Running Agents Headless from a Terminal** — Building agents that run non-interactively from a terminal or CI pipeline, with no chat UI or human in the loop. _(coming)_
- [ ] **Sandboxing Tool Execution in a Harness** — Running risky tool calls, especially shell and code execution, in isolated subprocesses to contain the blast radius of a mistake. _(coming)_
- [ ] **Checkpointing Long-Running Agent State** — Persisting an agent's conversation state and progress so a long task can pause, crash, and resume without starting over. _(coming)_
- [ ] **Streaming Tokens and Tool Events** — Streaming tokens and tool-call events to a UI or log in real time instead of blocking on a full completion. _(coming)_
- [ ] **Guardrails as Code, Not Prose** — Encoding safety and behavior constraints as testable schemas and validators rather than instructions the model might ignore. _(coming)_
- [ ] **Managing Context Inside a Long Session** — Techniques a harness uses to trim, summarize, or page conversation history so long-running sessions don't exceed the window. _(coming)_
- [ ] **Delegating Work to Subagents** — How a harness spawns subagents or subprocesses for subtasks and merges their results back into the parent loop. _(coming)_
- [ ] **Logging Every Step for Debuggability** — Structured logging and tracing of each loop iteration so failures can be diagnosed after the fact, not just guessed at. _(coming)_

### 14 · Evals & Red-teaming
_How to measure whether your agent actually works, and how to break it before an attacker does._

- [x] **Why Vibes-Based Iteration Breaks Down** — What evals buy you over eyeballing outputs: reproducibility, regression detection, and a number you can argue about.
- [x] **Building a Golden Dataset** — Curating a representative, labeled set of inputs and expected outputs to test a prompt or agent against.
- [ ] **Offline Evals vs Production Monitoring** — Distinguishing pre-deployment test-suite evals from live evals that watch real traffic after you ship. _(coming)_
- [ ] **Choosing Metrics That Actually Measure Success** — Picking between exact match, rubric scoring, and task success rate, and matching the metric to the failure mode you care about. _(coming)_
- [ ] **LLM-as-Judge: Grading Outputs with a Model** — Using a second LLM to score outputs against a rubric, and the calibration and self-preference biases that come with it. _(coming)_
- [ ] **Turning Bugs into a Regression Suite** — Converting past failures into permanent test cases that run on every prompt or code change, like CI for an agent. _(coming)_
- [ ] **Designing a Human Review Workflow** — Writing rubrics, sampling strategically, and checking inter-rater agreement for judgments too expensive to fully automate. _(coming)_
- [ ] **Shipping Changes by Eval Diff** — The change-eval-diff-ship loop, and treating a score delta between runs like a diff you review before merging. _(coming)_
- [x] **Prompt Injection: When Content Becomes Instructions** — What prompt injection is and how untrusted content in tool outputs or web pages can hijack an agent's behavior.
- [ ] **Common Jailbreak Techniques and Their Defenses** — Recognizable jailbreak patterns like roleplay framing, encoding tricks, and multi-turn erosion, and how models and harnesses resist them. _(coming)_
- [ ] **Testing for Scope Escape** — Probing whether an agent can be manipulated into using its tools outside their intended purpose, like a read tool used to exfiltrate data. _(coming)_
- [ ] **Running a Structured Red-Team Exercise** — Threat modeling your own agent, building attack trees, and writing up findings the way a security team would. _(coming)_
- [ ] **Automating Adversarial Probes** — Using fuzzing and automated adversarial-prompt generators to continuously test an agent for regressions between releases. _(coming)_
- [ ] **Tracking Eval Scores Across Model Versions** — Dashboarding eval and red-team results over time and model versions so regressions are visible instead of anecdotal. _(coming)_

## Production


### 15 · Production & Ops
_Run AI features like real infrastructure: observe every call, control the bill, and know exactly what to do the moment something breaks._

- [x] **Log Every LLM Call as Structured Data** — Capture prompts, completions, token counts, latency, and metadata in queryable structured logs instead of raw text dumps.
- [ ] **Redact PII Before It Hits Your Logs** — Strip or mask personal data from prompts and completions before they're logged, cached, or sent to a third-party model provider. _(coming)_
- [x] **Track Cost Per Request and Per User** — Attribute token spend to features, users, and prompts so you see where the money goes before the invoice does.
- [ ] **Cache Prompts and Responses to Cut Cost** — Use exact-match and semantic caching to skip redundant model calls, cutting both latency and spend. _(coming)_
- [ ] **Trace Multi-Step Agent and RAG Pipelines** — Instrument chains, tool calls, and retrieval steps with distributed tracing so you can see exactly where a pipeline went wrong. _(coming)_
- [ ] **Catch Regressions with Evals in CI** — Build a regression suite of prompts and expected behaviors that runs in CI before any prompt or model change ships. _(coming)_
- [ ] **Set SLOs for Latency, Cost, and Quality** — Define measurable service-level objectives for an AI feature and alert before users notice degradation. _(coming)_
- [ ] **Rate-Limit and Add Backpressure to LLM Traffic** — Protect upstream model APIs and your budget with per-user rate limits, request queuing, and graceful degradation under load. _(coming)_
- [ ] **Canary and Shadow-Test Prompt or Model Changes** — Roll a new prompt or model to a small slice of traffic, or run it silently alongside production, before a full switch. _(coming)_
- [x] **Put a Kill Switch on Every AI Feature** — Wrap AI features behind flags you can disable instantly, and design a safe fallback for when you do.
- [ ] **Write an On-Call Playbook for AI Failures** — Define AI-specific alert thresholds and runbooks for failure modes that don't look like a normal outage, like silent quality drops or cost spikes. _(coming)_
- [ ] **Run a Postmortem After a Model Incident** — Investigate bad outputs, cost blowouts, and provider outages with a blameless postmortem that fixes the system, not just the prompt. _(coming)_
- [ ] **Set a Data Retention Policy for AI Systems** — Decide what user data an AI feature can store, for how long, under GDPR/CCPA and provider zero-retention terms. _(coming)_
- [ ] **Monitor Production Traffic for Prompt Injection and Abuse** — Detect jailbreak attempts, injection patterns, and abusive usage in live traffic instead of relying only on the guardrail layer. _(coming)_

### 16 · Fine-tuning & Optimization
_Know when specializing a model beats a better prompt, then fine-tune, shrink, and serve it efficiently once you do._

- [x] **Decide: Fine-Tune, Prompt, or RAG?** — A decision framework for when fine-tuning actually beats better prompting or retrieval, and when it's a waste of money.
- [ ] **Choose a Base Model to Fine-Tune** — Match open-weight base model size, license, and architecture to your task, hardware, and deployment target. _(coming)_
- [x] **Build a Fine-Tuning Dataset That Works** — Collect, format, and clean example pairs, instruction/output or preference pairs, into a dataset that will actually move the model.
- [ ] **Generate Synthetic Training Data with a Larger Model** — Bootstrap and augment a training set with a stronger model when you don't have enough real examples, and avoid it collapsing on itself. _(coming)_
- [ ] **Full Fine-Tuning vs Parameter-Efficient Fine-Tuning** — Compare updating every weight against parameter-efficient methods, and why PEFT wins for almost every practitioner use case. _(coming)_
- [x] **Fine-Tune with LoRA and QLoRA** — How low-rank adapters work, what rank and alpha to pick, and how QLoRA fine-tunes a quantized base model on a single GPU.
- [ ] **SFT vs Preference Tuning (DPO/RLHF)** — The difference between teaching a model a task with supervised fine-tuning and aligning its behavior with preference-based methods like DPO. _(coming)_
- [ ] **Set Hyperparameters for a Fine-Tuning Run** — Learning rate, epochs, batch size, and warmup choices that separate a model that learns from one that overfits or forgets. _(coming)_
- [ ] **Diagnose Catastrophic Forgetting and Overfitting** — Recognize when a fine-tune has lost general capabilities or memorized the training set instead of learning the task. _(coming)_
- [ ] **Evaluate a Fine-Tuned Model Before Shipping** — Benchmark task performance and check for regressions against the base model before a fine-tune goes live. _(coming)_
- [ ] **Quantize a Model: GGUF, AWQ, and GPTQ** — Shrink a fine-tuned model to run faster and cheaper with post-training quantization, and how to pick a format and bit-width. _(coming)_
- [ ] **Distill a Large Model into a Small One** — Train a small, cheap model to mimic a larger one's outputs on a narrow task, and know when distillation beats fine-tuning small directly. _(coming)_
- [ ] **Optimize Inference Serving: Batching and KV Cache** — Speed up and cheapen serving with continuous batching, KV cache reuse, and serving frameworks like vLLM or TGI. _(coming)_
- [ ] **Merge and Version LoRA Adapters** — Merge adapters into a base model or swap them at serving time, and manage versions across multiple fine-tuned variants. _(coming)_

## Role learning paths


### Developer
For software engineers adding LLM features to real apps. Runs from a working mental model of what models do, through prompting, structured output, and tool calling, out to shipping and operating a feature under real load.

Path: how-llms-work → what-llms-can-and-cannot-do → system-vs-user-prompts → anatomy-of-a-genai-feature → why-structured-output → what-is-tool-calling → streaming-responses-to-the-ui → rate-limits-and-retry-strategies → shipping-your-first-end-to-end-app → feature-flags-and-kill-switches

### ML Engineer
For ML engineers who need the internals, not just the API. Covers the maths and architecture that make transformers work, then the full decision path from fine-tuning through evaluation and cost tracking.

Path: gradient-descent-intuition → ai-vs-ml-vs-deep-learning → next-token-prediction → the-transformer-architecture → attention-mechanism-explained → fine-tune-vs-prompt-vs-rag → building-a-fine-tuning-dataset → lora-and-qlora-fine-tuning → building-a-golden-dataset → token-and-cost-tracking

### Data Scientist
For data scientists using LLMs for extraction, classification, and analysis. Emphasizes embeddings, structured outputs, and retrieval, plus measuring quality rather than trusting vibes.

Path: how-llms-work → what-is-a-vector → cosine-similarity → embeddings-and-semantic-similarity → why-structured-output → json-schema-for-outputs → what-is-rag-and-when-to-use-it → why-evals-matter → building-a-golden-dataset → why-models-hallucinate

### Product Manager
For PMs shaping AI features. Builds a grounded sense of what models can and can't do, what they cost, and where reliability, retrieval, and evals fit into a shipping plan.

Path: how-llms-work → what-llms-can-and-cannot-do → tokens-context-cost → choosing-a-model → why-models-hallucinate → when-not-to-use-an-agent → what-is-rag-and-when-to-use-it → why-evals-matter → feature-flags-and-kill-switches

### Founder
For founders building AI-native products. Balances a fast build path with the cost, reliability, and evaluation decisions that determine whether the thing survives contact with real users.

Path: what-llms-can-and-cannot-do → choosing-a-model → tokens-context-cost → anatomy-of-a-genai-feature → what-is-rag-and-when-to-use-it → fine-tune-vs-prompt-vs-rag → shipping-your-first-end-to-end-app → why-evals-matter → token-and-cost-tracking → feature-flags-and-kill-switches

### CEO
For executives who need a real mental model, not hype. Focuses on capabilities, limits, cost structure, and the risk and reliability questions that shape company-level bets.

Path: ai-vs-ml-vs-deep-learning → how-llms-work → what-llms-can-and-cannot-do → tokens-context-cost → why-models-hallucinate → what-is-an-agent → why-evals-matter → feature-flags-and-kill-switches

### Designer
For product and UX designers working on AI features. Covers how models behave, why they fail, and the interaction patterns — streaming, uncertainty, structure — that make an AI feature feel reliable.

Path: how-llms-work → what-llms-can-and-cannot-do → why-models-hallucinate → designing-chat-ux → streaming-responses-to-the-ui → teaching-models-to-say-i-dont-know → system-vs-user-prompts → when-not-to-use-an-agent

### Content Creator
For writers and creators using LLMs day to day. Focuses on reliable prompting techniques, controlling tone and structure, and grounding output so the model stops fabricating.

Path: how-llms-work → tokens-context-cost → answer-first-prompting → system-vs-user-prompts → few-shot-prompting → chain-of-thought-prompting → why-models-hallucinate → grounding-with-source-documents

### Marketer
For marketers embedding AI in their workflow. Combines practical prompting and grounding with an honest read on hallucination risk and what to verify before anything ships.

Path: how-llms-work → what-llms-can-and-cannot-do → system-vs-user-prompts → few-shot-prompting → answer-first-prompting → why-models-hallucinate → grounding-with-source-documents → what-is-rag-and-when-to-use-it

### Security Engineer
For security engineers responsible for AI systems. Covers the agent and harness attack surface, prompt injection, policy enforcement, and monitoring untrusted input in production.

Path: how-llms-work → what-is-tool-calling → what-is-an-agent → deny-floors-and-policy-layers → permission-and-approval-systems → prompt-injection-basics → what-is-mcp → structured-logging-for-llm-calls → feature-flags-and-kill-switches

### Student
For students and career-switchers starting fresh. Runs from the core maths and how models learn, through how LLMs actually work, up to building and evaluating a first real feature.

Path: what-is-a-vector → the-softmax-function → gradient-descent-intuition → ai-vs-ml-vs-deep-learning → what-is-a-neural-network → tokenization-explained → next-token-prediction → how-llms-work → system-vs-user-prompts → anatomy-of-a-genai-feature → why-evals-matter