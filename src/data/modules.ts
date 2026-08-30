import type { Track, TrackNode } from './curriculum';

/**
 * The module layer.
 *
 * Track nodes are already in pedagogical order, so a module is expressed as a
 * boundary: a name plus the slug it starts at. Everything from that slug until
 * the next boundary belongs to it. That keeps this file small, keeps it honest
 * (a module can never claim a lesson that moved), and means adding a lesson to
 * an existing module needs no edit here at all.
 *
 * Tracks with no entry render flat — below roughly eight lessons a module layer
 * adds chrome rather than navigation.
 */
export interface ModuleBoundary {
  name: string;
  startsAt: string;
}

export const moduleMap: Record<string, ModuleBoundary[]> = {
  'ai-literacy': [
    { name: 'Deciding when to use AI', startsAt: 'what-ai-can-and-cant-do-overview' },
    { name: 'How AI produces answers', startsAt: 'data-model-output-loop' },
    { name: 'Judging and verifying output', startsAt: 'uncertainty-and-verification' },
    { name: 'Privacy, bias and ethics', startsAt: 'data-privacy-provenance-and-policy' },
    { name: 'Your first AI workflow', startsAt: 'first-ai-workflow-capstone' },
    { name: 'What AI actually is', startsAt: 'what-ai-actually-is' },
    { name: 'Everyday prompting', startsAt: 'how-to-ask-ai-clearly' },
    { name: 'Cost, limits and expectations', startsAt: 'what-using-ai-actually-costs' },
    { name: 'Capstone: a real task, end to end', startsAt: 'run-a-real-task-end-to-end-with-verification' },
  ],

  'maths-foundations': [
    { name: 'The essential maths for AI', startsAt: 'what-is-a-vector' },
    { name: 'Single-variable calculus', startsAt: 'functions-mappings-and-composition' },
    { name: 'Decompositions and numerical linear algebra', startsAt: 'orthogonal-complements-and-projection-matrices' },
    { name: 'Assessed labs', startsAt: 'labs/a0-notation-and-tensor-shape-clinic' },
    { name: 'Mathematical language and computation', startsAt: 'scalars-arrays-tensors-axes-shapes-and-broadcasting' },
    { name: 'Vector algebra and geometry', startsAt: 'vectors-as-coordinates-features' },
    { name: 'Optimisation', startsAt: 'objectives-losses-empirical-risk-and-constraints' },
    { name: 'Matrices, systems and solvers', startsAt: 'matrices-as-data-tables-and-linear-maps' },
    { name: 'Multivariable calculus and autodiff', startsAt: 'partial-derivatives-and-coordinate-wise-sensitivity' },
    { name: 'Probability foundations', startsAt: 'sample-spaces-events-and-probability-axioms' },
    { name: 'Distributions and sampling', startsAt: 'bernoulli-binomial-hypergeometric-and-negative-binomial' },
    { name: 'Statistical inference and experiments', startsAt: 'descriptive-statistics-and-exploratory-analysis' },
    { name: 'Information theory and probabilistic modelling', startsAt: 'self-information-and-coding-intuition' },
    { name: 'Specialist: signals, vision and audio', startsAt: 's1-1-discrete-signals-sampling-and-aliasing' },
    { name: 'Specialist: sequential decisions and RL', startsAt: 's2-1-markov-property-and-state-design' },
    { name: 'Specialist: graphs', startsAt: 's3-1-graph-notation-adjacency-incidence-and-degree-matrices' },
    { name: 'Specialist: Bayesian and causal methods', startsAt: 's4-1-bayesian-posterior-inference-and-posterior-predictive-checks' },
  ],

  'python-data-apis': [
    { name: 'Getting started', startsAt: 'python-data-pipeline-whole-game' },
    { name: 'Data contracts and cleaning', startsAt: 'data-contracts-and-validation' },
    { name: 'Environments and secrets', startsAt: 'python-environments-and-venv' },
    { name: 'Python data structures', startsAt: 'python-data-structures-for-data-work' },
    { name: 'Files and data formats', startsAt: 'files-and-data-formats-overview' },
    { name: 'NumPy', startsAt: 'numpy-arrays-fundamentals' },
    { name: 'pandas', startsAt: 'groupby-and-aggregation' },
  ],

  'ai-foundations': [
    { name: 'AI systems, search, and reasoning', startsAt: 'ai-systems/101-ai-problem-framing-and-rational-action' },
    { name: 'Reliable, safe, and accountable AI', startsAt: 'reliable-ai/201-provenance-consent-and-data-rights' },
    { name: 'Applied AI and product decisions', startsAt: 'applied-ai/301-ai-product-discovery-outcomes-and-harm' },
    { name: 'How models work', startsAt: 'how-llms-work' },
    { name: 'The vocabulary', startsAt: 'ai-vs-ml-vs-deep-learning' },
    { name: 'Training and generalisation', startsAt: 'training-vs-inference' },
    { name: 'What models can and cannot do', startsAt: 'ai-agents-vs-chatbots' },
    { name: 'Inside the network', startsAt: 'activation-functions' },
    { name: 'The wider picture', startsAt: 'ai-hardware-stack' },
  ],

  'llm-foundations': [
    { name: 'From text to tokens', startsAt: 'tokenization-explained' },
    { name: 'The transformer', startsAt: 'attention-mechanism-explained' },
    { name: 'Training and generation', startsAt: 'pretraining-explained' },
    { name: 'The model landscape', startsAt: 'emergent-abilities-in-llms' },
    { name: 'Architecture internals', startsAt: 'byte-pair-encoding' },
    { name: 'Frontier behaviour', startsAt: 'in-context-learning' },
  ],

  'machine-learning': [
    { name: 'Orientation and problem framing', startsAt: 'ml-001-how-to-use-the-classical-ml-course' },
    { name: 'Data, features, and decisions', startsAt: 'ml-101-data-generating-processes' },
    { name: 'Maths, objectives, and generalisation', startsAt: 'linear-algebra-for-ml' },
    { name: 'Linear and generalised models', startsAt: 'linear-regression' },
    { name: 'Neighbours, kernels, trees, and ensembles', startsAt: 'nearest-neighbors-and-kernels' },
    { name: 'Unsupervised, sequence, and retrieval methods', startsAt: 'clustering-and-k-means' },
    { name: 'Evaluation, inference, causal questions, and fairness', startsAt: 'cross-validation-and-experimental-design' },
    { name: 'Interpretability and operating ML systems', startsAt: 'interpretability-and-error-analysis' },
    { name: 'Derivations and problem sets', startsAt: 'derivations/01-linear-regression-normal-equations-and-geometry' },
    { name: 'Assessed labs and capstone', startsAt: 'ml-701-project-brief-and-model-card-template' },
    { name: 'Research reproductions and public-data projects', startsAt: 'reproductions/adaboost-reproduction' },
    { name: 'Advanced synthesis lectures', startsAt: 'deep-lectures/901-linear-and-logistic-regression-from-objective-to-deployment' },
  ],

  'deep-learning': [
    { name: 'Programme orientation', startsAt: 'dl-001-how-to-use-the-deep-learning-program' },
    { name: 'Neural-network mechanics and optimisation', startsAt: 'core/101-tensors-shapes-and-broadcasting' },
    { name: 'Computer vision', startsAt: 'vision/201-images-tensors-and-data-contracts' },
    { name: 'Sequences, transformers, generation, and RL', startsAt: 'sequence-generative/301-sequence-representations' },
    { name: 'Engineering, assessed labs, and capstone', startsAt: 'practice/401-data-contracts-and-schema-audits' },
    { name: 'Concept recaps', startsAt: 'attention-and-transformers' },
  ],

  'classical-ai': [
    { name: 'Search, constraints, games, and planning', startsAt: 'search-planning/101-state-spaces-representation-actions-goals-and-costs' },
    { name: 'Knowledge, logic, and uncertainty', startsAt: 'knowledge-uncertainty/201-knowledge-representation-models-and-tradeoffs' },
    { name: 'Agents, robotics, and hybrid systems', startsAt: 'agents-robotics/301-agent-architectures-and-rationality' },
    { name: 'Original concept recaps', startsAt: 'search-and-planning' },
  ],

  'prompt-engineering': [
    { name: 'Prompt anatomy', startsAt: 'answer-first-prompting' },
    { name: 'Examples and reasoning', startsAt: 'few-shot-prompting' },
    { name: 'Reliability and iteration', startsAt: 'prompt-templates-and-variables' },
    { name: 'Prompts in production', startsAt: 'prompt-portability-across-models' },
    { name: 'Advanced techniques', startsAt: 'tree-of-thought-prompting' },
    { name: 'The fundamentals', startsAt: 'what-prompting-is' },
    { name: 'Evaluation and reuse', startsAt: 'prompt-evaluation' },
  ],

  'context-engineering': [
    { name: 'What context engineering is', startsAt: 'context-engineering-vs-prompting' },
    { name: 'Memory and compaction', startsAt: 'conversation-memory-and-state' },
    { name: 'Assembling context', startsAt: 'structured-context-injection' },
    { name: 'How long contexts fail', startsAt: 'context-window-anatomy' },
    { name: 'Memory systems and tools', startsAt: 'structured-memory-stores' },
  ],

  'structured-outputs': [
    { name: 'Getting structure at all', startsAt: 'why-structured-output' },
    { name: 'Designing schemas', startsAt: 'enums-and-constrained-fields' },
    { name: 'Making it reliable', startsAt: 'constrained-decoding-under-the-hood' },
    { name: 'Harder schema shapes', startsAt: 'optional-and-nullable-fields' },
    { name: 'Extraction at scale', startsAt: 'evaluating-structured-output-quality' },
  ],

  hallucinations: [
    { name: 'Why models hallucinate', startsAt: 'what-is-a-hallucination' },
    { name: 'Grounding and citation', startsAt: 'grounding-with-source-documents' },
    { name: 'Detection and verification', startsAt: 'self-verification-techniques' },
    { name: 'The specific varieties', startsAt: 'sycophancy-vs-hallucination' },
    { name: 'Uncertainty and escalation', startsAt: 'escalation-design-for-uncertain-answers' },
  ],

  'genai-app-dev': [
    { name: 'Your first feature', startsAt: 'anatomy-of-a-genai-feature' },
    { name: 'Cost, latency and limits', startsAt: 'trimming-conversation-history' },
    { name: 'Reliability and safety', startsAt: 'provider-abstraction-layers' },
    { name: 'Beyond the first version', startsAt: 'sdk-vs-raw-api' },
    { name: 'Operating the feature', startsAt: 'feature-flagging-ai-features' },
    { name: 'Structure and tool authority', startsAt: 'api-lifecycle-and-structured-output' },
  ],

  rag: [
    { name: 'The whole game', startsAt: 'rag-whole-game' },
    { name: 'Chunking', startsAt: 'chunking-strategies-for-documents' },
    { name: 'Vector retrieval', startsAt: 'embeddings-and-semantic-similarity' },
    { name: 'Vector databases', startsAt: 'choosing-a-vector-database' },
    { name: 'Hybrid search and filtering', startsAt: 'metadata-filtering-in-retrieval' },
    { name: 'Query rewriting and reranking', startsAt: 'query-rewriting-and-expansion' },
    { name: 'Grounding and evaluation', startsAt: 'grounding-answers-with-citations' },
    { name: 'Beyond basic RAG', startsAt: 'when-rag-is-the-wrong-tool' },
    { name: 'Foundations and capstone', startsAt: 'ingestion-chunking-and-retrieval' },
  ],

  'tools-function-calling': [
    { name: 'Tool calling basics', startsAt: 'what-is-tool-calling' },
    { name: 'Executing safely', startsAt: 'executing-tool-calls-safely' },
    { name: 'Multi-step and parallel use', startsAt: 'parallel-tool-calls' },
    { name: 'Schemas at scale', startsAt: 'openapi-to-tool-schema' },
    { name: 'Advanced tool use', startsAt: 'chaining-tools-into-workflows' },
  ],

  mcp: [
    { name: 'What MCP is', startsAt: 'what-is-mcp' },
    { name: 'Primitives in depth', startsAt: 'mcp-primitives-worked-example' },
    { name: 'Transports and clients', startsAt: 'mcp-transports-stdio-vs-http' },
    { name: 'Auth and security', startsAt: 'mcp-auth-fundamentals' },
    { name: 'Testing and shipping', startsAt: 'inspecting-and-testing-mcp-servers' },
    { name: 'The full primitive set', startsAt: 'mcp-roots' },
    { name: 'Multi-server and trust', startsAt: 'multi-server-orchestration' },
    { name: 'Protocol reference', startsAt: 'primitives-lifecycle-and-transport' },
  ],

  'agentic-ai': [
    { name: 'What an agent is', startsAt: 'what-is-an-agent' },
    { name: 'Planning and memory', startsAt: 'planning-and-task-decomposition' },
    { name: 'Orchestration and control', startsAt: 'multi-agent-patterns' },
    { name: 'Failure and evaluation', startsAt: 'common-agent-failure-modes' },
    { name: 'Advanced architectures', startsAt: 'hierarchical-task-decomposition' },
    { name: 'Frontier patterns', startsAt: 'blackboard-and-swarm-patterns' },
    { name: 'Foundations', startsAt: 'agents-vs-workflows' },
  ],

  'harness-design': [
    { name: 'What a harness is', startsAt: 'what-is-a-harness' },
    { name: 'Permissions and isolation', startsAt: 'deny-floors-and-policy-layers' },
    { name: 'State and streaming', startsAt: 'state-and-checkpointing' },
    { name: 'Extension and configuration', startsAt: 'subagent-and-task-delegation' },
    { name: 'Control and scheduling', startsAt: 'interrupt-and-cancellation-handling' },
    { name: 'Operating a harness', startsAt: 'sandboxing-technology-choices' },
  ],

  'evals-red-teaming': [
    { name: 'Why evals matter', startsAt: 'why-evals-matter' },
    { name: 'Judges and regression suites', startsAt: 'llm-as-judge' },
    { name: 'Attacks', startsAt: 'prompt-injection-basics' },
    { name: 'Making evals trustworthy', startsAt: 'eval-and-safety-metrics-dashboards' },
    { name: 'Evaluating agents and safety', startsAt: 'evaluating-agent-trajectories' },
    { name: 'Foundations', startsAt: 'datasets-rubrics-and-judges' },
  ],

  production: [
    { name: 'Observability', startsAt: 'structured-logging-for-llm-calls' },
    { name: 'SLOs and limits', startsAt: 'eval-based-regression-testing' },
    { name: 'Releases and incidents', startsAt: 'canary-and-shadow-releases' },
    { name: 'Configuration and gateways', startsAt: 'prompts-as-versioned-config' },
    { name: 'Cost and routing', startsAt: 'model-routing-by-task-complexity' },
    { name: 'Resilience at scale', startsAt: 'load-shedding-and-graceful-degradation' },
    { name: 'Foundations', startsAt: 'observability-cost-and-latency' },
  ],

  'fine-tuning': [
    { name: 'Should you fine-tune at all', startsAt: 'fine-tune-vs-prompt-vs-rag' },
    { name: 'Methods', startsAt: 'full-fine-tuning-vs-peft' },
    { name: 'Training and evaluation', startsAt: 'catastrophic-forgetting-and-overfitting' },
    { name: 'Serving a fine-tuned model', startsAt: 'quantization-gguf-awq-gptq' },
    { name: 'Datasets and tooling', startsAt: 'dataset-decontamination-and-deduplication' },
    { name: 'Training at depth', startsAt: 'lora-rank-and-target-module-selection' },
    { name: 'Preference tuning and beyond', startsAt: 'rlhf-reward-modeling-and-ppo' },
  ],
};

export interface LessonModule {
  name: string;
  anchor: string;
  nodes: TrackNode[];
  /** Index of the first node, so the contents list can keep one running count. */
  offset: number;
}

export const moduleAnchor = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Group a track's nodes into modules. Returns null when the track has no map,
 * or when the map doesn't match the track any more — a flat list is always a
 * correct fallback, and a half-applied grouping would not be.
 */
export function groupTrack(track: Track): LessonModule[] | null {
  const boundaries = moduleMap[track.id];
  if (!boundaries || boundaries.length === 0) return null;

  const startIndex = new Map<string, string>();
  for (const b of boundaries) startIndex.set(b.startsAt, b.name);

  const modules: LessonModule[] = [];
  let current: LessonModule | null = null;

  track.nodes.forEach((node, i) => {
    const name = node.slug ? startIndex.get(node.slug) : undefined;
    if (name) {
      current = { name, anchor: moduleAnchor(name), nodes: [], offset: i };
      modules.push(current);
    }
    if (!current) return; // nodes before the first boundary — map is stale
    current.nodes.push(node);
  });

  const placed = modules.reduce((n, m) => n + m.nodes.length, 0);
  if (placed !== track.nodes.length) return null;
  return modules;
}

/** The module a given lesson slug sits in, for breadcrumbs. */
export function moduleForSlug(track: Track, slug: string): LessonModule | null {
  const modules = groupTrack(track);
  if (!modules) return null;
  return modules.find((m) => m.nodes.some((n) => n.slug === slug)) ?? null;
}
