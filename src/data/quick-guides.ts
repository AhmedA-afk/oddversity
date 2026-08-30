/**
 * Quick Guides — one dense page that condenses a whole track.
 *
 * The page is composed, not generated: the module distillations below are
 * authored, and the lesson links come from the curriculum. A track with no
 * entry here simply has no Quick Guide — an empty one would be worse than none.
 *
 * `modules` is keyed by the module name in `modules.ts`. A key that no longer
 * matches is dropped at render time rather than shown against the wrong lessons.
 */
export interface QuickGuide {
  /** Reading time for the quick guide itself, not the track. */
  minutes: number;
  /** The one-paragraph answer to "what is this track for". */
  opening: string;
  /** Module name → the two or three sentences that module establishes. */
  modules: Record<string, string>;
  /** The three lessons that carry the most weight, as track-relative slugs. */
  essential: Array<{ slug: string; why: string }>;
  /** Stated plainly, because every curriculum has edges. */
  notCovered: string;
}

export const quickGuides: Record<string, QuickGuide> = {
  rag: {
    minutes: 10,
    opening:
      'Retrieval-augmented generation answers a question by finding the passages that plausibly contain the answer and putting them in the prompt. Everything hard about it lives in the finding, not the answering — which is why most of this track is about retrieval quality and only a small part is about generation.',
    modules: {
      'The whole game':
        'The pipeline is parse → chunk → embed → index → retrieve → rerank → answer, and every stage can fail in a way that looks like a model problem. Learn the shape first so you can locate a bug rather than guess at it.',
      Chunking:
        'A chunk is the unit you embed and the unit you hand back to the model, so the boundary decides what a passage still means once it is alone. Split on the document’s own structure — headings, paragraphs, table rows with their headers — and treat size as the fallback, not the strategy. Overlap protects facts from being severed; it is not a quality dial.',
      'Vector retrieval':
        'Embeddings put similar meaning near each other in one model’s space, and cosine similarity measures the angle between them. ANN indexes trade a little recall for a lot of speed. The failure to expect: dense vectors compress, and rare exact tokens — product codes, error strings, version numbers — are the first thing compression discards.',
      'Vector databases':
        'A vector store is a scale decision, not a quality one. You need one when the corpus stops fitting comfortably in memory, or when you need filtering, replication and incremental updates. Sizing is dominated by dimension count and index type, not by row count alone.',
      'Hybrid search and filtering':
        'Running keyword search alongside vector search and merging the rankings is the single highest-value upgrade for most real corpora, because the two are strong in opposite places. Metadata filters are also where per-user permissions live — the one requirement no amount of prompting or fine-tuning can satisfy.',
      'Query rewriting and reranking':
        'Rewriting fixes the query before retrieval; reranking fixes the ordering after it. A cross-encoder scoring thirty candidates and keeping five costs latency and buys precision — usually a better use of context budget than sending more chunks. Neither can conjure a passage retrieval never found.',
      'Grounding and evaluation':
        'An answer is grounded when every claim traces to a supplied passage, and the system says so plainly when the passages do not answer the question. Evaluate retrieval separately from generation: recall at k tells you the ceiling, and answer quality can never exceed it.',
      'Beyond basic RAG':
        'Parent-document and contextual retrieval, multi-vector, GraphRAG, agentic and corrective loops each address a specific weakness in the basic pipeline. Reach for them after you have measured which weakness you actually have — most systems that adopt them early were fixing chunk boundaries all along.',
      'Foundations and capstone':
        'The consolidated reference pages, and a capstone that builds a grounded support bot end to end with an eval set attached.',
    },
    essential: [
      { slug: 'chunking-strategies-for-documents', why: 'The boundary decision that most quietly determines whether retrieval works' },
      { slug: 'hybrid-search-lexical-and-vector', why: 'The single largest quality upgrade for most real corpora' },
      { slug: 'evaluating-rag-quality', why: 'Retrieval recall is your accuracy ceiling; measure it before tuning anything' },
    ],
    notCovered:
      'Building or fine-tuning your own embedding model, and running a vector database as infrastructure. Both are covered from the caller’s side only.',
  },

  'agentic-ai': {
    minutes: 9,
    opening:
      'An agent is a loop in which a model chooses the next action until a goal is met. The loop itself is about forty lines; the difficulty is entirely in the constraints around it — what it is allowed to do, when it stops, and what happens when it is wrong.',
    modules: {
      'What an agent is':
        'The distinction from a workflow is who picks the next step. If you wrote the sequence, it is a workflow — cheaper, more predictable, easier to debug. Agents earn their cost only when the path genuinely cannot be known in advance.',
      'Planning and memory':
        'Planning decomposes a goal into steps the loop can act on; memory decides what survives between them. State is what the current run needs to continue; memory is what carries across runs. Conflating the two is the usual source of an agent that forgets the thing it needed and remembers the thing it did not.',
      'Orchestration and control':
        'Multi-agent designs buy context isolation — a subagent can burn its own window and return a summary — and pay in cost, latency and failure modes. The honest default is one agent until you can name the reason for a second.',
      'Failure and evaluation':
        'Agents fail in a small, recurring set of ways: looping on the same call, ignoring a tool error, wandering off the goal, and stopping too early. Every loop needs a turn limit, a token budget and a no-progress detector, because only the first is obvious.',
      'Advanced architectures':
        'Hierarchical decomposition, persistent memory, subagent context isolation and framework selection — the moves that matter once one agent with a flat loop stops being enough.',
      'Frontier patterns':
        'Blackboard and swarm coordination, tree search over plans, agent-to-agent protocols, benchmarks and cost-aware loops. Read these to know what exists; adopt them only against a measured problem.',
      Foundations: 'The consolidated reference pages on the workflow/agent line and on state, memory and recovery.',
    },
    essential: [
      { slug: 'the-agent-loop', why: 'Read this once and every framework afterwards stops being magic' },
      { slug: 'when-not-to-use-an-agent', why: 'The cheapest decision in the track is often not to build one' },
      { slug: 'stopping-conditions-for-agents', why: 'The guards that separate a demo from something you can leave running' },
    ],
    notCovered:
      'Training or fine-tuning models for agentic behaviour, and the research literature on planning. This track is about building agents from models that already exist.',
  },

  mcp: {
    minutes: 9,
    opening:
      'The Model Context Protocol is an adapter standard: a server exposes tools, resources and prompts, and any compliant client can use them. It exists to kill the M×N problem, where every assistant needs a bespoke connector to every tool.',
    modules: {
      'What MCP is':
        'Three primitives do the work. Tools are actions the model can request; resources are content a client can read without an action; prompts are workflows the server ships for itself. Getting a capability into the right primitive is most of good server design.',
      'Primitives in depth':
        'One capability built as a tool, as a resource and as a prompt, with the turn count and failure mode of each. The rule that falls out: if the model must spend a turn calling something merely to know it, that thing is a resource — and the tool that gets called identically every conversation is the classic tell.',
      'Transports and clients':
        'Local servers speak over stdio, which has one consequence people hit immediately: anything written to stdout corrupts the protocol stream, so logging goes to stderr. Remote servers use streamable HTTP, and the session lifecycle is where most integration bugs live.',
      'Auth and security':
        'Access tokens expire, usually within the hour, and a server that fetches one at startup goes silent overnight. Refresh ahead of expiry and persist rotated refresh tokens. Treat every tool argument as attacker-influenced, because it came from a model reading text you did not write.',
      'Testing and shipping':
        'The inspector is faster to iterate against than a chat window. One integration test that starts the server, lists the tools and calls each one catches most of what actually breaks. Absolute paths in the client config — a relative path is the most common silent startup failure.',
      'The full primitive set':
        'Roots, sampling, elicitation, resource subscriptions and structured tool output — the parts of the protocol most servers never touch, and the ones that make a server feel native when they are used well.',
      'Multi-server and trust':
        'Once a client holds several servers, tool-schema overhead, name collisions and supply-chain trust all become real. Every tool’s schema is re-sent on every request, so few sharp tools beat many vague ones.',
      'Protocol reference': 'The consolidated lifecycle, transport and permission reference pages.',
    },
    essential: [
      { slug: 'first-mcp-server', why: 'The shortest path to a working server you can point a real client at' },
      { slug: 'agent-dies-overnight-oauth', why: 'The failure that passes every demo and breaks at 3am' },
      { slug: 'mcp-context-window', why: 'Tool schemas are a standing tax on every request; most servers ship too many' },
    ],
    notCovered:
      'Writing an MCP client from scratch beyond the basics, and the specification’s wire format at byte level. Both are linked out to the official docs.',
  },

  'prompt-engineering': {
    minutes: 9,
    opening:
      'Prompt engineering is the cheapest lever available and the first to exhaust before reaching for retrieval or fine-tuning. Most of it is unglamorous: state the task, give examples, specify the format, and name the failure you keep seeing.',
    modules: {
      'Prompt anatomy':
        'Put the answer requirement first, separate system from user instructions, and delimit anything the model should treat as data rather than instruction. Role prompting helps less than people expect and delimiters help more.',
      'Examples and reasoning':
        'Three good examples usually beat a paragraph of description, and examples covering edge cases beat examples covering the obvious. Chain-of-thought helps on multi-step problems by giving the model tokens to compute in — but the written steps are not a faithful record of how it got there.',
      'Reliability and iteration':
        'Templates and variables turn a prompt into something you can version and test. Anti-patterns — negative-only instructions, magic phrases, stacked contradictory rules — degrade quietly rather than failing loudly, which is why evaluation belongs here and not later.',
      'Prompts in production':
        'Prompts drift across model versions and providers, so pin versions, keep a changelog, and A/B test against an eval set rather than against a feeling. A prompt that worked is a dependency, not a constant.',
      'Advanced techniques':
        'Tree-of-thought, chain-of-density, meta-prompting and automatic optimisation. Real gains on narrow problems, real cost in tokens and latency — adopt against a measured gap.',
      'The fundamentals':
        'The consolidated pages on what prompting is, task framing, prompt patterns and structured output — the vocabulary the rest of the track assumes.',
      'Evaluation and reuse':
        'Building a tested prompt library, versioning it, and the capstone that turns ten prompts into something rubric-scored rather than vibe-checked.',
    },
    essential: [
      { slug: 'few-shot-prompting', why: 'Does most of what people expect fine-tuning to do, at zero training cost' },
      { slug: 'prompt-anti-patterns', why: 'The instructions that quietly make output worse' },
      { slug: 'prompt-evaluation-basics', why: '"It looks better" is not a result; this is how you get a number' },
    ],
    notCovered:
      'Jailbreaking and adversarial prompting, which live in the Evals and Red Teaming track, and provider-specific prompt caching, which lives in Production.',
  },

  'evals-red-teaming': {
    minutes: 9,
    opening:
      'An eval is a small dataset and a grader. It is what turns "the new prompt feels better" into a number that moves when quality moves — and red teaming is the same discipline pointed at what an attacker would do rather than what a user would do.',
    modules: {
      'Why evals matter':
        'Without a dataset you are not iterating, you are wandering: you cannot tell an improvement from a change that fixed three cases and broke twenty you never look at. Twenty rows and a deterministic grader beat an elaborate framework you never populate.',
      'Judges and regression suites':
        'Use the cheapest grader that can decide the case — string match, schema validity and length bounds go further than people expect. A model judge is for the properties a string match cannot reach, and it needs calibrating against human grades before you trust the number.',
      Attacks:
        'Prompt injection changes what the system does; jailbreaking changes what the model will say. They overlap in technique and differ in target, and an application can be resistant to one and wide open to the other. Scope escape and tool abuse are where injection becomes expensive.',
      'Making evals trustworthy':
        'Flaky evals, insufficient sample sizes, pairwise versus pointwise grading, judge bias and Goodharting. Every one of these produces a confident number that does not track quality — which is worse than no number.',
      'Evaluating agents and safety':
        'A trajectory is harder to grade than an answer: the same outcome can be reached well or badly. Safety and capability evals pull in different directions and need separate datasets and separate gates.',
      Foundations: 'The consolidated pages on datasets, rubrics, judges and release gating.',
    },
    essential: [
      { slug: 'building-a-golden-dataset', why: 'Every bug report is a row you have already paid for once' },
      { slug: 'llm-judge-bias-and-calibration', why: 'The judge prefers long, fluent and its own style; know before you trust it' },
      { slug: 'prompt-injection-basics', why: 'The attack that matters exactly as much as your tools are dangerous' },
    ],
    notCovered:
      'Formal verification and model-level safety research. This track is about evaluating and attacking systems you build on top of models.',
  },

  production: {
    minutes: 9,
    opening:
      'The gap between a working prototype and something you can leave running over a weekend is almost entirely operational, and none of it is exotic: timeouts, retries, logging, budgets, and a defined behaviour for when the provider is down.',
    modules: {
      Observability:
        'Log per request: an ID that also reaches the user-facing error, model and prompt version, token counts, latency, and the stop reason. The stop reason is the field people omit and then need — a completion truncated at the token limit looks like a short answer in the database and like a bug to the user.',
      'SLOs and limits':
        'Latency and cost budgets are design constraints, not reports. Rate limiting per user and per tenant belongs in front of the model, and any public unauthenticated surface will be scraped for free inference.',
      'Releases and incidents':
        'Canary and shadow releases, feature flags and kill switches, on-call playbooks and postmortems. Model versions move underneath you, so a version bump is a dependency upgrade: run the evals, read the diff, ship deliberately.',
      'Configuration and gateways':
        'Prompts are versioned configuration, not code constants. A gateway gives you one place to swap providers, enforce budgets and redact logs — and one place to fail, which is the trade.',
      'Cost and routing':
        'Classification, extraction and short rewrites rarely need your largest model. Move one request type down a tier, run the eval, keep the change if the score holds. Batch endpoints are meaningfully cheaper for anything not interactive.',
      'Resilience at scale':
        'Load shedding, graceful degradation, capacity planning for agentic traffic, escalation queues and provider failover. The unacceptable default is a spinner that never resolves, and it is the default if nobody chooses.',
      Foundations: 'The consolidated observability, cost, deployment and incident reference pages.',
    },
    essential: [
      { slug: 'structured-logging-for-llm-calls', why: 'You cannot debug next Tuesday’s complaint without this Monday’s logs' },
      { slug: 'load-shedding-and-graceful-degradation', why: 'Decide the degraded state before you need it, not during' },
      { slug: 'model-deprecation-and-version-pinning', why: 'The regression that arrives without you deploying anything' },
    ],
    notCovered:
      'Running model inference on your own hardware, which lives in the Fine-tuning track, and general web-application operations.',
  },

  'ai-literacy': {
    minutes: 8,
    opening:
      'This track is for using AI well without writing any code. It is mostly about judgement: deciding whether a task suits AI at all, reading output sceptically, and knowing what you are giving away when you paste something into a chat box.',
    modules: {
      'Deciding when to use AI':
        'Ordinary software beats AI whenever the rule is stable, visible and cheap to encode. AI earns its place when the input varies and a fixed rule cannot cover it. Getting this decision right saves more time than any prompting technique.',
      'How AI produces answers':
        'A language model predicts the next fragment of text, repeatedly, from patterns in what it has read. That single mechanism explains most of the surprising behaviour — why it sounds confident when wrong, why it invents citations, and why it is not a search engine.',
      'Judging and verifying output':
        'The one skill that matters most is checking. Learn what a hallucination actually is, how to verify a claim in under a minute, and which task types need which kind of check. Numbers and citations need more scrutiny than prose.',
      'Privacy, bias and ethics':
        'What you type may be stored, reviewed or used for training depending on the product and plan. Know what not to paste, where bias enters, and how to use AI in a way you would be comfortable explaining.',
      'Your first AI workflow':
        'Turn one recurring task into a bounded, repeatable workflow with a defined input, output and verification step.',
      'What AI actually is':
        'The vocabulary, the common myths, and an honest comparison with human thinking. Pattern prediction is not reasoning, and the difference shows up in predictable places.',
      'Everyday prompting':
        'Treat it as delegating to a capable, literal-minded new colleague: state the task, give context, show an example, say what good looks like. Vague requests produce vague output, and that is a specification problem, not a model problem.',
      'Cost, limits and expectations':
        'What free and paid tiers actually differ on, when a task is worth the money, and the real limits today — so you neither over-trust nor dismiss the tool.',
      'Capstone: a real task, end to end':
        'Run one real task from your own work through the whole loop, including verification, and write down what you would change.',
    },
    essential: [
      { slug: 'task-or-automation', why: 'The decision that saves the most time is often not to use AI' },
      { slug: 'the-single-most-important-skill-judging-output', why: 'Everything else depends on being able to tell good output from confident nonsense' },
      { slug: 'what-not-to-paste-into-ai', why: 'The mistake that is hardest to undo' },
    ],
    notCovered:
      'Any programming. If you want to build with these models rather than use them, start at LLM Foundations instead.',
  },

  'maths-foundations': {
    minutes: 12,
    opening:
      'The mathematics you need to reason about how AI systems compute, rather than only calling their APIs. It is deliberately split: a short essential lane you can read in an evening, then a full university-equivalent course underneath it.',
    modules: {
      'The essential maths for AI':
        'Vectors, dot products, cosine similarity, softmax, entropy and gradients — the twenty-odd ideas that appear in almost every explanation of how a model works. If you only ever read one module here, read this one.',
      'Single-variable calculus':
        'Derivatives as sensitivity, the chain rule, curvature and Taylor approximation. This is the machinery behind every training loop, introduced without assuming you remember school calculus.',
      'Decompositions and numerical linear algebra':
        'QR, eigendecomposition, SVD, PCA and kernels — plus conditioning and stability, which is where library calls quietly go wrong on real data.',
      'Assessed labs':
        'Twelve cumulative labs where you derive, implement, visualise and debug rather than read. The capstone builds a small ML system from the mathematics up.',
      'Mathematical language and computation':
        'Notation, shapes, axes, broadcasting, units and floating point. Most "the maths is wrong" bugs are actually shape or scale bugs, and this module is how you stop having them.',
      'Vector algebra and geometry':
        'Coordinates, norms, projections, orthogonality and margins — the geometry that embedding search and linear models both run on.',
      Optimisation:
        'Objectives, convexity, gradient descent and its variants, learning-rate schedules, conditioning and numerical stability. Enough to choose an optimiser deliberately and diagnose one that is not converging.',
      'Matrices, systems and solvers':
        'Matrices as maps and as data, multiplication and batching, rank and identifiability, and why solving a system beats inverting a matrix.',
      'Multivariable calculus and autodiff':
        'Gradients, Jacobians, Hessians, computational graphs, forward and reverse mode autodiff, and gradient checking. This is backpropagation, derived rather than asserted.',
      'Probability foundations':
        'Sample spaces, conditioning, independence, Bayes, expectation and variance. Base rates are the recurring theme, because ignoring them is the most common quantitative mistake in applied AI.',
      'Distributions and sampling':
        'The named distributions and what assumption each one encodes, plus Monte Carlo, the central limit theorem, and concentration — the basis of every uncertainty estimate you will report.',
      'Statistical inference and experiments':
        'Estimators, likelihood, confidence intervals, bootstrap, hypothesis tests, power and A/B experiments. How to make a claim from data without overclaiming.',
      'Information theory and probabilistic modelling':
        'Entropy, cross-entropy, KL divergence and mutual information — and why the loss function you already use is a probability claim.',
      'Specialist: signals, vision and audio':
        'Sampling, convolution, Fourier bases and spectrograms. Take this branch if you work with images or audio.',
      'Specialist: sequential decisions and RL':
        'Markov properties, MDPs, Bellman equations, temporal-difference learning and the offline-data warnings that matter in practice.',
      'Specialist: graphs':
        'Adjacency and Laplacian matrices, random walks, spectral clustering and message passing.',
      'Specialist: Bayesian and causal methods':
        'Posterior inference, conjugacy, MCMC, variational inference, Gaussian processes, and the identifiability limits of causal claims.',
    },
    essential: [
      { slug: 'cosine-similarity', why: 'The one formula behind every embedding search you will ever debug' },
      { slug: 'entropy-and-cross-entropy', why: 'Your loss function is a probability claim; this is the claim' },
      { slug: 'gradient-descent-intuition', why: 'The mechanism under every training run, without the notation tax' },
    ],
    notCovered:
      'Proof-heavy pure mathematics, and the research frontier. Everything here is selected because it shows up when building or debugging real systems.',
  },

  'python-data-apis': {
    minutes: 7,
    opening:
      'The Python you actually need around an AI system: clean data in, validated data out, secrets kept out of the repository, and a service boundary you can test. It assumes you can already write a function.',
    modules: {
      'Getting started':
        'The whole pipeline on one page — ingest, validate, transform, serve — so the later modules have somewhere to attach.',
      'Data contracts and cleaning':
        'A data contract is a schema plus the promise that violating it fails loudly. Validate at the boundary, clean deliberately, and never let a silently-coerced type reach a model.',
      'Environments and secrets':
        'Isolated environments and environment-loaded configuration. An API key in a notebook is the most common way a project becomes unshippable.',
      'Python data structures':
        'Lists, dicts, sets, comprehensions and generators, and how nested JSON actually behaves in memory — the difference between a pipeline that fits in RAM and one that does not.',
      'Files and data formats':
        'JSON, JSONL, Parquet and when each is the right choice. Columnar formats are not an optimisation detail once your corpus grows.',
      NumPy:
        'Arrays, indexing, broadcasting and normalisation. Every embedding operation you will write is a NumPy operation underneath.',
      pandas:
        'Grouping, aggregation and joins — the two or three operations that account for most real data work.',
    },
    essential: [
      { slug: 'data-contracts-and-validation', why: 'Failing loudly at the boundary prevents most downstream mysteries' },
      { slug: 'secrets-and-config-management', why: 'The mistake that makes a project unshareable' },
      { slug: 'numpy-indexing-and-broadcasting', why: 'Shape bugs are the most common numerical error in AI code' },
    ],
    notCovered:
      'Learning Python itself, web frameworks, and production data engineering. This is the slice that touches AI systems.',
  },

  'ai-foundations': {
    minutes: 8,
    opening:
      'The ground floor: what these systems are, how they learn, and a working mental model of what they can and cannot do. It is the shortest route to being able to read anything else on the site without hitting unfamiliar vocabulary.',
    modules: {
      'How models work':
        'How a large language model turns a request into text, what tokens cost you in context and money, and how to choose a model for a task rather than by reputation.',
      'The vocabulary':
        'AI, machine learning and deep learning are nested, not synonymous. Neural networks, supervised and self-supervised learning, and where the narrow/general distinction actually bites.',
      'Training and generalisation':
        'Training versus inference is the distinction that makes "the model learned from our chat" false for a normal API call. Overfitting, foundation models, training data and benchmarks — including what benchmarks systematically miss.',
      'What models can and cannot do':
        'The capability picture stated honestly, plus the agent/chatbot line and the classical task types that still matter.',
      'Inside the network':
        'Activations, loss functions, the bias-variance trade-off, splits and scaling laws — enough internals to read a model card without guessing.',
      'The wider picture':
        'Hardware, open versus closed weights, interpretability and the basics of alignment and safety.',
    },
    essential: [
      { slug: 'tokens-context-cost', why: 'The unit that determines what fits, what it costs and how slow it is' },
      { slug: 'training-vs-inference', why: 'Clears up more misconceptions than any other page here' },
      { slug: 'benchmarks-and-what-they-miss', why: 'How to read a model announcement without being sold to' },
    ],
    notCovered:
      'The mathematics, which lives in Maths Foundations, and transformer internals, which live in LLM Foundations.',
  },

  'llm-foundations': {
    minutes: 9,
    opening:
      'How large language models actually work, from tokenisation through attention to sampling. This is the track that turns "the model decided" into a sentence you can replace with a mechanism.',
    modules: {
      'From text to tokens':
        'Text becomes tokens before a model sees anything, and embeddings turn tokens into vectors. Both steps quietly determine cost, context limits and how the model handles rare words, names and code.',
      'The transformer':
        'Attention, positional encoding and the architecture that assembles them. The useful takeaway is what attention does — weight every position against every other — and what that costs as context grows.',
      'Training and generation':
        'Pretraining as next-token prediction, the context window as a hard per-request budget, sampling parameters as selection rather than knowledge, and instruction tuning as the step that makes a raw model helpful.',
      'The model landscape':
        'Emergent abilities, mixture of experts, model families and multimodality — how to place a new release without re-learning the field each time.',
      'Architecture internals':
        'Byte-pair encoding, multi-head attention, causal masking, feed-forward blocks, residual connections, rotary embeddings, the KV cache and grouped-query attention. Optional depth, but the KV cache in particular explains real latency behaviour.',
      'Frontier behaviour':
        'In-context learning, reasoning models and test-time compute, speculative decoding, and grokking. Where the field is currently moving and why.',
    },
    essential: [
      { slug: 'tokenization-explained', why: 'Explains cost, context limits and a surprising share of odd behaviour' },
      { slug: 'attention-mechanism-explained', why: 'The one mechanism the whole architecture is built around' },
      { slug: 'sampling-temperature-top-p', why: 'Temperature changes selection, not knowledge — a distinction people get wrong daily' },
    ],
    notCovered:
      'Training a model yourself, and the linear algebra underneath. Those are Fine-tuning and Maths Foundations respectively.',
  },

  'machine-learning': {
    minutes: 10,
    opening:
      'Classical machine learning, which still solves a large share of the problems people now reach for an LLM to handle. It is also where the evaluation discipline that AI engineering borrows was worked out.',
    modules: {
      'Framing the problem':
        'Most failed ML projects failed at framing. Establish the decision, the baseline, and how you will know it worked before touching a model — and be honest about leakage and missingness in the data.',
      'The maths you need':
        'The linear algebra, probability and optimisation that the model families below assume, at working depth rather than course depth.',
      'Core model families':
        'Linear and logistic regression, regularisation, trees, nearest neighbours, kernels and ensembles. Each with the assumption it makes and the way it fails when that assumption breaks.',
      'Evaluation and features':
        'Cross-validation, experimental design, imbalanced data, and feature pipelines. Getting the validation scheme wrong invalidates everything downstream, quietly.',
      'Unsupervised and specialised tasks':
        'Clustering, dimensionality reduction, anomaly detection, recommenders and time series — including why temporal data needs its own validation discipline.',
      'Interpreting and operating models':
        'Error analysis, fairness and subgroup evaluation, drift monitoring, reproducibility and serving. The half of the job that starts after the model works.',
      'Theory and capstone':
        'Learning theory, Bayesian and generative approaches, reinforcement learning, statistical testing, and a capstone that ends in a model card rather than an accuracy number.',
    },
    essential: [
      { slug: 'problem-framing-and-baselines', why: 'A baseline you can beat is worth more than a model you cannot explain' },
      { slug: 'features-leakage-and-missingness', why: 'Leakage is the most common reason a great validation score means nothing' },
      { slug: 'cross-validation-and-experimental-design', why: 'Get this wrong and every number after it is fiction' },
    ],
    notCovered:
      'Deep learning architectures in depth, and MLOps platform engineering. The bridge lesson points at both.',
  },

  'context-engineering': {
    minutes: 8,
    opening:
      'Prompt engineering is what you write. Context engineering is everything that ends up in the window alongside it — history, retrieved documents, tool results, instructions — and in what order. The discipline is mostly subtractive.',
    modules: {
      'What context engineering is':
        'The step up from prompting once a system assembles context from several sources. Relevance filtering, ordering and recency effects, and the retrieval-versus-stuffing decision, all under a token budget.',
      'Memory and compaction':
        'Conversations outgrow the window. Summarisation, sliding windows and the slow degradation known as context rot — what to compress, when, and what must never be compressed away.',
      'Assembling context':
        'Structured injection, merging multiple sources and handling long contexts deliberately, with a way to test the result rather than eyeballing it.',
      'How long contexts fail':
        'Attention is not uniform across the window: material in the middle is used less reliably than material at either end. Position is therefore a design decision, and token accounting is how you see what you actually sent.',
      'Memory systems and tools':
        'Structured memory stores, scratchpads, progressive tool disclosure, just-in-time loading, handoff between agents, and context poisoning — where a bad tool result contaminates everything after it.',
    },
    essential: [
      { slug: 'lost-in-the-middle', why: 'A large window is a ceiling, not a recommendation' },
      { slug: 'retrieval-vs-context-stuffing', why: 'The decision that determines whether you need a pipeline at all' },
      { slug: 'context-observability-and-token-accounting', why: 'You cannot manage a context you have never actually looked at' },
    ],
    notCovered:
      'Retrieval mechanics, which live in the RAG track. This track is about what happens to a passage after retrieval hands it over.',
  },

  'structured-outputs': {
    minutes: 7,
    opening:
      'Getting machine-parseable data out of a model, reliably. The short version: move the constraint out of the prose and into the decoder, then validate anyway — because a schema guarantees shape and never content.',
    modules: {
      'Getting structure at all':
        'Why asking for JSON in the prompt fails at exactly the rate that survives your testing, and what JSON mode and schema enforcement actually do differently.',
      'Designing schemas':
        'Enums beat free-text fields; nested and array shapes need deliberate design; field descriptions are passed to the model and are the cheapest place to disambiguate. Schema design is prompt design.',
      'Making it reliable':
        'Constrained decoding at the token level, validation and automatic repair, streaming partial structures, and the failure modes that survive all three — chiefly truncation that looks like a valid short answer.',
      'Harder schema shapes':
        'Optional and nullable fields under strict modes, discriminated unions, thinking-then-structuring, provider differences, incremental repair and schema versioning.',
      'Extraction at scale':
        'Evaluating structured output quality, grammar-constrained generation, and extraction from documents and images where the input is as unreliable as the output.',
    },
    essential: [
      { slug: 'constrained-decoding-under-the-hood', why: 'Understand this and malformed output stops being a probability you manage' },
      { slug: 'validation-and-auto-repair', why: 'One repair attempt, then fail loudly — the loop that does not burn money' },
      { slug: 'structured-output-failure-modes', why: 'The well-typed, confidently wrong value that passes every check' },
    ],
    notCovered:
      'Tool and function calling as an agentic mechanism, which is the Tools track. The overlap page explains where the line sits.',
  },

  hallucinations: {
    minutes: 8,
    opening:
      'Hallucination is not a bug awaiting a patch — it is what generation does when the most plausible continuation is not the true one. This track is about reducing the rate, detecting the residue, and designing systems that fail visibly rather than confidently.',
    modules: {
      'Why models hallucinate':
        'The mechanism, the risk factors that make it more likely, and the prompt shapes — leading questions, false premises — that actively invite it.',
      'Grounding and citation':
        'Supplying sources and requiring citation is the highest-leverage mitigation available, and it only works if the system can also say the sources do not answer the question. An explicit refusal string is doing real work.',
      'Detection and verification':
        'Self-verification, confidence and uncertainty signals, fact-checking pipelines and guardrails for high-stakes output. Verbalised confidence is weakly calibrated; treat it as a hint, not a measurement.',
      'The specific varieties':
        'Sycophancy, fabricated citations, invented package names, temporal errors past the knowledge cutoff, summarisation drift, fabricated tool calls and multi-hop compounding. Each has its own tell and its own fix.',
      'Uncertainty and escalation':
        'Designing the escalation path for uncertain answers, semantic entropy as a quantitative signal, calibration, and ensemble cross-checking.',
    },
    essential: [
      { slug: 'why-models-hallucinate', why: 'The mechanism, so the mitigations stop looking arbitrary' },
      { slug: 'teaching-models-to-say-i-dont-know', why: 'A refusal you can measure beats a fabrication you cannot' },
      { slug: 'citation-hallucination', why: 'The failure mode that most damages trust when it reaches a user' },
    ],
    notCovered:
      'Retrieval quality itself, which is the RAG track, and adversarially induced falsehoods, which are in Evals and Red Teaming.',
  },

  'genai-app-dev': {
    minutes: 9,
    opening:
      'Turning a model call into a feature real users can rely on. Almost all of the difficulty is in the boundary: streaming, budgets, retries, errors, secrets, and the state you keep between turns.',
    modules: {
      'Your first feature':
        'The anatomy of a GenAI feature, the first API call, streaming to a UI, and chat UX that does not pretend latency is zero.',
      'Cost, latency and limits':
        'Trimming history, prompt caching, latency and cost budgets as design constraints, and rate limits with a retry policy that does not amplify an outage.',
      'Reliability and safety':
        'Provider abstraction, secret handling, error paths and input validation — then shipping the whole thing end to end rather than the happy path.',
      'Beyond the first version':
        'SDK versus raw API, multimodal input, transport choices, multi-turn session state, and prompt versioning with a rollback you have actually tested.',
      'Operating the feature':
        'Feature flags, model routing and failover, background jobs for long work, human review queues, generative UI and client-side inference.',
      'Structure and tool authority':
        'The request lifecycle with structured output, and the authority question every tool-using feature has to answer.',
    },
    essential: [
      { slug: 'error-handling-for-llm-calls', why: 'The difference between a feature and a demo is what happens when the call fails' },
      { slug: 'prompt-caching-for-speed-and-cost', why: 'Largest saving available for the least work, if your prefix is stable' },
      { slug: 'shipping-your-first-end-to-end-app', why: 'Everything above, assembled once, with nothing hand-waved' },
    ],
    notCovered:
      'Retrieval and agent loops, which have their own tracks, and production operations, which is the Production track.',
  },

  'tools-function-calling': {
    minutes: 8,
    opening:
      'Tool calling is the mechanism where a model returns a structured request to run one of your functions and your code decides whether to comply. That gap — proposal, then decision — is where every permission check belongs.',
    modules: {
      'Tool calling basics':
        'What the model actually returns, how a schema is written, and why the description is the part that determines whether the right tool gets chosen. Forcing a specific tool is often the fix for a model that answers in prose instead.',
      'Executing safely':
        'Treat every argument as attacker-influenced, sandbox anything that runs code, return results the model can use, and surface the real error text — a generic failure string guarantees a retry loop.',
      'Multi-step and parallel use':
        'Parallel and sequential calls, where tool calling and structured output overlap, the recurring failure modes, and how to test tool calls deterministically.',
      'Schemas at scale':
        'Generating schemas from OpenAPI, the token cost of carrying them on every request, selection when there are many tools, and result caching.',
      'Advanced tool use':
        'Chaining into workflows, approval gates for sensitive actions, self-correction, benchmarking, code execution and computer use — plus versioning a schema without breaking callers.',
    },
    essential: [
      { slug: 'writing-tool-descriptions-models-follow', why: 'The highest-leverage text in the whole system, and usually an afterthought' },
      { slug: 'executing-tool-calls-safely', why: 'The model proposes; your code decides. This is that code' },
      { slug: 'approval-gates-for-sensitive-tools', why: 'The control that still holds when an injected instruction gets through' },
    ],
    notCovered:
      'The agent loop that calls tools repeatedly, which is Agentic AI, and MCP as an interoperability standard, which is its own track.',
  },

  'harness-design': {
    minutes: 8,
    opening:
      'The harness is the application layer around a model: state, permissions, budgets, routing, approvals, observability. The model is the interesting part; the harness is the part that makes it operable, and most production quality problems are harness problems.',
    modules: {
      'What a harness is':
        'The control loop, the tool registry, and prompt composition. Naming the layer is worth more than it sounds — it separates "the model was wrong" from "we let it do that".',
      'Permissions and isolation':
        'Deny floors, approval systems, headless operation and subprocess sandboxing. Policy that lives in code holds; policy that lives in a system prompt is a wish.',
      'State and streaming':
        'Checkpointing so a crash mid-loop is recoverable, streaming output without losing the ability to validate it, guardrails as code, and managing the context window as a first-class resource.',
      'Extension and configuration':
        'Subagent delegation, logging, hooks as extension points, layered configuration and truncating tool output before it eats the window.',
      'Control and scheduling':
        'Interrupts and cancellation, parallel tool scheduling, model routing with fallback, and crash recovery.',
      'Operating a harness':
        'Sandboxing technology choices, secret handling, observability, simulated tool environments for testing, and distributed orchestration.',
    },
    essential: [
      { slug: 'the-control-loop', why: 'The spine everything else in the track attaches to' },
      { slug: 'permission-and-approval-systems', why: 'Where authority is actually enforced, rather than requested' },
      { slug: 'state-and-checkpointing', why: 'The difference between a crash you resume and a crash you restart' },
    ],
    notCovered:
      'Agent reasoning strategies, which are in Agentic AI. This track is the container, not the contents.',
  },

  'fine-tuning': {
    minutes: 9,
    opening:
      'Fine-tuning teaches form far more reliably than it teaches fact. This track starts with the question most fine-tuning projects should have asked first — whether the gap is behaviour or knowledge — and only then gets into how.',
    modules: {
      'Should you fine-tune at all':
        'Fine-tune, prompt or retrieve. If the answer changes when the data changes, if you need citations, or if different users may see different things, retrieval is the answer and no amount of training will substitute. Then: choosing a base model and building the dataset.',
      Methods:
        'Full fine-tuning versus parameter-efficient methods, LoRA and QLoRA, and supervised versus preference tuning. For most applied work, LoRA is what "fine-tuning" now means in practice.',
      'Training and evaluation':
        'Catastrophic forgetting, overfitting, and evaluating a fine-tuned model against the base rather than against a feeling.',
      'Serving a fine-tuned model':
        'Quantisation, distillation, inference optimisation, and versioning adapters so a rollback is possible.',
      'Datasets and tooling':
        'Decontamination and deduplication — a benchmark score means nothing if the benchmark is in your training data — and choosing a training framework.',
      'Training at depth':
        'LoRA rank and target modules, learning-rate schedules, distributed training, and the memory optimisations that decide what fits on your hardware.',
      'Preference tuning and beyond':
        'RLHF and reward modelling, DPO and its relatives, fine-tuning for function calling, context-length extension, model merging, and the managed-versus-self-hosted decision.',
    },
    essential: [
      { slug: 'fine-tune-vs-prompt-vs-rag', why: 'The decision that saves most fine-tuning projects from existing' },
      { slug: 'lora-and-qlora-fine-tuning', why: 'What applied fine-tuning actually means today' },
      { slug: 'evaluating-a-fine-tuned-model', why: 'Without this you have a new model and no evidence it is better' },
    ],
    notCovered:
      'Pretraining from scratch, and GPU cluster operations. The distributed-training lesson covers the caller-facing parts only.',
  },
};
