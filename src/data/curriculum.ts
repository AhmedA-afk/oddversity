// AUTO-GENERATED unified taxonomy (22 tracks; Codex content ported).
export type NodeStatus = 'live' | 'curated' | 'coming';
export interface TrackNode { title: string; slug?: string; status: NodeStatus; eta?: string; }
export interface Track { id: string; n: string; name: string; group: string; meta: string; summary: string; nodes: TrackNode[]; }
export interface RoleTrack { id: string; name: string; blurb: string; status: NodeStatus; }
export const groups: string[] = [
  "Foundations",
  "Classical ML",
  "Working with Models",
  "Building",
  "Agentic",
  "Production"
];
const unsortedTracks: Track[] = [
  {
    "id": "ai-literacy",
    "n": "01",
    "name": "AI Literacy",
    "group": "Foundations",
    "meta": "56 lessons",
    "summary": "AI for everyone: what it is, what it can and can't do, and how to use it well — no code required.",
    "nodes": [
      {
        "title": "What AI can and can't do: the whole picture",
        "slug": "what-ai-can-and-cant-do-overview",
        "status": "live"
      },
      {
        "title": "Decide whether a task needs AI",
        "slug": "task-or-automation",
        "status": "live"
      },
      {
        "title": "When AI helps and when it just gets in the way",
        "slug": "when-ai-helps-and-when-it-hurts",
        "status": "live"
      },
      {
        "title": "'Should I use AI for this?' — five real decisions",
        "slug": "should-i-use-ai-for-this-worked-decisions",
        "status": "live"
      },
      {
        "title": "Matching the right AI tool to the job",
        "slug": "matching-the-ai-tool-to-the-job",
        "status": "live"
      },
      {
        "title": "Comparing AI tools for one real task",
        "slug": "compare-ai-tools-for-one-real-task",
        "status": "live"
      },
      {
        "title": "Quiz: when and which AI",
        "slug": "deciding-when-and-which-ai-quiz",
        "status": "live"
      },
      {
        "title": "See AI as a data, model, and output loop",
        "slug": "data-model-output-loop",
        "status": "live"
      },
      {
        "title": "Choose the right AI system",
        "slug": "choose-the-right-ai-system",
        "status": "live"
      },
      {
        "title": "Understand how language models produce text",
        "slug": "how-language-models-produce-text",
        "status": "live"
      },
      {
        "title": "Why AI always sounds so sure of itself",
        "slug": "why-ai-sounds-so-confident",
        "status": "live"
      },
      {
        "title": "Watch AI build a sentence, one word at a time",
        "slug": "watch-ai-predict-the-next-word",
        "status": "live"
      },
      {
        "title": "Garbage in, garbage out: the data-model-output loop",
        "slug": "garbage-in-garbage-out-the-data-loop",
        "status": "live"
      },
      {
        "title": "Where AI's knowledge comes from — and where it stops",
        "slug": "where-ai-knowledge-comes-from-and-stops",
        "status": "live"
      },
      {
        "title": "Stop treating AI like Google",
        "slug": "ai-is-not-a-search-engine",
        "status": "live"
      },
      {
        "title": "Quiz: how AI produces answers",
        "slug": "how-ai-produces-answers-quiz",
        "status": "live"
      },
      {
        "title": "Handle uncertainty with verification and human judgment",
        "slug": "uncertainty-and-verification",
        "status": "live"
      },
      {
        "title": "The one skill that matters most: judging the output",
        "slug": "the-single-most-important-skill-judging-output",
        "status": "live"
      },
      {
        "title": "What an AI 'hallucination' really is",
        "slug": "what-a-hallucination-really-is",
        "status": "live"
      },
      {
        "title": "Worked example: catching a hallucination",
        "slug": "catch-a-hallucination-worked-example",
        "status": "live"
      },
      {
        "title": "How to verify facts and sources",
        "slug": "how-to-verify-facts-and-sources",
        "status": "live"
      },
      {
        "title": "Fact-checking an AI answer, step by step",
        "slug": "fact-check-an-ai-answer-step-by-step",
        "status": "live"
      },
      {
        "title": "How to verify different kinds of AI output",
        "slug": "verification-tactics-by-task-type",
        "status": "live"
      },
      {
        "title": "When AI gets numbers and math wrong",
        "slug": "when-ai-gets-numbers-and-math-wrong",
        "status": "live"
      },
      {
        "title": "Cheatsheet: the verification checklist",
        "slug": "the-verification-checklist",
        "status": "live"
      },
      {
        "title": "Quiz: judging and verifying",
        "slug": "judging-and-verifying-quiz",
        "status": "live"
      },
      {
        "title": "Protect data with privacy, provenance, and policy boundaries",
        "slug": "data-privacy-provenance-and-policy",
        "status": "live"
      },
      {
        "title": "What happens to what you type into AI",
        "slug": "what-happens-to-what-you-type",
        "status": "live"
      },
      {
        "title": "When your data is the price you pay",
        "slug": "your-data-can-be-the-price",
        "status": "live"
      },
      {
        "title": "What you should never paste into AI",
        "slug": "what-not-to-paste-into-ai",
        "status": "live"
      },
      {
        "title": "Where AI bias comes from",
        "slug": "where-ai-bias-comes-from",
        "status": "live"
      },
      {
        "title": "Spotting bias in AI output: a worked example",
        "slug": "spot-bias-in-ai-output-worked-example",
        "status": "live"
      },
      {
        "title": "Using AI honestly and responsibly",
        "slug": "using-ai-honestly-and-responsibly",
        "status": "live"
      },
      {
        "title": "Quiz: privacy, bias, and ethics",
        "slug": "privacy-bias-and-ethics-quiz",
        "status": "live"
      },
      {
        "title": "Build your first bounded AI workflow",
        "slug": "first-ai-workflow-capstone",
        "status": "live"
      },
      {
        "title": "What AI actually is (and what it isn't)",
        "slug": "what-ai-actually-is",
        "status": "live"
      },
      {
        "title": "AI is prediction, not thinking",
        "slug": "ai-as-pattern-prediction-not-thinking",
        "status": "live"
      },
      {
        "title": "AI vs. a human expert: a side-by-side",
        "slug": "ai-vs-human-thinking-compared",
        "status": "live"
      },
      {
        "title": "The kinds of AI you already use",
        "slug": "types-of-ai-you-meet-every-day",
        "status": "live"
      },
      {
        "title": "Six myths about AI, debunked",
        "slug": "common-myths-about-ai-debunked",
        "status": "live"
      },
      {
        "title": "Quiz: what AI is and isn't",
        "slug": "what-ai-actually-is-quiz",
        "status": "live"
      },
      {
        "title": "How to ask AI for exactly what you want",
        "slug": "how-to-ask-ai-clearly",
        "status": "live"
      },
      {
        "title": "Think of prompting as briefing an eager intern",
        "slug": "prompting-is-delegating-to-an-eager-intern",
        "status": "live"
      },
      {
        "title": "Worked example: fixing a vague prompt",
        "slug": "turn-a-vague-request-into-a-clear-one",
        "status": "live"
      },
      {
        "title": "Show, don't just tell: giving AI context and examples",
        "slug": "give-ai-context-and-examples",
        "status": "live"
      },
      {
        "title": "Ready-made prompt patterns for common tasks",
        "slug": "prompt-patterns-for-everyday-tasks",
        "status": "live"
      },
      {
        "title": "Cheatsheet: everyday prompting",
        "slug": "everyday-prompting-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: asking AI well",
        "slug": "prompting-quiz",
        "status": "live"
      },
      {
        "title": "What using AI actually costs you",
        "slug": "what-using-ai-actually-costs",
        "status": "live"
      },
      {
        "title": "Free vs. paid AI: what you actually get",
        "slug": "free-vs-paid-ai-what-you-get",
        "status": "live"
      },
      {
        "title": "Is AI worth it here? A cost-benefit walkthrough",
        "slug": "is-ai-worth-it-for-this-task",
        "status": "live"
      },
      {
        "title": "The real limits of today's AI",
        "slug": "the-real-limits-of-ai-today",
        "status": "live"
      },
      {
        "title": "Expecting too much — or too little — from AI",
        "slug": "expecting-too-much-or-too-little",
        "status": "live"
      },
      {
        "title": "Cheatsheet: the AI literacy master reference",
        "slug": "ai-literacy-master-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: cost, limits, and tradeoffs",
        "slug": "cost-and-limits-quiz",
        "status": "live"
      },
      {
        "title": "Capstone: run a real task end to end, verified",
        "slug": "run-a-real-task-end-to-end-with-verification",
        "status": "live"
      }
    ]
  },
  {
    "id": "maths-foundations",
    "n": "02",
    "name": "Maths Foundations",
    "group": "Foundations",
    "meta": "195 lessons",
    "summary": "The minimum maths — vectors, probability, and gradients — needed to actually reason about how LLMs compute, not just use them.",
    "nodes": [
      {
        "title": "Vectors: The Basic Unit of Data",
        "slug": "what-is-a-vector",
        "status": "live"
      },
      {
        "title": "The Dot Product, Explained",
        "slug": "dot-product-explained",
        "status": "live"
      },
      {
        "title": "Cosine Similarity: Measuring How Alike Two Things Are",
        "slug": "cosine-similarity",
        "status": "live"
      },
      {
        "title": "Matrices as Transformations",
        "slug": "matrices-as-transformations",
        "status": "live"
      },
      {
        "title": "Probability Basics for AI",
        "slug": "probability-basics-for-ai",
        "status": "live"
      },
      {
        "title": "The Softmax Function",
        "slug": "the-softmax-function",
        "status": "live"
      },
      {
        "title": "Temperature: Reshaping a Probability Distribution",
        "slug": "temperature-in-sampling",
        "status": "live"
      },
      {
        "title": "Logarithms for Machine Learning",
        "slug": "logarithms-for-ml",
        "status": "live"
      },
      {
        "title": "Perplexity: How Language Models Are Scored",
        "slug": "perplexity-explained",
        "status": "live"
      },
      {
        "title": "Gradients: Slopes in Many Dimensions",
        "slug": "gradients-and-slopes",
        "status": "live"
      },
      {
        "title": "Gradient Descent, Intuitively",
        "slug": "gradient-descent-intuition",
        "status": "live"
      },
      {
        "title": "Backpropagation: How Networks Assign Blame",
        "slug": "backpropagation-intuition",
        "status": "live"
      },
      {
        "title": "Why High-Dimensional Space Feels Weird",
        "slug": "high-dimensional-spaces",
        "status": "live"
      },
      {
        "title": "The Geometry of Embeddings",
        "slug": "the-geometry-of-embeddings",
        "status": "live"
      },
      {
        "title": "Vector Norms: Measuring Length and Distance",
        "slug": "vector-norms",
        "status": "live"
      },
      {
        "title": "Matrix Multiplication, Step by Step",
        "slug": "matrix-multiplication-mechanics",
        "status": "live"
      },
      {
        "title": "Bayes' Theorem for AI Practitioners",
        "slug": "bayes-theorem-for-ai",
        "status": "live"
      },
      {
        "title": "Partial Derivatives and the Chain Rule",
        "slug": "partial-derivatives-and-chain-rule",
        "status": "live"
      },
      {
        "title": "Entropy and Cross-Entropy: Measuring Surprise",
        "slug": "entropy-and-cross-entropy",
        "status": "live"
      },
      {
        "title": "KL Divergence: Comparing Two Probability Distributions",
        "slug": "kl-divergence",
        "status": "live"
      },
      {
        "title": "L1 vs. L2 Regularization",
        "slug": "l1-vs-l2-regularization",
        "status": "live"
      },
      {
        "title": "Eigenvalues and Eigenvectors, Intuitively",
        "slug": "eigenvalues-and-eigenvectors",
        "status": "live"
      },
      {
        "title": "SVD: Decomposing a Matrix Into Its Building Blocks",
        "slug": "singular-value-decomposition",
        "status": "live"
      },
      {
        "title": "The Adam Optimizer: Momentum Meets Adaptive Rates",
        "slug": "the-adam-optimizer",
        "status": "live"
      },
      {
        "title": "Numerical Stability and the Log-Sum-Exp Trick",
        "slug": "numerical-stability-log-sum-exp",
        "status": "live"
      },
      {
        "title": "Convexity and Loss Landscapes",
        "slug": "convexity-and-loss-landscapes",
        "status": "live"
      },
      {
        "title": "Functions, mappings, and composition",
        "slug": "functions-mappings-and-composition",
        "status": "live"
      },
      {
        "title": "Algebra for model equations",
        "slug": "algebra-for-model-equations",
        "status": "live"
      },
      {
        "title": "Notation, indices, sums, and products",
        "slug": "notation-indices-sums-and-products",
        "status": "live"
      },
      {
        "title": "Sets, logic, and proof habits",
        "slug": "sets-logic-and-proof-habits",
        "status": "live"
      },
      {
        "title": "Limits, continuity, and local approximation",
        "slug": "limits-continuity-and-local-approximation",
        "status": "live"
      },
      {
        "title": "Derivatives as rate, slope, and sensitivity",
        "slug": "derivatives-rate-slope-sensitivity",
        "status": "live"
      },
      {
        "title": "Finite differences and numerical derivative checks",
        "slug": "finite-differences-and-numerical-derivative-checks",
        "status": "live"
      },
      {
        "title": "Differentiation rules",
        "slug": "differentiation-rules",
        "status": "live"
      },
      {
        "title": "The chain rule",
        "slug": "the-chain-rule",
        "status": "live"
      },
      {
        "title": "Critical points, monotonicity, and extrema",
        "slug": "critical-points-monotonicity-and-extrema",
        "status": "live"
      },
      {
        "title": "Second derivatives, curvature, and local quadratic models",
        "slug": "second-derivatives-curvature-and-local-quadratic-models",
        "status": "live"
      },
      {
        "title": "Taylor expansions and approximation error",
        "slug": "taylor-expansions-and-approximation-error",
        "status": "live"
      },
      {
        "title": "Integrals, accumulation, and probability mass",
        "slug": "integrals-accumulation-and-probability-mass",
        "status": "live"
      },
      {
        "title": "One-dimensional optimisation clinic",
        "slug": "one-dimensional-optimisation-clinic",
        "status": "live"
      },
      {
        "title": "Orthogonal complements and projection matrices",
        "slug": "orthogonal-complements-and-projection-matrices",
        "status": "live"
      },
      {
        "title": "Gram–Schmidt orthogonalisation",
        "slug": "gram-schmidt-orthogonalisation",
        "status": "live"
      },
      {
        "title": "QR factorisation and least-squares solving",
        "slug": "qr-factorisation-and-least-squares",
        "status": "live"
      },
      {
        "title": "Diagonalisation and powers of a transformation",
        "slug": "diagonalisation-and-powers",
        "status": "live"
      },
      {
        "title": "Symmetric matrices, quadratic forms, and positive definiteness",
        "slug": "symmetric-matrices-quadratic-forms-and-definiteness",
        "status": "live"
      },
      {
        "title": "Low-rank approximation and compression",
        "slug": "low-rank-approximation-and-compression",
        "status": "live"
      },
      {
        "title": "PCA from variance maximisation and SVD",
        "slug": "pca-from-variance-and-svd",
        "status": "live"
      },
      {
        "title": "Covariance matrices and whitening",
        "slug": "covariance-and-whitening",
        "status": "live"
      },
      {
        "title": "Condition numbers, stability, and practical solvers",
        "slug": "condition-numbers-stability-and-solvers",
        "status": "live"
      },
      {
        "title": "Kernel matrices and the kernel trick",
        "slug": "kernel-matrices-and-kernel-trick",
        "status": "live"
      },
      {
        "title": "A0: Notation and tensor-shape clinic",
        "slug": "labs/a0-notation-and-tensor-shape-clinic",
        "status": "live"
      },
      {
        "title": "A1 · Embedding geometry lab",
        "slug": "labs/a1-embedding-geometry-lab",
        "status": "live"
      },
      {
        "title": "A10 · Optimiser and stability clinic",
        "slug": "labs/a10-optimiser-and-stability-clinic",
        "status": "live"
      },
      {
        "title": "A11: Mathematical ML capstone",
        "slug": "labs/a11-mathematical-ml-capstone",
        "status": "live"
      },
      {
        "title": "A2: Least squares from three angles",
        "slug": "labs/a2-least-squares-from-three-angles",
        "status": "live"
      },
      {
        "title": "A3 · PCA, kernels, and low-rank compression lab",
        "slug": "labs/a3-pca-kernels-and-low-rank-compression",
        "status": "live"
      },
      {
        "title": "A4 · Derivative and gradient audit",
        "slug": "labs/a4-derivative-and-gradient-audit",
        "status": "live"
      },
      {
        "title": "A5 · Backpropagation from scratch",
        "slug": "labs/a5-backpropagation-from-scratch",
        "status": "live"
      },
      {
        "title": "A6 · Base rates, Bayes, and simulation",
        "slug": "labs/a6-base-rates-bayes-and-simulation",
        "status": "live"
      },
      {
        "title": "A7 · Likelihood, priors, and sampling",
        "slug": "labs/a7-likelihood-priors-and-sampling",
        "status": "live"
      },
      {
        "title": "A8 · Evidence under uncertainty and causality",
        "slug": "labs/a8-evidence-under-uncertainty-and-causality",
        "status": "live"
      },
      {
        "title": "A9 · Losses are probability claims lab",
        "slug": "labs/a9-losses-are-probability-claims",
        "status": "live"
      },
      {
        "title": "Lesson Index",
        "slug": "lesson-index",
        "status": "live"
      },
      {
        "title": "Scalars, arrays, tensors, axes, shapes, and broadcasting",
        "slug": "scalars-arrays-tensors-axes-shapes-and-broadcasting",
        "status": "live"
      },
      {
        "title": "Units, scales, normalisation, and dimensionless quantities",
        "slug": "units-scales-normalisation",
        "status": "live"
      },
      {
        "title": "Floating-point arithmetic and computational notation",
        "slug": "floating-point-arithmetic-and-computational-notation",
        "status": "live"
      },
      {
        "title": "Visual reasoning and diagnostic plots",
        "slug": "visual-reasoning-and-diagnostic-plots",
        "status": "live"
      },
      {
        "title": "Ratios, fractions, percentages, scientific notation, and numerical sanity checks",
        "slug": "ratios-fractions-percentages-scientific-notation-and-sanity-checks",
        "status": "live"
      },
      {
        "title": "Sequences, recurrences, polynomials, quadratics, and growth rates",
        "slug": "sequences-recurrences-polynomials-quadratics-and-growth-rates",
        "status": "live"
      },
      {
        "title": "Vectors as coordinates, measurements, and features",
        "slug": "vectors-as-coordinates-features",
        "status": "live"
      },
      {
        "title": "Vector addition, scalar multiplication, affine combinations, and centroids",
        "slug": "vector-addition-affine-combinations-centroids",
        "status": "live"
      },
      {
        "title": "Dot products and bilinear scores",
        "slug": "dot-products-bilinear-scores",
        "status": "live"
      },
      {
        "title": "Norms and distances",
        "slug": "norms-and-distances",
        "status": "live"
      },
      {
        "title": "Cosine similarity, angular distance, and embedding retrieval",
        "slug": "cosine-similarity-angular-distance-embedding-retrieval",
        "status": "live"
      },
      {
        "title": "Orthogonality and orthonormal coordinates",
        "slug": "orthogonality-orthonormal-coordinates",
        "status": "live"
      },
      {
        "title": "Projections and residuals",
        "slug": "projections-and-residuals",
        "status": "live"
      },
      {
        "title": "Angles, margins, and separating hyperplanes",
        "slug": "angles-margins-separating-hyperplanes",
        "status": "live"
      },
      {
        "title": "Vector means, centring, and feature standardisation",
        "slug": "vector-means-centring-feature-standardisation",
        "status": "live"
      },
      {
        "title": "Geometry in high dimensions",
        "slug": "geometry-in-high-dimensions",
        "status": "live"
      },
      {
        "title": "Similarity-search design clinic",
        "slug": "similarity-search-design-clinic",
        "status": "live"
      },
      {
        "title": "Objectives, losses, empirical risk, and constraints",
        "slug": "objectives-losses-empirical-risk-and-constraints",
        "status": "live"
      },
      {
        "title": "Convex sets, convex functions, and guarantees",
        "slug": "convex-sets-functions-and-guarantees",
        "status": "live"
      },
      {
        "title": "Batch gradient descent and learning-rate choice",
        "slug": "batch-gradient-descent-and-learning-rate",
        "status": "live"
      },
      {
        "title": "Stochastic and mini-batch gradient descent",
        "slug": "stochastic-and-minibatch-gradient-descent",
        "status": "live"
      },
      {
        "title": "Momentum, Nesterov intuition, RMSProp, and Adam",
        "slug": "momentum-nesterov-rmsprop-and-adam",
        "status": "live"
      },
      {
        "title": "Regularisation geometry: L1, L2, weight decay, and early stopping",
        "slug": "regularisation-geometry-l1-l2-weight-decay-and-early-stopping",
        "status": "live"
      },
      {
        "title": "Learning-rate schedules, warm-up, and gradient clipping",
        "slug": "learning-rate-schedules-warmup-and-gradient-clipping",
        "status": "live"
      },
      {
        "title": "Conditioning, scaling, initialisation, and normalisation",
        "slug": "conditioning-scaling-initialisation-and-normalisation",
        "status": "live"
      },
      {
        "title": "Numerical stability: softmax, log-sum-exp, and safe probabilities",
        "slug": "numerical-stability-softmax-logsumexp-and-safe-probabilities",
        "status": "live"
      },
      {
        "title": "Optimisation diagnostics and second-order perspective",
        "slug": "optimisation-diagnostics-and-second-order-perspective",
        "status": "live"
      },
      {
        "title": "Newton, quasi-Newton, and coordinate-descent methods",
        "slug": "newton-quasi-newton-and-coordinate-descent",
        "status": "live"
      },
      {
        "title": "Matrices as data tables and linear maps",
        "slug": "matrices-as-data-tables-and-linear-maps",
        "status": "live"
      },
      {
        "title": "Matrix addition, scaling, transpose, and symmetry",
        "slug": "matrix-addition-scaling-transpose-and-symmetry",
        "status": "live"
      },
      {
        "title": "Matrix–vector multiplication",
        "slug": "matrix-vector-multiplication",
        "status": "live"
      },
      {
        "title": "Matrix–matrix multiplication and batching",
        "slug": "matrix-matrix-multiplication-and-batching",
        "status": "live"
      },
      {
        "title": "Linear systems and augmented matrices",
        "slug": "linear-systems-and-augmented-matrices",
        "status": "live"
      },
      {
        "title": "Gaussian elimination and row-echelon form",
        "slug": "gaussian-elimination-and-row-echelon-form",
        "status": "live"
      },
      {
        "title": "Rank, pivots, and identifiability",
        "slug": "rank-pivots-and-identifiability",
        "status": "live"
      },
      {
        "title": "Null spaces, column spaces, row spaces, and the fundamental picture",
        "slug": "null-spaces-column-spaces-row-spaces-and-the-fundamental-picture",
        "status": "live"
      },
      {
        "title": "Span, linear independence, basis, and dimension",
        "slug": "span-linear-independence-basis-and-dimension",
        "status": "live"
      },
      {
        "title": "Invertibility, determinants, and volume intuition",
        "slug": "invertibility-determinants-and-volume-intuition",
        "status": "live"
      },
      {
        "title": "Inverses and why solving beats explicit inversion",
        "slug": "inverses-and-why-solving-beats-explicit-inversion",
        "status": "live"
      },
      {
        "title": "Least squares, normal equations, and projection geometry",
        "slug": "least-squares-normal-equations-and-projection-geometry",
        "status": "live"
      },
      {
        "title": "Partial derivatives and coordinate-wise sensitivity",
        "slug": "partial-derivatives-and-coordinate-wise-sensitivity",
        "status": "live"
      },
      {
        "title": "Gradients and directional derivatives",
        "slug": "gradients-and-directional-derivatives",
        "status": "live"
      },
      {
        "title": "Level sets, tangent planes, and constrained movement",
        "slug": "level-sets-tangent-planes-and-constrained-movement",
        "status": "live"
      },
      {
        "title": "Jacobians for vector-valued functions",
        "slug": "jacobians-for-vector-valued-functions",
        "status": "live"
      },
      {
        "title": "Hessians, curvature, and saddle points",
        "slug": "hessians-curvature-and-saddle-points",
        "status": "live"
      },
      {
        "title": "Differentials, trace notation, and matrix-calculus conventions",
        "slug": "differentials-trace-notation-and-matrix-calculus-conventions",
        "status": "live"
      },
      {
        "title": "Derivatives of affine layers and elementwise activations",
        "slug": "derivatives-of-affine-layers-and-elementwise-activations",
        "status": "live"
      },
      {
        "title": "Computational graphs and local derivatives",
        "slug": "computational-graphs-and-local-derivatives",
        "status": "live"
      },
      {
        "title": "Forward-mode automatic differentiation",
        "slug": "forward-mode-automatic-differentiation",
        "status": "live"
      },
      {
        "title": "Reverse-mode autodiff and backpropagation",
        "slug": "reverse-mode-autodiff-and-backpropagation",
        "status": "live"
      },
      {
        "title": "Gradient checking and debugging",
        "slug": "gradient-checking-and-debugging",
        "status": "live"
      },
      {
        "title": "Non-smooth optimisation and subgradients",
        "slug": "non-smooth-optimisation-and-subgradients",
        "status": "live"
      },
      {
        "title": "Constrained optimisation, Lagrange multipliers, and KKT intuition",
        "slug": "constrained-optimisation-lagrange-multipliers-and-kkt-intuition",
        "status": "live"
      },
      {
        "title": "Sample spaces, events, and probability axioms",
        "slug": "sample-spaces-events-and-probability-axioms",
        "status": "live"
      },
      {
        "title": "Counting, permutations, combinations, and inclusion–exclusion",
        "slug": "counting-permutations-combinations-and-inclusion-exclusion",
        "status": "live"
      },
      {
        "title": "Conditional probability",
        "slug": "conditional-probability",
        "status": "live"
      },
      {
        "title": "Independence and conditional independence",
        "slug": "independence-and-conditional-independence",
        "status": "live"
      },
      {
        "title": "The law of total probability",
        "slug": "law-of-total-probability",
        "status": "live"
      },
      {
        "title": "Bayes’ rule and base rates",
        "slug": "bayes-rule-and-base-rates",
        "status": "live"
      },
      {
        "title": "Random variables and support",
        "slug": "random-variables-and-support",
        "status": "live"
      },
      {
        "title": "PMFs, CDFs, PDFs, and probability mass versus density",
        "slug": "pmfs-cdfs-pdfs-and-mass-versus-density",
        "status": "live"
      },
      {
        "title": "Expectation and linearity",
        "slug": "expectation-and-linearity",
        "status": "live"
      },
      {
        "title": "Variance, standard deviation, and bias–variance language",
        "slug": "variance-standard-deviation-and-bias-variance",
        "status": "live"
      },
      {
        "title": "Covariance, correlation, and confounding warnings",
        "slug": "covariance-correlation-and-confounding",
        "status": "live"
      },
      {
        "title": "Joint, marginal, and conditional distributions",
        "slug": "joint-marginal-and-conditional-distributions",
        "status": "live"
      },
      {
        "title": "Conditional expectation and conditional variance",
        "slug": "conditional-expectation-and-conditional-variance",
        "status": "live"
      },
      {
        "title": "Bernoulli, Binomial, Hypergeometric, and Negative Binomial models",
        "slug": "bernoulli-binomial-hypergeometric-and-negative-binomial",
        "status": "live"
      },
      {
        "title": "Categorical and Multinomial models",
        "slug": "categorical-and-multinomial-models",
        "status": "live"
      },
      {
        "title": "Uniform, geometric, and exponential models",
        "slug": "uniform-geometric-and-exponential-models",
        "status": "live"
      },
      {
        "title": "Poisson counts and rate assumptions",
        "slug": "poisson-counts-and-rate-assumptions",
        "status": "live"
      },
      {
        "title": "Gaussian distributions and standardisation",
        "slug": "gaussian-distributions-and-standardisation",
        "status": "live"
      },
      {
        "title": "Multivariate Gaussians and covariance geometry",
        "slug": "multivariate-gaussians-and-covariance-geometry",
        "status": "live"
      },
      {
        "title": "Beta and Dirichlet priors",
        "slug": "beta-and-dirichlet-priors",
        "status": "live"
      },
      {
        "title": "Transformations of random variables and LOTUS",
        "slug": "transformations-of-random-variables-and-lotus",
        "status": "live"
      },
      {
        "title": "Sampling, inverse transform, and rejection sampling",
        "slug": "sampling-inverse-transform-and-rejection-sampling",
        "status": "live"
      },
      {
        "title": "Monte Carlo estimation and standard errors",
        "slug": "monte-carlo-estimation-and-standard-errors",
        "status": "live"
      },
      {
        "title": "Law of large numbers and central limit theorem",
        "slug": "law-of-large-numbers-and-central-limit-theorem",
        "status": "live"
      },
      {
        "title": "Concentration, tail risk, and rare events",
        "slug": "concentration-tail-risk-and-rare-events",
        "status": "live"
      },
      {
        "title": "Markov chains and stationary distributions",
        "slug": "markov-chains-and-stationary-distributions",
        "status": "live"
      },
      {
        "title": "Importance sampling and weighted estimates",
        "slug": "importance-sampling-and-weighted-estimates",
        "status": "live"
      },
      {
        "title": "Quantiles, order statistics, empirical distributions, and anomaly thresholds",
        "slug": "quantiles-order-statistics-empirical-distributions-and-anomaly-thresholds",
        "status": "live"
      },
      {
        "title": "Descriptive statistics and exploratory analysis",
        "slug": "descriptive-statistics-and-exploratory-analysis",
        "status": "live"
      },
      {
        "title": "Data-generating processes, sampling, and selection bias",
        "slug": "data-generating-processes-sampling-and-selection-bias",
        "status": "live"
      },
      {
        "title": "Estimators, bias, consistency, efficiency, and variance",
        "slug": "estimators-bias-consistency-efficiency-and-variance",
        "status": "live"
      },
      {
        "title": "Likelihood and log-likelihood",
        "slug": "likelihood-and-log-likelihood",
        "status": "live"
      },
      {
        "title": "Maximum likelihood estimation",
        "slug": "maximum-likelihood-estimation",
        "status": "live"
      },
      {
        "title": "Maximum a posteriori estimation and regularisation",
        "slug": "map-and-regularisation",
        "status": "live"
      },
      {
        "title": "Confidence intervals and their frequentist meaning",
        "slug": "confidence-intervals-and-frequentist-meaning",
        "status": "live"
      },
      {
        "title": "Bootstrap methods",
        "slug": "bootstrap-methods",
        "status": "live"
      },
      {
        "title": "Hypothesis tests, p-values, and permutation tests",
        "slug": "hypothesis-tests-p-values-and-permutation-tests",
        "status": "live"
      },
      {
        "title": "Effect sizes, statistical power, and sample-size planning",
        "slug": "effect-sizes-power-and-sample-size-planning",
        "status": "live"
      },
      {
        "title": "A/B experiments, sequential testing, and multiple comparisons",
        "slug": "ab-experiments-sequential-testing-and-multiple-comparisons",
        "status": "live"
      },
      {
        "title": "Calibration, proper scoring rules, and distribution shift",
        "slug": "calibration-proper-scoring-rules-and-distribution-shift",
        "status": "live"
      },
      {
        "title": "Causal inference foundations: confounding, counterfactuals, interventions, and experiments",
        "slug": "causal-inference-foundations",
        "status": "live"
      },
      {
        "title": "Self-information and coding intuition",
        "slug": "self-information-and-coding-intuition",
        "status": "live"
      },
      {
        "title": "Entropy and uncertainty",
        "slug": "entropy-and-uncertainty",
        "status": "live"
      },
      {
        "title": "Cross-entropy from expected negative log-likelihood",
        "slug": "cross-entropy-and-negative-log-likelihood",
        "status": "live"
      },
      {
        "title": "KL divergence and distribution mismatch",
        "slug": "kl-divergence-and-distribution-mismatch",
        "status": "live"
      },
      {
        "title": "Mutual information and representation relevance",
        "slug": "mutual-information-and-representation-relevance",
        "status": "live"
      },
      {
        "title": "Likelihood, cross-entropy, and classification objectives",
        "slug": "likelihood-cross-entropy-and-classification-objectives",
        "status": "live"
      },
      {
        "title": "Naive Bayes and generative versus discriminative modelling",
        "slug": "naive-bayes-and-generative-vs-discriminative-modeling",
        "status": "live"
      },
      {
        "title": "Latent variables and evidence lower-bound intuition",
        "slug": "latent-variables-and-elbo-intuition",
        "status": "live"
      },
      {
        "title": "Exponential families, sufficient statistics, and GLM intuition",
        "slug": "exponential-families-sufficient-statistics-and-glm",
        "status": "live"
      },
      {
        "title": "Research Benchmarks",
        "slug": "research-benchmarks",
        "status": "live"
      },
      {
        "title": "Discrete signals, sampling, and aliasing",
        "slug": "s1-1-discrete-signals-sampling-and-aliasing",
        "status": "live"
      },
      {
        "title": "Convolution and correlation",
        "slug": "s1-2-convolution-and-correlation",
        "status": "live"
      },
      {
        "title": "Discrete convolution in CNNs",
        "slug": "s1-3-discrete-convolution-in-cnns",
        "status": "live"
      },
      {
        "title": "Fourier bases and the discrete Fourier transform",
        "slug": "s1-4-fourier-bases-and-the-discrete-fourier-transform",
        "status": "live"
      },
      {
        "title": "Frequency filtering and the convolution theorem",
        "slug": "s1-5-frequency-filtering-and-convolution-theorem",
        "status": "live"
      },
      {
        "title": "Spectrograms, windowing, and time–frequency trade-offs",
        "slug": "s1-6-spectrograms-windowing-and-time-frequency-trade-offs",
        "status": "live"
      },
      {
        "title": "Image transforms, interpolation, and invariance",
        "slug": "s1-7-image-transforms-interpolation-and-invariance",
        "status": "live"
      },
      {
        "title": "Vision/audio case study: design a signal representation",
        "slug": "s1-8-vision-audio-case-study",
        "status": "live"
      },
      {
        "title": "The Markov property and state design",
        "slug": "s2-1-markov-property-and-state-design",
        "status": "live"
      },
      {
        "title": "Markov reward processes and return",
        "slug": "s2-2-markov-reward-processes-and-return",
        "status": "live"
      },
      {
        "title": "Markov decision processes",
        "slug": "s2-3-markov-decision-processes",
        "status": "live"
      },
      {
        "title": "Bellman expectation equations",
        "slug": "s2-4-bellman-expectation-equations",
        "status": "live"
      },
      {
        "title": "Bellman optimality and value iteration",
        "slug": "s2-5-bellman-optimality-and-value-iteration",
        "status": "live"
      },
      {
        "title": "Policies, exploration, and occupancy",
        "slug": "s2-6-policies-exploration-and-occupancy",
        "status": "live"
      },
      {
        "title": "Temporal-difference learning and the bias–variance trade-off",
        "slug": "s2-7-temporal-difference-learning-and-bias-variance",
        "status": "live"
      },
      {
        "title": "RL safety and offline-data warnings",
        "slug": "s2-8-rl-safety-and-offline-data-warnings",
        "status": "live"
      },
      {
        "title": "Hidden Markov models, filtering, and decoding",
        "slug": "s2-9-hidden-markov-models-filtering-and-decoding",
        "status": "live"
      },
      {
        "title": "Graph notation, adjacency, incidence, and degree matrices",
        "slug": "s3-1-graph-notation-adjacency-incidence-and-degree-matrices",
        "status": "live"
      },
      {
        "title": "Random walks and transition operators",
        "slug": "s3-2-random-walks-and-transition-operators",
        "status": "live"
      },
      {
        "title": "Graph Laplacians and smoothness",
        "slug": "s3-3-graph-laplacians-and-smoothness",
        "status": "live"
      },
      {
        "title": "Spectral clustering and embeddings",
        "slug": "s3-4-spectral-clustering-and-embeddings",
        "status": "live"
      },
      {
        "title": "Message passing and oversmoothing",
        "slug": "s3-5-message-passing-and-oversmoothing",
        "status": "live"
      },
      {
        "title": "Bayesian posterior inference and posterior predictive checks",
        "slug": "s4-1-bayesian-posterior-inference-and-posterior-predictive-checks",
        "status": "live"
      },
      {
        "title": "Conjugacy and exponential-family structure",
        "slug": "s4-2-conjugacy-and-exponential-family-structure",
        "status": "live"
      },
      {
        "title": "Markov chain Monte Carlo",
        "slug": "s4-3-markov-chain-monte-carlo",
        "status": "live"
      },
      {
        "title": "Variational inference and the ELBO",
        "slug": "s4-4-variational-inference-and-the-elbo",
        "status": "live"
      },
      {
        "title": "Gaussian processes and kernel uncertainty",
        "slug": "s4-5-gaussian-processes-and-kernel-uncertainty",
        "status": "live"
      },
      {
        "title": "Causal graphical models, do-calculus, and identifiability limits",
        "slug": "s4-6-causal-graphical-models-do-calculus-and-identifiability-limits",
        "status": "live"
      }
    ]
  },
  {
    "id": "python-data-apis",
    "n": "03",
    "name": "Python & Data",
    "group": "Foundations",
    "meta": "57 lessons",
    "summary": "The Python, data-handling, and API skills every AI builder needs before the modelling starts.",
    "nodes": [
      {
        "title": "The Whole Game: Messy Data to a Model-Ready Pipeline",
        "slug": "python-data-pipeline-whole-game",
        "status": "live"
      },
      {
        "title": "Design data contracts before model calls",
        "slug": "data-contracts-and-validation",
        "status": "live"
      },
      {
        "title": "The Data Cleaning Workflow",
        "slug": "data-cleaning-workflow",
        "status": "live"
      },
      {
        "title": "Handling Missing and Empty Values",
        "slug": "handling-missing-values",
        "status": "live"
      },
      {
        "title": "Type Coercion and Parsing Dates",
        "slug": "type-coercion-and-parsing-dates",
        "status": "live"
      },
      {
        "title": "Validating Cleaned Data with a Schema",
        "slug": "validating-dataframes-with-schemas",
        "status": "live"
      },
      {
        "title": "From Clean Table to Model-Ready Input",
        "slug": "turning-messy-data-into-model-inputs",
        "status": "live"
      },
      {
        "title": "Cleaning Mistakes That Corrupt Data Silently",
        "slug": "data-cleaning-common-mistakes",
        "status": "live"
      },
      {
        "title": "Quiz: Data Cleaning & Validation",
        "slug": "data-cleaning-quiz",
        "status": "live"
      },
      {
        "title": "Use Python as a small, testable AI service",
        "slug": "python-for-ai-services",
        "status": "live"
      },
      {
        "title": "Structuring the Pipeline as a Service",
        "slug": "structuring-a-python-ai-service",
        "status": "live"
      },
      {
        "title": "Testing a Data Pipeline with pytest",
        "slug": "testing-data-pipelines",
        "status": "live"
      },
      {
        "title": "Quiz: Building the Service",
        "slug": "ai-service-quiz",
        "status": "live"
      },
      {
        "title": "Virtual Environments: One Sandbox per Project",
        "slug": "python-environments-and-venv",
        "status": "live"
      },
      {
        "title": "Why 'Works on My Machine' Happens",
        "slug": "why-isolated-environments-intuition",
        "status": "live"
      },
      {
        "title": "Set Up a venv, pip, and a Jupyter Notebook",
        "slug": "setting-up-venv-and-jupyter",
        "status": "live"
      },
      {
        "title": "Quiz: Environments & Notebooks",
        "slug": "environments-tooling-quiz",
        "status": "live"
      },
      {
        "title": "Secrets and Config: Keys Never Live in Code",
        "slug": "secrets-and-config-management",
        "status": "live"
      },
      {
        "title": "Load Secrets with .env and os.environ",
        "slug": "loading-secrets-with-dotenv",
        "status": "live"
      },
      {
        "title": "Quiz: Secrets & Configuration",
        "slug": "secrets-config-quiz",
        "status": "live"
      },
      {
        "title": "Lists, Dicts, Tuples, Sets for Data",
        "slug": "python-data-structures-for-data-work",
        "status": "live"
      },
      {
        "title": "How to Picture Lists, Dicts, and Sets",
        "slug": "lists-dicts-sets-intuition",
        "status": "live"
      },
      {
        "title": "Comprehensions and Generators for Transforms",
        "slug": "comprehensions-and-generators",
        "status": "live"
      },
      {
        "title": "Navigating Nested JSON in Python",
        "slug": "nested-json-in-memory",
        "status": "live"
      },
      {
        "title": "Quiz: Python Data Structures",
        "slug": "python-data-structures-quiz",
        "status": "live"
      },
      {
        "title": "Files and Formats: Text, Rows, and Columns",
        "slug": "files-and-data-formats-overview",
        "status": "live"
      },
      {
        "title": "Reading and Writing CSV Without Pain",
        "slug": "reading-and-writing-csv",
        "status": "live"
      },
      {
        "title": "JSON vs JSONL: Whole Files and Streams",
        "slug": "json-and-jsonl-files",
        "status": "live"
      },
      {
        "title": "Parquet: Columnar, Compressed, Typed",
        "slug": "parquet-and-columnar-formats",
        "status": "live"
      },
      {
        "title": "CSV vs JSON vs JSONL vs Parquet",
        "slug": "choosing-a-data-format",
        "status": "live"
      },
      {
        "title": "Quiz: Files & Formats",
        "slug": "files-and-formats-quiz",
        "status": "live"
      },
      {
        "title": "NumPy Arrays: Shape, dtype, Axis",
        "slug": "numpy-arrays-fundamentals",
        "status": "live"
      },
      {
        "title": "Why Arrays Are Fast (and Lists Aren't)",
        "slug": "why-arrays-beat-lists-intuition",
        "status": "live"
      },
      {
        "title": "Indexing, Masks, and Broadcasting",
        "slug": "numpy-indexing-and-broadcasting",
        "status": "live"
      },
      {
        "title": "Normalizing Features and Embeddings",
        "slug": "numpy-normalize-features-example",
        "status": "live"
      },
      {
        "title": "Quiz: NumPy Arrays",
        "slug": "numpy-quiz",
        "status": "live"
      },
      {
        "title": "pandas DataFrames and Series",
        "slug": "pandas-dataframes-fundamentals",
        "status": "live"
      },
      {
        "title": "Loading Data from CSV, JSON, and Parquet",
        "slug": "loading-data-into-pandas",
        "status": "live"
      },
      {
        "title": "Selecting, Filtering, and Indexing Rows",
        "slug": "selecting-filtering-indexing",
        "status": "live"
      },
      {
        "title": "GroupBy and Aggregation in Practice",
        "slug": "groupby-and-aggregation",
        "status": "live"
      },
      {
        "title": "Joining and Merging DataFrames",
        "slug": "joining-and-merging-dataframes",
        "status": "live"
      },
      {
        "title": "SettingWithCopy and Other pandas Traps",
        "slug": "pandas-settingwithcopy-mistakes",
        "status": "live"
      },
      {
        "title": "Quiz: pandas DataFrames",
        "slug": "pandas-quiz",
        "status": "live"
      },
      {
        "title": "Calling REST APIs with requests",
        "slug": "calling-rest-apis-with-python",
        "status": "live"
      },
      {
        "title": "Authenticating API Requests",
        "slug": "authentication-and-api-keys",
        "status": "live"
      },
      {
        "title": "Rate Limits, Backoff, and Retries",
        "slug": "rate-limits-and-retries",
        "status": "live"
      },
      {
        "title": "Pagination: Collecting Every Page",
        "slug": "pagination-patterns",
        "status": "live"
      },
      {
        "title": "Calling an LLM Chat API",
        "slug": "calling-llm-apis-in-python",
        "status": "live"
      },
      {
        "title": "Parsing and Validating API Responses",
        "slug": "parsing-and-validating-api-responses",
        "status": "live"
      },
      {
        "title": "API Calling Mistakes That Bite in Production",
        "slug": "api-calling-common-mistakes",
        "status": "live"
      },
      {
        "title": "Quiz: Calling APIs",
        "slug": "api-calling-quiz",
        "status": "live"
      },
      {
        "title": "Async Python for I/O-Bound Work",
        "slug": "async-python-for-io",
        "status": "live"
      },
      {
        "title": "Why Concurrency Speeds Up API Calls",
        "slug": "why-async-for-api-calls-intuition",
        "status": "live"
      },
      {
        "title": "Concurrent API Calls with asyncio",
        "slug": "concurrent-api-calls-with-asyncio",
        "status": "live"
      },
      {
        "title": "Batching LLM Calls for Throughput and Cost",
        "slug": "batching-llm-calls-for-throughput",
        "status": "live"
      },
      {
        "title": "Quiz: Async & Batching",
        "slug": "async-and-batching-quiz",
        "status": "live"
      },
      {
        "title": "Capstone: Messy Data to an LLM Pipeline",
        "slug": "messy-data-to-llm-pipeline-capstone",
        "status": "live"
      }
    ]
  },
  {
    "id": "ai-foundations",
    "n": "06",
    "name": "AI Foundations",
    "group": "Foundations",
    "meta": "160 lessons",
    "summary": "The ground floor of AI: what these systems are, how they learn, and a working mental model of what they can and can't do.",
    "nodes": [
      {
        "title": "How LLMs actually work",
        "slug": "how-llms-work",
        "status": "live"
      },
      {
        "title": "Tokens, context & cost",
        "slug": "tokens-context-cost",
        "status": "live"
      },
      {
        "title": "Choosing a model in 2026",
        "slug": "choosing-a-model",
        "status": "live"
      },
      {
        "title": "AI Problem Framing and Rational Action",
        "slug": "ai-systems/101-ai-problem-framing-and-rational-action",
        "status": "live"
      },
      {
        "title": "Intelligent Agents: Observations and Action Loops",
        "slug": "ai-systems/102-intelligent-agents-observations-and-action-loops",
        "status": "live"
      },
      {
        "title": "State Spaces and Search Problem Design",
        "slug": "ai-systems/103-state-spaces-and-search-problem-design",
        "status": "live"
      },
      {
        "title": "Breadth-First Search and Layered Exploration",
        "slug": "ai-systems/104-breadth-first-search-and-layered-exploration",
        "status": "live"
      },
      {
        "title": "Depth-First Search, Backtracking, and Cycle Safety",
        "slug": "ai-systems/105-depth-first-search-backtracking-and-cycle-safety",
        "status": "live"
      },
      {
        "title": "Uniform-Cost Search and Cost-Sensitive Planning",
        "slug": "ai-systems/106-uniform-cost-search-and-cost-sensitive-planning",
        "status": "live"
      },
      {
        "title": "A* Search: Admissibility, Consistency, and Reopening",
        "slug": "ai-systems/107-a-star-search-admissibility-and-consistency",
        "status": "live"
      },
      {
        "title": "Heuristic Design, Relaxations, and Search Diagnostics",
        "slug": "ai-systems/108-heuristic-design-relaxations-and-search-diagnostics",
        "status": "live"
      },
      {
        "title": "Local Search, Hill Climbing, and Stochastic Optimization",
        "slug": "ai-systems/109-local-search-hill-climbing-and-stochastic-optimization",
        "status": "live"
      },
      {
        "title": "Adversarial Search: Minimax and Game Values",
        "slug": "ai-systems/110-adversarial-search-minimax-and-game-values",
        "status": "live"
      },
      {
        "title": "Alpha-Beta Pruning and Move Ordering",
        "slug": "ai-systems/111-alpha-beta-pruning-and-move-ordering",
        "status": "live"
      },
      {
        "title": "Imperfect Information and Utility Under Risk",
        "slug": "ai-systems/112-imperfect-information-and-utility-under-risk",
        "status": "live"
      },
      {
        "title": "Constraint Satisfaction Problems and Propagation",
        "slug": "ai-systems/113-constraint-satisfaction-models-and-propagation",
        "status": "live"
      },
      {
        "title": "Backtracking, MRV, LCV, and Constraint Learning",
        "slug": "ai-systems/114-backtracking-mrv-lcv-and-constraint-learning",
        "status": "live"
      },
      {
        "title": "Classical Planning: STRIPS and Plan Graphs",
        "slug": "ai-systems/115-classical-planning-strips-and-plan-graphs",
        "status": "live"
      },
      {
        "title": "Planning Under Time, Resources, and Uncertainty",
        "slug": "ai-systems/116-planning-under-time-resources-and-uncertainty",
        "status": "live"
      },
      {
        "title": "Knowledge Representation: Ontologies and Rules",
        "slug": "ai-systems/117-knowledge-representation-ontologies-and-rules",
        "status": "live"
      },
      {
        "title": "Propositional Logic, Satisfiability, and Resolution",
        "slug": "ai-systems/118-propositional-logic-satisfiability-and-resolution",
        "status": "live"
      },
      {
        "title": "First-Order Logic, Unification, and Rule Inference",
        "slug": "ai-systems/119-first-order-logic-unification-and-rule-inference",
        "status": "live"
      },
      {
        "title": "Reasoning with Uncertainty: Probability and Utility",
        "slug": "ai-systems/120-reasoning-with-uncertainty-probability-and-utility",
        "status": "live"
      },
      {
        "title": "Bayesian Networks, Conditional Independence, and Inference",
        "slug": "ai-systems/121-bayesian-networks-conditional-independence-and-inference",
        "status": "live"
      },
      {
        "title": "Probabilistic Inference, Sampling, and Approximation",
        "slug": "ai-systems/122-probabilistic-inference-sampling-and-approximation",
        "status": "live"
      },
      {
        "title": "Symbolic, Statistical, and Neuro-Symbolic AI",
        "slug": "ai-systems/123-symbolic-statistical-and-neuro-symbolic-ai",
        "status": "live"
      },
      {
        "title": "Expert Systems, Explanations, and Maintenance",
        "slug": "ai-systems/124-expert-systems-explanations-and-maintenance",
        "status": "live"
      },
      {
        "title": "Robotics Perception, State Estimation, and Sensor Fusion",
        "slug": "ai-systems/125-robotics-perception-state-estimation-and-sensor-fusion",
        "status": "live"
      },
      {
        "title": "Robot Motion Planning and Collision Safety",
        "slug": "ai-systems/126-robot-motion-planning-and-collision-safety",
        "status": "live"
      },
      {
        "title": "Robot Control, Feedback, and Safety Envelopes",
        "slug": "ai-systems/127-robot-control-feedback-and-safety-envelopes",
        "status": "live"
      },
      {
        "title": "Multi-Agent Coordination, Communication, and Allocation",
        "slug": "ai-systems/128-multi-agent-coordination-communication-and-allocation",
        "status": "live"
      },
      {
        "title": "Multi-Agent Strategic Behavior, Mechanisms, and Safety",
        "slug": "ai-systems/129-multi-agent-strategic-behavior-mechanisms-and-safety",
        "status": "live"
      },
      {
        "title": "AI Systems Capstone: Assurance Case and Oral Defense",
        "slug": "ai-systems/130-ai-systems-capstone-assurance-case-and-oral-defense",
        "status": "live"
      },
      {
        "title": "Provenance, Consent, and Data Rights",
        "slug": "reliable-ai/201-provenance-consent-and-data-rights",
        "status": "live"
      },
      {
        "title": "Labels, Annotation, and the Limits of Ground Truth",
        "slug": "reliable-ai/202-labels-annotation-and-ground-truth",
        "status": "live"
      },
      {
        "title": "Benchmarks, Evaluations, and Defensible Capability Claims",
        "slug": "reliable-ai/203-benchmarks-evaluations-and-capability-claims",
        "status": "live"
      },
      {
        "title": "Distribution Shift, Robustness, and Monitoring",
        "slug": "reliable-ai/204-distribution-shift-and-robustness",
        "status": "live"
      },
      {
        "title": "Uncertainty, Calibration, and Abstention",
        "slug": "reliable-ai/205-uncertainty-calibration-and-abstention",
        "status": "live"
      },
      {
        "title": "Hallucination, Grounding, and Verification",
        "slug": "reliable-ai/206-hallucination-grounding-and-verification",
        "status": "live"
      },
      {
        "title": "Interpretability, Explanations, and Their Boundaries",
        "slug": "reliable-ai/207-interpretability-and-explanation-boundaries",
        "status": "live"
      },
      {
        "title": "Fairness: Problem Formulation and Measurement",
        "slug": "reliable-ai/208-fairness-problem-formulation-and-measurement",
        "status": "live"
      },
      {
        "title": "Fairness Mitigation and Governance",
        "slug": "reliable-ai/209-fairness-mitigation-and-governance",
        "status": "live"
      },
      {
        "title": "Privacy Threat Modeling and Data Minimization",
        "slug": "reliable-ai/210-privacy-threat-modeling-and-minimization",
        "status": "live"
      },
      {
        "title": "Privacy-Preserving Learning and Release",
        "slug": "reliable-ai/211-privacy-preserving-learning-and-release",
        "status": "live"
      },
      {
        "title": "Adversarial ML and Input Security",
        "slug": "reliable-ai/212-adversarial-ml-and-input-security",
        "status": "live"
      },
      {
        "title": "Model Supply Chain and Artifact Security",
        "slug": "reliable-ai/213-model-supply-chain-and-artifact-security",
        "status": "live"
      },
      {
        "title": "Alignment Objectives and Reward Hacking",
        "slug": "reliable-ai/214-alignment-objectives-and-reward-hacking",
        "status": "live"
      },
      {
        "title": "Human Feedback, Preference Data, and RLHF",
        "slug": "reliable-ai/215-human-feedback-preference-data-and-rlhf",
        "status": "live"
      },
      {
        "title": "Red Teaming and Misuse Evaluation",
        "slug": "reliable-ai/216-red-teaming-and-misuse-evaluation",
        "status": "live"
      },
      {
        "title": "Governance, Risk Tiers, and Accountability",
        "slug": "reliable-ai/217-governance-risk-tiers-and-accountability",
        "status": "live"
      },
      {
        "title": "Audits, Evidence, and Independent Review",
        "slug": "reliable-ai/218-audits-evidence-and-independent-review",
        "status": "live"
      },
      {
        "title": "AI Incidents, Rollback, and Organisational Learning",
        "slug": "reliable-ai/219-incident-response-rollback-and-learning",
        "status": "live"
      },
      {
        "title": "Human-in-the-Loop and Meaningful Oversight",
        "slug": "reliable-ai/220-human-in-the-loop-and-meaningful-oversight",
        "status": "live"
      },
      {
        "title": "Contestability, Appeals, and Recourse",
        "slug": "reliable-ai/221-contestability-appeals-and-recource",
        "status": "live"
      },
      {
        "title": "Societal Impact, Labour, and Power",
        "slug": "reliable-ai/222-societal-impact-labor-and-power",
        "status": "live"
      },
      {
        "title": "Environmental Impact and Compute Governance",
        "slug": "reliable-ai/223-environmental-impact-and-compute-governance",
        "status": "live"
      },
      {
        "title": "Safety Cases and Deployment Assurance",
        "slug": "reliable-ai/224-safety-cases-and-deployment-assurance",
        "status": "live"
      },
      {
        "title": "Case Study: Health and Clinical Support",
        "slug": "reliable-ai/225-case-study-health-and-clinical-support",
        "status": "live"
      },
      {
        "title": "Case Study: Finance and Public Services",
        "slug": "reliable-ai/226-case-study-finance-and-public-services",
        "status": "live"
      },
      {
        "title": "Case Study: Generative Agents in Critical Workflows",
        "slug": "reliable-ai/227-case-study-generative-agents-and-critical-workflows",
        "status": "live"
      },
      {
        "title": "Reliable AI Capstone and Technical Defense",
        "slug": "reliable-ai/228-reliable-ai-capstone-and-technical-defense",
        "status": "live"
      },
      {
        "title": "AI Product Discovery: Outcomes, Users, and Harm",
        "slug": "applied-ai/301-ai-product-discovery-outcomes-and-harm",
        "status": "live"
      },
      {
        "title": "Choosing Rules, Classical ML, Deep Learning, or an LLM",
        "slug": "applied-ai/302-choosing-rules-classical-ml-deep-learning-or-llm",
        "status": "live"
      },
      {
        "title": "Data Pipelines, Lineage, and Data Contracts",
        "slug": "applied-ai/303-data-pipelines-lineage-and-data-contracts",
        "status": "live"
      },
      {
        "title": "Supervised Learning in the Product Loop",
        "slug": "applied-ai/304-supervised-learning-product-loop",
        "status": "live"
      },
      {
        "title": "Unsupervised Learning for Discovery, Not Automatic Truth",
        "slug": "applied-ai/305-unsupervised-learning-discovery-and-guardrails",
        "status": "live"
      },
      {
        "title": "Self-Supervised Learning: Data, Representations, and Transfer",
        "slug": "applied-ai/306-self-supervised-learning-data-and-transfer",
        "status": "live"
      },
      {
        "title": "Reinforcement Learning: Product Suitability and Safe Constraints",
        "slug": "applied-ai/307-reinforcement-learning-product-suitability",
        "status": "live"
      },
      {
        "title": "Training and Inference Economics",
        "slug": "applied-ai/308-training-and-inference-economics",
        "status": "live"
      },
      {
        "title": "Embeddings, Similarity, and Index Design",
        "slug": "applied-ai/309-embeddings-similarity-and-index-design",
        "status": "live"
      },
      {
        "title": "Retrieval-Augmented Generation and Grounded Answers",
        "slug": "applied-ai/310-retrieval-augmented-generation-grounding",
        "status": "live"
      },
      {
        "title": "Agents, Tools, and Approval Boundaries",
        "slug": "applied-ai/311-agents-tools-and-approval-boundaries",
        "status": "live"
      },
      {
        "title": "Multimodal AI: Inputs, Fusion, and Evaluation",
        "slug": "applied-ai/312-multimodal-ai-inputs-fusion-and-evaluation",
        "status": "live"
      },
      {
        "title": "Experimentation, A/B Tests, and Decision Quality",
        "slug": "applied-ai/313-experimentation-ab-tests-and-decision-quality",
        "status": "live"
      },
      {
        "title": "Evaluation Evidence and Human Review",
        "slug": "applied-ai/314-evaluation-evidence-and-human-review",
        "status": "live"
      },
      {
        "title": "Monitoring, Drift, and Incident Response",
        "slug": "applied-ai/315-monitoring-drift-and-incident-response",
        "status": "live"
      },
      {
        "title": "Applied Case: Healthcare AI and Clinical Workflow Safety",
        "slug": "applied-ai/316-healthcare-ai-clinical-workflows-and-safety",
        "status": "live"
      },
      {
        "title": "Applied Case: Education AI, Learning, and Assessment Integrity",
        "slug": "applied-ai/317-education-ai-learning-and-assessment-integrity",
        "status": "live"
      },
      {
        "title": "Applied Case: Finance AI, Controls, Fairness, and Model Risk",
        "slug": "applied-ai/318-finance-ai-controls-fairness-and-model-risk",
        "status": "live"
      },
      {
        "title": "Applied Case: Manufacturing AI for Quality and Maintenance",
        "slug": "applied-ai/319-manufacturing-ai-quality-and-maintenance",
        "status": "live"
      },
      {
        "title": "Applied Case: Public-Sector AI, Procurement, and Accountability",
        "slug": "applied-ai/320-public-sector-ai-procurement-and-accountability",
        "status": "live"
      },
      {
        "title": "Privacy, Security, and Sensitive Data in Applied AI",
        "slug": "applied-ai/321-privacy-security-and-sensitive-data",
        "status": "live"
      },
      {
        "title": "Deployment, Release Strategy, and Safe Fallbacks",
        "slug": "applied-ai/322-deployment-release-strategy-and-fallbacks",
        "status": "live"
      },
      {
        "title": "Applied AI Architecture Review",
        "slug": "applied-ai/323-applied-ai-architecture-review",
        "status": "live"
      },
      {
        "title": "Applied AI Project Gates and the Model Card",
        "slug": "applied-ai/324-applied-ai-project-gates-and-model-card",
        "status": "live"
      },
      {
        "title": "Applied AI Staged Capstone and Technical Defense",
        "slug": "applied-ai/325-applied-ai-staged-capstone-and-defense",
        "status": "live"
      },
      {
        "title": "Activation Functions: Why Networks Aren't Just Linear Algebra",
        "slug": "activation-functions",
        "status": "live"
      },
      {
        "title": "Sigmoid, Tanh, ReLU, GELU: Which and Why",
        "slug": "activation-functions-compared",
        "status": "live"
      },
      {
        "title": "A Chatbot Grows a Tool Loop",
        "slug": "agents-vs-chatbots-worked-example",
        "status": "live"
      },
      {
        "title": "AI Agents vs. Chatbots",
        "slug": "ai-agents-vs-chatbots",
        "status": "live"
      },
      {
        "title": "AI Alignment and Safety, Briefly",
        "slug": "ai-alignment-and-safety-basics",
        "status": "live"
      },
      {
        "title": "The AI Hardware Stack: GPUs, TPUs, and Why They Matter",
        "slug": "ai-hardware-stack",
        "status": "live"
      },
      {
        "title": "AI, ML, and Deep Learning as Nested Fields",
        "slug": "ai-ml-dl-as-nested-fields",
        "status": "live"
      },
      {
        "title": "AI vs. Machine Learning vs. Deep Learning",
        "slug": "ai-vs-ml-vs-deep-learning",
        "status": "live"
      },
      {
        "title": "Reward Hacking and Sycophancy, Concretely",
        "slug": "alignment-failure-case-studies",
        "status": "live"
      },
      {
        "title": "The Hard Part Is Saying What You Want",
        "slug": "alignment-specifying-what-we-want",
        "status": "live"
      },
      {
        "title": "One Backprop Step, Fully Worked",
        "slug": "backprop-worked-example",
        "status": "live"
      },
      {
        "title": "Backpropagation: Credit Assignment via the Chain Rule",
        "slug": "backpropagation-explained",
        "status": "live"
      },
      {
        "title": "AI Benchmarks and What They Miss",
        "slug": "benchmarks-and-what-they-miss",
        "status": "live"
      },
      {
        "title": "The Bias-Variance Tradeoff",
        "slug": "bias-variance-tradeoff",
        "status": "live"
      },
      {
        "title": "Sweeping Model Complexity",
        "slug": "bias-variance-worked-example",
        "status": "live"
      },
      {
        "title": "Building a Neuron and a Layer in NumPy",
        "slug": "building-a-neuron-in-numpy",
        "status": "live"
      },
      {
        "title": "Building a Small Eval You Can Trust",
        "slug": "building-an-eval-set-worked-example",
        "status": "live"
      },
      {
        "title": "Capabilities & Evaluation: What Would You Trust?",
        "slug": "capabilities-and-eval-quiz",
        "status": "live"
      },
      {
        "title": "Capstone: Train and Evaluate a Classifier From Scratch",
        "slug": "capstone-build-train-evaluate-a-classifier",
        "status": "live"
      },
      {
        "title": "A Decision Framework for Picking a Model",
        "slug": "choosing-a-model-decision-framework",
        "status": "live"
      },
      {
        "title": "Classification vs. Regression: The Two Basic Prediction Tasks",
        "slug": "classification-vs-regression",
        "status": "live"
      },
      {
        "title": "Cosine Similarity and Nearest Neighbors in NumPy",
        "slug": "computing-embedding-similarity-in-numpy",
        "status": "live"
      },
      {
        "title": "Splits, Leakage, and the Lie of a Good Score",
        "slug": "data-splits-and-leakage-worked-example",
        "status": "live"
      },
      {
        "title": "Embeddings: Geometry of Meaning",
        "slug": "embeddings-quiz",
        "status": "live"
      },
      {
        "title": "king - man + woman: Reading Meaning as Arrows",
        "slug": "embeddings-word-analogies-example",
        "status": "live"
      },
      {
        "title": "Foundation Models & LLMs: Check Your Model",
        "slug": "foundation-models-and-llms-quiz",
        "status": "live"
      },
      {
        "title": "Foundation Models, Explained",
        "slug": "foundation-models-explained",
        "status": "live"
      },
      {
        "title": "Generalization vs. Overfitting",
        "slug": "generalization-and-overfitting",
        "status": "live"
      },
      {
        "title": "Generalization: Will It Hold Up?",
        "slug": "generalization-quiz",
        "status": "live"
      },
      {
        "title": "Gradient Descent: The Engine of Learning",
        "slug": "gradient-descent-explained",
        "status": "live"
      },
      {
        "title": "Fitting a Line With Gradient Descent in NumPy",
        "slug": "gradient-descent-in-numpy",
        "status": "live"
      },
      {
        "title": "From Prompt to Next Token, Traced",
        "slug": "how-llms-work-end-to-end-example",
        "status": "live"
      },
      {
        "title": "How Modern AI Fits Together",
        "slug": "how-modern-ai-fits-together",
        "status": "live"
      },
      {
        "title": "Why Inference Is Bottlenecked by Memory, Not Math",
        "slug": "inference-cost-and-latency-intuition",
        "status": "live"
      },
      {
        "title": "Interpretability: Peering Inside the Black Box",
        "slug": "interpretability-black-box-problem",
        "status": "live"
      },
      {
        "title": "Ways to Peek Inside the Box",
        "slug": "interpretability-methods-overview",
        "status": "live"
      },
      {
        "title": "Which Kind of Learning Is This?",
        "slug": "learning-paradigms-quiz",
        "status": "live"
      },
      {
        "title": "Loss Functions: How a Model Knows It's Wrong",
        "slug": "loss-functions-explained",
        "status": "live"
      },
      {
        "title": "MSE vs. Cross-Entropy on Real Numbers",
        "slug": "loss-functions-worked-examples",
        "status": "live"
      },
      {
        "title": "Narrow AI vs. General AI",
        "slug": "narrow-ai-vs-general-ai",
        "status": "live"
      },
      {
        "title": "Narrow vs. General AI in Practice",
        "slug": "narrow-vs-general-ai-in-practice",
        "status": "live"
      },
      {
        "title": "A Forward Pass, One Number at a Time",
        "slug": "neural-network-forward-pass-by-hand",
        "status": "live"
      },
      {
        "title": "Neural Networks: Trace and Predict",
        "slug": "neural-networks-quiz",
        "status": "live"
      },
      {
        "title": "Open Weights or an API? Two Scenarios",
        "slug": "open-vs-closed-and-hardware-tradeoffs",
        "status": "live"
      },
      {
        "title": "Open-Weight vs. Closed Models",
        "slug": "open-weight-vs-closed-models",
        "status": "live"
      },
      {
        "title": "Orientation: Check Your Map",
        "slug": "orientation-quiz",
        "status": "live"
      },
      {
        "title": "Overfitting You Can See",
        "slug": "overfitting-visual-intuition",
        "status": "live"
      },
      {
        "title": "Choosing & Running: Make the Call",
        "slug": "practical-models-quiz",
        "status": "live"
      },
      {
        "title": "Pretraining vs. Fine-Tuning: Two Different Jobs",
        "slug": "pretraining-vs-finetuning",
        "status": "live"
      },
      {
        "title": "Regularization: Making Models Simpler on Purpose",
        "slug": "regularization-techniques",
        "status": "live"
      },
      {
        "title": "Reinforcement Learning: Learning From Reward",
        "slug": "reinforcement-learning-basics",
        "status": "live"
      },
      {
        "title": "Learning From Reward in a 4x4 Grid",
        "slug": "reinforcement-learning-gridworld-example",
        "status": "live"
      },
      {
        "title": "How a Base Model Becomes a Helpful Assistant",
        "slug": "rlhf-and-instruction-tuning",
        "status": "live"
      },
      {
        "title": "Safety & Interpretability: Reason About Risk",
        "slug": "safety-and-interpretability-quiz",
        "status": "live"
      },
      {
        "title": "Scaling Laws: Why Bigger Models Keep Getting Better",
        "slug": "scaling-laws",
        "status": "live"
      },
      {
        "title": "Trading Compute, Data, and Parameters",
        "slug": "scaling-laws-worked-example",
        "status": "live"
      },
      {
        "title": "Self-Supervised Learning: Training Without Labels",
        "slug": "self-supervised-learning",
        "status": "live"
      },
      {
        "title": "How Text Becomes Its Own Answer Key",
        "slug": "self-supervised-next-token-example",
        "status": "live"
      },
      {
        "title": "Supervised Learning, Explained",
        "slug": "supervised-learning-explained",
        "status": "live"
      },
      {
        "title": "Supervised Learning, Worked by Hand",
        "slug": "supervised-learning-worked-example",
        "status": "live"
      },
      {
        "title": "The Data the Model Learned From",
        "slug": "the-data-the-model-learned-from",
        "status": "live"
      },
      {
        "title": "Counting Tokens and Pricing a Call",
        "slug": "tokens-and-cost-worked-example",
        "status": "live"
      },
      {
        "title": "Train/Validation/Test Splits, Done Right",
        "slug": "train-validation-test-splits",
        "status": "live"
      },
      {
        "title": "Training & Optimization: Debug the Run",
        "slug": "training-and-optimization-quiz",
        "status": "live"
      },
      {
        "title": "Training vs. Inference",
        "slug": "training-vs-inference",
        "status": "live"
      },
      {
        "title": "Finding Groups Nobody Labeled",
        "slug": "unsupervised-clustering-worked-example",
        "status": "live"
      },
      {
        "title": "Unsupervised Learning: Finding Structure Without Labels",
        "slug": "unsupervised-learning",
        "status": "live"
      },
      {
        "title": "What a Model Actually Is",
        "slug": "what-a-model-actually-is",
        "status": "live"
      },
      {
        "title": "What Embeddings Are",
        "slug": "what-embeddings-are",
        "status": "live"
      },
      {
        "title": "What a Neural Network Actually Is",
        "slug": "what-is-a-neural-network",
        "status": "live"
      },
      {
        "title": "A Mental Model for What LLMs Can and Can't Do",
        "slug": "what-llms-can-and-cannot-do",
        "status": "live"
      },
      {
        "title": "Four Prompts That Reveal the Edges",
        "slug": "what-llms-can-and-cannot-do-case-studies",
        "status": "live"
      },
      {
        "title": "Why LLMs Hallucinate",
        "slug": "why-llms-hallucinate",
        "status": "live"
      },
      {
        "title": "Why Stacking Linear Layers Gains You Nothing",
        "slug": "why-nonlinearity-matters",
        "status": "live"
      }
    ]
  },
  {
    "id": "llm-foundations",
    "n": "07",
    "name": "LLM Foundations",
    "group": "Foundations",
    "meta": "131 lessons",
    "summary": "How large language models work under the hood, from tokenization through attention and pretraining to the fine-tuning that makes them useful assistants.",
    "nodes": [
      {
        "title": "The Whole Game: One Token, End to End",
        "slug": "whole-game-one-token-end-to-end",
        "status": "live"
      },
      {
        "title": "Tokenization: How Text Becomes Tokens",
        "slug": "tokenization-explained",
        "status": "live"
      },
      {
        "title": "Why Models Use Tokens, Not Characters or Words",
        "slug": "why-models-need-tokens-not-characters",
        "status": "live"
      },
      {
        "title": "The Vocab-Size vs Sequence-Length Tradeoff",
        "slug": "vocab-size-vs-sequence-length-tradeoff",
        "status": "live"
      },
      {
        "title": "Build Byte-Pair Encoding From Scratch",
        "slug": "build-bpe-from-scratch",
        "status": "live"
      },
      {
        "title": "Tokenizing Tricky Strings",
        "slug": "tokenizing-tricky-strings",
        "status": "live"
      },
      {
        "title": "BPE vs WordPiece vs Unigram vs Byte-Level",
        "slug": "bpe-vs-wordpiece-vs-unigram",
        "status": "live"
      },
      {
        "title": "Tokenization Gotchas That Break Prompts",
        "slug": "tokenization-gotchas-that-break-prompts",
        "status": "live"
      },
      {
        "title": "Why LLMs Struggle With Arithmetic and Spelling",
        "slug": "why-llms-are-bad-at-arithmetic-and-spelling",
        "status": "live"
      },
      {
        "title": "The Embedding Lookup Table",
        "slug": "the-embedding-lookup-table",
        "status": "live"
      },
      {
        "title": "What Lives in Embedding Space",
        "slug": "what-lives-in-embedding-space",
        "status": "live"
      },
      {
        "title": "Finding Nearest Neighbors in an Embedding Matrix",
        "slug": "nearest-neighbors-in-an-embedding-matrix",
        "status": "live"
      },
      {
        "title": "Why Order Needs Positional Encoding",
        "slug": "why-order-needs-positional-encoding",
        "status": "live"
      },
      {
        "title": "Sinusoidal vs Learned vs RoPE vs ALiBi",
        "slug": "sinusoidal-vs-learned-vs-rope-vs-alibi",
        "status": "live"
      },
      {
        "title": "Implement Rotary Position Embeddings in Numpy",
        "slug": "implement-rope-in-numpy",
        "status": "live"
      },
      {
        "title": "Context Extrapolation and RoPE Scaling",
        "slug": "context-extrapolation-and-rope-scaling",
        "status": "live"
      },
      {
        "title": "Quiz: Tokenization and Embeddings",
        "slug": "tokenization-embeddings-quiz",
        "status": "live"
      },
      {
        "title": "Embeddings: Turning Tokens Into Geometry",
        "slug": "what-are-embeddings",
        "status": "live"
      },
      {
        "title": "The Attention Mechanism, Explained",
        "slug": "attention-mechanism-explained",
        "status": "live"
      },
      {
        "title": "Positional Encoding: How Transformers Track Order",
        "slug": "positional-encoding-explained",
        "status": "live"
      },
      {
        "title": "The Transformer Architecture",
        "slug": "the-transformer-architecture",
        "status": "live"
      },
      {
        "title": "Attention as a Soft, Differentiable Lookup",
        "slug": "attention-as-soft-lookup",
        "status": "live"
      },
      {
        "title": "Queries, Keys, and Values: The Library Metaphor",
        "slug": "queries-keys-values-library-metaphor",
        "status": "live"
      },
      {
        "title": "Scaled Dot-Product Attention in Numpy",
        "slug": "scaled-dot-product-attention-in-numpy",
        "status": "live"
      },
      {
        "title": "Why Divide by the Square Root of d_k",
        "slug": "why-divide-by-sqrt-dk",
        "status": "live"
      },
      {
        "title": "Causal Masking Mechanics",
        "slug": "causal-masking-mechanics",
        "status": "live"
      },
      {
        "title": "Watching the Mask Change the Softmax",
        "slug": "watching-the-mask-change-the-softmax",
        "status": "live"
      },
      {
        "title": "Multi-Head Attention: Why Many Heads",
        "slug": "multi-head-attention-why-many-heads",
        "status": "live"
      },
      {
        "title": "Implement Multi-Head Attention",
        "slug": "implement-multi-head-attention",
        "status": "live"
      },
      {
        "title": "What Different Attention Heads Learn",
        "slug": "what-different-heads-learn",
        "status": "live"
      },
      {
        "title": "The Feed-Forward Block and Its Role",
        "slug": "the-feed-forward-block-role",
        "status": "live"
      },
      {
        "title": "The Feed-Forward Block as Key-Value Memory",
        "slug": "ffn-as-key-value-memory",
        "status": "live"
      },
      {
        "title": "The Residual Stream and Layer Norm",
        "slug": "residual-stream-and-layer-norm",
        "status": "live"
      },
      {
        "title": "Why Pre-Norm Won, and What RMSNorm Changes",
        "slug": "why-pre-norm-won-and-rmsnorm",
        "status": "live"
      },
      {
        "title": "Assemble One Full Transformer Block",
        "slug": "assemble-one-full-transformer-block",
        "status": "live"
      },
      {
        "title": "Transformer Block Wiring Bugs",
        "slug": "transformer-block-wiring-bugs",
        "status": "live"
      },
      {
        "title": "Quiz: The Transformer Block",
        "slug": "transformer-block-quiz",
        "status": "live"
      },
      {
        "title": "Next-Token Prediction: The One Objective",
        "slug": "next-token-prediction",
        "status": "live"
      },
      {
        "title": "What a Language Model Actually Computes",
        "slug": "what-a-language-model-actually-computes",
        "status": "live"
      },
      {
        "title": "Why Predicting the Next Word Is Enough",
        "slug": "why-next-word-prediction-is-enough",
        "status": "live"
      },
      {
        "title": "From Logits to Probabilities, by Hand",
        "slug": "logits-to-probabilities-by-hand",
        "status": "live"
      },
      {
        "title": "The Autoregressive Generation Loop",
        "slug": "the-autoregressive-generation-loop",
        "status": "live"
      },
      {
        "title": "Generating a Sentence Token by Token",
        "slug": "generating-a-sentence-token-by-token",
        "status": "live"
      },
      {
        "title": "The Forward Pass as a Stack of Identical Blocks",
        "slug": "the-forward-pass-as-a-stack-of-blocks",
        "status": "live"
      },
      {
        "title": "Parameters, Activations, and Data: Three Things People Confuse",
        "slug": "parameters-activations-and-data",
        "status": "live"
      },
      {
        "title": "Training Time vs Inference Time",
        "slug": "training-time-vs-inference-time",
        "status": "live"
      },
      {
        "title": "The Vocabulary and the Unembedding Head",
        "slug": "the-vocabulary-and-the-unembedding",
        "status": "live"
      },
      {
        "title": "Reading a Real Model's Config and Counting Its Parameters",
        "slug": "reading-a-real-model-config",
        "status": "live"
      },
      {
        "title": "Myths About How LLMs Work",
        "slug": "myths-about-how-llms-work",
        "status": "live"
      },
      {
        "title": "Counting the FLOPs of One Token",
        "slug": "counting-the-flops-of-one-token",
        "status": "live"
      },
      {
        "title": "Quiz: The Whole Game",
        "slug": "whole-game-quiz",
        "status": "live"
      },
      {
        "title": "Pretraining: Learning From the Whole Internet",
        "slug": "pretraining-explained",
        "status": "live"
      },
      {
        "title": "The Pretraining Objective and Its Loss",
        "slug": "the-pretraining-objective-and-loss",
        "status": "live"
      },
      {
        "title": "What the Internet Actually Teaches a Model",
        "slug": "what-the-internet-teaches-a-model",
        "status": "live"
      },
      {
        "title": "Computing Cross-Entropy and Perplexity by Hand",
        "slug": "cross-entropy-and-perplexity-worked",
        "status": "live"
      },
      {
        "title": "Inside the Pretraining Data Pipeline",
        "slug": "pretraining-data-pipeline",
        "status": "live"
      },
      {
        "title": "Optimization Mechanics: AdamW, Warmup, and Schedules",
        "slug": "optimization-mechanics-adam-warmup",
        "status": "live"
      },
      {
        "title": "Training at Scale: Parallelism and Precision",
        "slug": "training-at-scale-parallelism-precision",
        "status": "live"
      },
      {
        "title": "From Base Model to Assistant: The Pipeline Map",
        "slug": "from-base-model-to-assistant-pipeline",
        "status": "live"
      },
      {
        "title": "Supervised Fine-Tuning Mechanics",
        "slug": "supervised-fine-tuning-mechanics",
        "status": "live"
      },
      {
        "title": "RLHF: Reward Models and PPO",
        "slug": "rlhf-reward-models-and-ppo",
        "status": "live"
      },
      {
        "title": "RLHF vs DPO vs Other Preference Methods",
        "slug": "rlhf-vs-dpo-vs-preference-methods",
        "status": "live"
      },
      {
        "title": "Reading a DPO Loss and a Preference Pair",
        "slug": "reading-a-dpo-loss-and-preference-pair",
        "status": "live"
      },
      {
        "title": "Base vs Instruct vs Chat vs Reasoning Models",
        "slug": "base-instruct-chat-reasoning-families",
        "status": "live"
      },
      {
        "title": "The Alignment Tax: Reward Hacking and Sycophancy",
        "slug": "alignment-tax-reward-hacking-sycophancy",
        "status": "live"
      },
      {
        "title": "Fine-Tuning Mistakes and Catastrophic Forgetting",
        "slug": "fine-tuning-mistakes-forgetting",
        "status": "live"
      },
      {
        "title": "Quiz: The Training Pipeline",
        "slug": "training-pipeline-quiz",
        "status": "live"
      },
      {
        "title": "Context Window Mechanics",
        "slug": "context-window-mechanics",
        "status": "live"
      },
      {
        "title": "Sampling: Temperature, Top-k, and Top-p",
        "slug": "sampling-temperature-top-p",
        "status": "live"
      },
      {
        "title": "From Logits to a Chosen Token",
        "slug": "from-logits-to-a-chosen-token",
        "status": "live"
      },
      {
        "title": "Implement Temperature, Top-k, and Top-p",
        "slug": "implement-temperature-top-k-top-p",
        "status": "live"
      },
      {
        "title": "Temperature as Flattening the Distribution",
        "slug": "temperature-as-flattening",
        "status": "live"
      },
      {
        "title": "Greedy, Beam, Nucleus, and Min-p Decoding",
        "slug": "greedy-beam-sampling-min-p",
        "status": "live"
      },
      {
        "title": "Sampling Parameter Mistakes",
        "slug": "sampling-parameter-mistakes",
        "status": "live"
      },
      {
        "title": "Repetition Penalties and Constrained Decoding",
        "slug": "repetition-penalties-and-constrained-decoding",
        "status": "live"
      },
      {
        "title": "The KV Cache: What It Is and Why It Exists",
        "slug": "the-kv-cache-what-and-why",
        "status": "live"
      },
      {
        "title": "The KV Cache Step by Step",
        "slug": "kv-cache-step-by-step-shapes",
        "status": "live"
      },
      {
        "title": "Prefill vs Decode: Why Inference Is Memory-Bound",
        "slug": "prefill-vs-decode-memory-bound",
        "status": "live"
      },
      {
        "title": "Context Window Mechanics and Limits",
        "slug": "context-window-mechanics-and-limits",
        "status": "live"
      },
      {
        "title": "The Lost-in-the-Middle Effect",
        "slug": "the-lost-in-the-middle-effect",
        "status": "live"
      },
      {
        "title": "Speculative Decoding Mechanics",
        "slug": "speculative-decoding-mechanics",
        "status": "live"
      },
      {
        "title": "Speculative Decoding: An Acceptance Walkthrough",
        "slug": "speculative-decoding-acceptance-walkthrough",
        "status": "live"
      },
      {
        "title": "Quantization and Inference Serving",
        "slug": "quantization-and-inference-serving",
        "status": "live"
      },
      {
        "title": "Quiz: Decoding and Inference",
        "slug": "decoding-inference-quiz",
        "status": "live"
      },
      {
        "title": "Instruction Tuning and RLHF",
        "slug": "instruction-tuning-and-rlhf",
        "status": "live"
      },
      {
        "title": "Emergent Abilities in LLMs",
        "slug": "emergent-abilities-in-llms",
        "status": "live"
      },
      {
        "title": "Scaling Laws: What They Predict",
        "slug": "scaling-laws-what-they-predict",
        "status": "live"
      },
      {
        "title": "Using a Scaling Law to Plan a Training Run",
        "slug": "using-a-scaling-law-to-plan-a-run",
        "status": "live"
      },
      {
        "title": "Emergent Abilities and the Mirage Debate",
        "slug": "emergent-abilities-and-the-mirage-debate",
        "status": "live"
      },
      {
        "title": "Grokking and Double Descent Mechanics",
        "slug": "grokking-and-double-descent-mechanics",
        "status": "live"
      },
      {
        "title": "In-Context Learning Mechanics",
        "slug": "in-context-learning-mechanics",
        "status": "live"
      },
      {
        "title": "Few-Shot vs Zero-Shot: Worked Prompts",
        "slug": "few-shot-vs-zero-shot-worked",
        "status": "live"
      },
      {
        "title": "Is In-Context Learning Implicit Gradient Descent?",
        "slug": "is-in-context-learning-gradient-descent",
        "status": "live"
      },
      {
        "title": "Chain of Thought and Test-Time Compute",
        "slug": "chain-of-thought-and-test-time-compute",
        "status": "live"
      },
      {
        "title": "How Reasoning Models Are Trained",
        "slug": "how-reasoning-models-are-trained",
        "status": "live"
      },
      {
        "title": "Why LLMs Hallucinate",
        "slug": "why-llms-hallucinate",
        "status": "live"
      },
      {
        "title": "A Hallucination Taxonomy and Its Mitigations",
        "slug": "hallucination-taxonomy-and-mitigations",
        "status": "live"
      },
      {
        "title": "Multimodal LLMs: How Images Become Tokens",
        "slug": "multimodal-how-images-become-tokens",
        "status": "live"
      },
      {
        "title": "Fine-Tuning vs Prompting vs RAG: When to Use What",
        "slug": "fine-tuning-vs-prompting-vs-rag",
        "status": "live"
      },
      {
        "title": "LLM Internals Reference Card",
        "slug": "llm-internals-reference-card",
        "status": "live"
      },
      {
        "title": "Quiz: Behavior, Capabilities, and Limits",
        "slug": "behavior-and-capstone-quiz",
        "status": "live"
      },
      {
        "title": "Mixture of Experts, Explained",
        "slug": "mixture-of-experts-explained",
        "status": "live"
      },
      {
        "title": "The Quadratic Attention Bottleneck",
        "slug": "the-quadratic-attention-bottleneck",
        "status": "live"
      },
      {
        "title": "Multi-Query and Grouped-Query Attention",
        "slug": "multi-query-and-grouped-query-attention",
        "status": "live"
      },
      {
        "title": "KV Cache Memory: MHA vs GQA vs MQA",
        "slug": "kv-cache-memory-mha-vs-gqa",
        "status": "live"
      },
      {
        "title": "FlashAttention: The Tiling and Online-Softmax Idea",
        "slug": "flash-attention-intuition-and-tiling",
        "status": "live"
      },
      {
        "title": "Sparse, Sliding-Window, and Linear Attention",
        "slug": "sparse-sliding-and-linear-attention",
        "status": "live"
      },
      {
        "title": "Mixture of Experts: Routing",
        "slug": "mixture-of-experts-routing",
        "status": "live"
      },
      {
        "title": "Why MoE Buys Capacity Without Proportional Compute",
        "slug": "why-moe-buys-capacity-without-compute",
        "status": "live"
      },
      {
        "title": "A Toy MoE Router in Numpy",
        "slug": "toy-moe-router-in-numpy",
        "status": "live"
      },
      {
        "title": "MoE Load Balancing and Its Failure Modes",
        "slug": "moe-load-balancing-and-failure-modes",
        "status": "live"
      },
      {
        "title": "Beyond Attention: State-Space Models and Mamba",
        "slug": "attention-alternatives-ssms-and-mamba",
        "status": "live"
      },
      {
        "title": "The Modern LLM Stack: RMSNorm, SwiGLU, and No Biases",
        "slug": "modern-llm-normalization-and-activations",
        "status": "live"
      },
      {
        "title": "Dense vs MoE vs GQA: Reading Real Design Choices",
        "slug": "dense-vs-moe-vs-gqa-design-choices",
        "status": "live"
      },
      {
        "title": "Misreading Parameter Counts",
        "slug": "misreading-parameter-counts",
        "status": "live"
      },
      {
        "title": "Quiz: Efficient Architectures",
        "slug": "efficient-architectures-quiz",
        "status": "live"
      },
      {
        "title": "Model Families: Base, Instruct, Chat, Reasoning",
        "slug": "model-families-and-variants",
        "status": "live"
      },
      {
        "title": "Multimodal LLMs, Explained",
        "slug": "multimodal-llms-explained",
        "status": "live"
      },
      {
        "title": "Byte-Pair Encoding: How Tokenizers Are Actually Built",
        "slug": "byte-pair-encoding",
        "status": "live"
      },
      {
        "title": "Multi-Head Attention: Why One Attention Pattern Isn't Enough",
        "slug": "multi-head-attention",
        "status": "live"
      },
      {
        "title": "Causal Masking: Why LLMs Can't Peek Ahead",
        "slug": "causal-masking",
        "status": "live"
      },
      {
        "title": "The Feed-Forward Block: The Transformer's Other Half",
        "slug": "the-feed-forward-block",
        "status": "live"
      },
      {
        "title": "Residual Connections and Layer Norm",
        "slug": "residual-connections-and-layer-norm",
        "status": "live"
      },
      {
        "title": "RoPE: Rotary Position Embeddings Explained",
        "slug": "rotary-position-embeddings",
        "status": "live"
      },
      {
        "title": "The KV Cache: How LLMs Avoid Recomputing the Past",
        "slug": "the-kv-cache",
        "status": "live"
      },
      {
        "title": "Grouped-Query and Multi-Query Attention",
        "slug": "grouped-query-attention",
        "status": "live"
      },
      {
        "title": "In-Context Learning: Why Few-Shot Examples Work at All",
        "slug": "in-context-learning",
        "status": "live"
      },
      {
        "title": "Reasoning Models and Test-Time Compute",
        "slug": "reasoning-models-test-time-compute",
        "status": "live"
      },
      {
        "title": "Speculative Decoding: Generating Tokens Faster",
        "slug": "speculative-decoding",
        "status": "live"
      },
      {
        "title": "Grokking and Double Descent",
        "slug": "grokking-and-double-descent",
        "status": "live"
      },
      {
        "title": "Capstone: Build a Tiny GPT and Watch It Learn",
        "slug": "build-a-tiny-gpt-capstone",
        "status": "live"
      }
    ]
  },
  {
    "id": "classical-ai",
    "n": "08",
    "name": "Classical AI",
    "group": "Classical ML",
    "meta": "83 lessons",
    "summary": "Search, logic, planning, and the pre-deep-learning ideas that still underpin modern systems.",
    "nodes": [
      {
        "title": "State Spaces: Representation, Actions, Goals, and Costs",
        "slug": "search-planning/101-state-spaces-representation-actions-goals-and-costs",
        "status": "live"
      },
      {
        "title": "Graph Search Contracts: Tree Search, Graph Search, and Explored Sets",
        "slug": "search-planning/102-graph-search-contracts-tree-search-graph-search-and-explored-sets",
        "status": "live"
      },
      {
        "title": "Breadth-First Search: Completeness, Depth, and Memory",
        "slug": "search-planning/103-breadth-first-search-completeness-depth-and-memory",
        "status": "live"
      },
      {
        "title": "Depth-First Search: Stack Discipline, Cycles, and Depth Limits",
        "slug": "search-planning/104-depth-first-search-stack-discipline-cycles-and-depth-limits",
        "status": "live"
      },
      {
        "title": "Uniform-Cost Search: Costs, Reopens, and Dijkstra’s Invariant",
        "slug": "search-planning/105-uniform-cost-search-costs-reopens-and-dijkstra-s-invariant",
        "status": "live"
      },
      {
        "title": "A* Search: f = g + h and Optimal Frontier Reasoning",
        "slug": "search-planning/106-a-search-f-g-h-and-optimal-frontier-reasoning",
        "status": "live"
      },
      {
        "title": "Heuristics: Admissibility, Consistency, Dominance, and Relaxations",
        "slug": "search-planning/107-heuristics-admissibility-consistency-dominance-and-relaxations",
        "status": "live"
      },
      {
        "title": "Bidirectional Search: Meeting Frontiers and Reverse Operators",
        "slug": "search-planning/108-bidirectional-search-meeting-frontiers-and-reverse-operators",
        "status": "live"
      },
      {
        "title": "Iterative Deepening and Memory-Bounded Search",
        "slug": "search-planning/109-iterative-deepening-and-memory-bounded-search",
        "status": "live"
      },
      {
        "title": "Local Search: Hill Climbing, Plateaus, and Restarts",
        "slug": "search-planning/110-local-search-hill-climbing-plateaus-and-restarts",
        "status": "live"
      },
      {
        "title": "Stochastic Search: Simulated Annealing, Beam Search, and Evolutionary Methods",
        "slug": "search-planning/111-stochastic-search-simulated-annealing-beam-search-and-evolutionary-methods",
        "status": "live"
      },
      {
        "title": "Adversarial Search: Games, Utilities, and Minimax",
        "slug": "search-planning/112-adversarial-search-games-utilities-and-minimax",
        "status": "live"
      },
      {
        "title": "Alpha-Beta Pruning: Bounds, Move Ordering, and Exactness",
        "slug": "search-planning/113-alpha-beta-pruning-bounds-move-ordering-and-exactness",
        "status": "live"
      },
      {
        "title": "Monte Carlo Tree Search: Selection, Expansion, Rollouts, and Backup",
        "slug": "search-planning/114-monte-carlo-tree-search-selection-expansion-rollouts-and-backup",
        "status": "live"
      },
      {
        "title": "Constraint Satisfaction Problems: Variables, Domains, and Constraints",
        "slug": "search-planning/115-constraint-satisfaction-problems-variables-domains-and-constraints",
        "status": "live"
      },
      {
        "title": "CSP Propagation: Arc Consistency, Forward Checking, and Global Constraints",
        "slug": "search-planning/116-csp-propagation-arc-consistency-forward-checking-and-global-constraints",
        "status": "live"
      },
      {
        "title": "CSP Backtracking: Variable Ordering, Value Ordering, and Conflict Learning",
        "slug": "search-planning/117-csp-backtracking-variable-ordering-value-ordering-and-conflict-learning",
        "status": "live"
      },
      {
        "title": "STRIPS Planning: Preconditions, Effects, and Plan Validation",
        "slug": "search-planning/118-strips-planning-preconditions-effects-and-plan-validation",
        "status": "live"
      },
      {
        "title": "Forward and Backward Planning: Progression, Regression, and Relevance",
        "slug": "search-planning/119-forward-and-backward-planning-progression-regression-and-relevance",
        "status": "live"
      },
      {
        "title": "Partial-Order Planning: Causal Links, Threats, and Least Commitment",
        "slug": "search-planning/120-partial-order-planning-causal-links-threats-and-least-commitment",
        "status": "live"
      },
      {
        "title": "Hierarchical Task Networks: Decomposition, Methods, and Operational Knowledge",
        "slug": "search-planning/121-hierarchical-task-networks-decomposition-methods-and-operational-knowledge",
        "status": "live"
      },
      {
        "title": "Scheduling: Resources, Precedence, Critical Paths, and Objectives",
        "slug": "search-planning/122-scheduling-resources-precedence-critical-paths-and-objectives",
        "status": "live"
      },
      {
        "title": "Planning Graphs and Heuristic Extraction",
        "slug": "search-planning/123-planning-graphs-and-heuristic-extraction",
        "status": "live"
      },
      {
        "title": "Planning Under Uncertainty: Belief States and Contingent Plans",
        "slug": "search-planning/124-planning-under-uncertainty-belief-states-and-contingent-plans",
        "status": "live"
      },
      {
        "title": "MDPs for Planning: Policies, Bellman Backups, and Value Iteration",
        "slug": "search-planning/125-mdps-for-planning-policies-bellman-backups-and-value-iteration",
        "status": "live"
      },
      {
        "title": "POMDPs and Information-Gathering Actions",
        "slug": "search-planning/126-pomdps-and-information-gathering-actions",
        "status": "live"
      },
      {
        "title": "Integrated Search and Planning Systems: Solvers, LLMs, and Verification",
        "slug": "search-planning/127-integrated-search-and-planning-systems-solvers-llms-and-verification",
        "status": "live"
      },
      {
        "title": "Classical AI Search and Planning Capstone",
        "slug": "search-planning/128-classical-ai-search-and-planning-capstone",
        "status": "live"
      },
      {
        "title": "Knowledge representation: models, commitments, and trade-offs",
        "slug": "knowledge-uncertainty/201-knowledge-representation-models-and-tradeoffs",
        "status": "live"
      },
      {
        "title": "Open-world, closed-world, and non-monotonic reasoning",
        "slug": "knowledge-uncertainty/202-open-world-closed-world-and-nonmonotonic-reasoning",
        "status": "live"
      },
      {
        "title": "Propositional logic: syntax, semantics, and models",
        "slug": "knowledge-uncertainty/203-propositional-logic-syntax-semantics-and-models",
        "status": "live"
      },
      {
        "title": "Propositional inference: truth tables and proof rules",
        "slug": "knowledge-uncertainty/204-propositional-inference-truth-tables-and-natural-deduction",
        "status": "live"
      },
      {
        "title": "Normal forms, SAT, and constraint encodings",
        "slug": "knowledge-uncertainty/205-normal-forms-sat-and-constraint-encodings",
        "status": "live"
      },
      {
        "title": "Resolution, refutation, and proof certificates",
        "slug": "knowledge-uncertainty/206-resolution-refutation-and-proof-certificates",
        "status": "live"
      },
      {
        "title": "First-order logic: objects, relations, and quantifiers",
        "slug": "knowledge-uncertainty/207-first-order-logic-objects-relations-and-quantifiers",
        "status": "live"
      },
      {
        "title": "Unification, substitutions, and variable discipline",
        "slug": "knowledge-uncertainty/208-unification-substitutions-and-variable-discipline",
        "status": "live"
      },
      {
        "title": "First-order resolution and theorem proving",
        "slug": "knowledge-uncertainty/209-first-order-resolution-and-theorem-proving",
        "status": "live"
      },
      {
        "title": "Horn clauses and forward chaining",
        "slug": "knowledge-uncertainty/210-horn-clauses-and-forward-chaining",
        "status": "live"
      },
      {
        "title": "Backward chaining and goal-directed reasoning",
        "slug": "knowledge-uncertainty/211-backward-chaining-goal-directed-reasoning",
        "status": "live"
      },
      {
        "title": "Rule engines, expert systems, and conflict resolution",
        "slug": "knowledge-uncertainty/212-rule-engines-expert-systems-and-conflict-resolution",
        "status": "live"
      },
      {
        "title": "Knowledge acquisition, validation, and maintenance",
        "slug": "knowledge-uncertainty/213-knowledge-acquisition-validation-and-maintenance",
        "status": "live"
      },
      {
        "title": "Ontologies, taxonomies, and description logics",
        "slug": "knowledge-uncertainty/214-ontologies-taxonomies-and-description-logics",
        "status": "live"
      },
      {
        "title": "Knowledge graphs: queries, provenance, and embeddings",
        "slug": "knowledge-uncertainty/215-knowledge-graphs-queries-provenance-and-embeddings",
        "status": "live"
      },
      {
        "title": "Probability for AI: conditional independence and Bayes’ rule",
        "slug": "knowledge-uncertainty/216-probability-for-ai-conditional-independence-and-bayes-rule",
        "status": "live"
      },
      {
        "title": "Bayesian networks: structure, factorization, and d-separation",
        "slug": "knowledge-uncertainty/217-bayesian-networks-structure-factorization-and-d-separation",
        "status": "live"
      },
      {
        "title": "Exact inference: variable elimination and belief propagation",
        "slug": "knowledge-uncertainty/218-exact-inference-variable-elimination-and-belief-propagation",
        "status": "live"
      },
      {
        "title": "Approximate inference: sampling and variational methods",
        "slug": "knowledge-uncertainty/219-approximate-inference-sampling-and-variational-methods",
        "status": "live"
      },
      {
        "title": "Hidden Markov models: filtering, smoothing, and Viterbi",
        "slug": "knowledge-uncertainty/220-hidden-markov-models-filtering-smoothing-and-viterbi",
        "status": "live"
      },
      {
        "title": "Dynamic Bayesian networks, POMDPs, and state estimation",
        "slug": "knowledge-uncertainty/221-dynamic-bayesian-networks-pomdps-and-state-estimation",
        "status": "live"
      },
      {
        "title": "Decision theory: expected utility and action selection",
        "slug": "knowledge-uncertainty/222-decision-theory-expected-utility-and-action-selection",
        "status": "live"
      },
      {
        "title": "Utility, risk attitudes, and multi-attribute decisions",
        "slug": "knowledge-uncertainty/223-utility-risk-attitudes-and-multi-attribute-decisions",
        "status": "live"
      },
      {
        "title": "Value of information and active observation",
        "slug": "knowledge-uncertainty/224-value-of-information-and-active-observation",
        "status": "live"
      },
      {
        "title": "Causal graphs: confounding, interventions, and counterfactuals",
        "slug": "knowledge-uncertainty/225-causal-graphs-confounding-interventions-and-counterfactuals",
        "status": "live"
      },
      {
        "title": "Probabilistic diagnosis, abduction, and evidence fusion",
        "slug": "knowledge-uncertainty/226-probabilistic-diagnosis-abduction-and-evidence-fusion",
        "status": "live"
      },
      {
        "title": "Explainability, proof traces, and the knowledge-based AI capstone",
        "slug": "knowledge-uncertainty/227-explainability-proof-traces-and-knowledge-based-ai-capstone",
        "status": "live"
      },
      {
        "title": "Agent architectures and rationality",
        "slug": "agents-robotics/301-agent-architectures-and-rationality",
        "status": "live"
      },
      {
        "title": "Reactive agents and behavior-based control",
        "slug": "agents-robotics/302-reactive-agents-and-behavior-based-control",
        "status": "live"
      },
      {
        "title": "Deliberative agents: beliefs, goals, and intentions",
        "slug": "agents-robotics/303-deliberative-agents-beliefs-goals-and-intentions",
        "status": "live"
      },
      {
        "title": "BDI agents and practical reasoning",
        "slug": "agents-robotics/304-bdi-agents-and-practical-reasoning",
        "status": "live"
      },
      {
        "title": "Agent memory, state, and world models",
        "slug": "agents-robotics/305-agent-memory-state-and-world-models",
        "status": "live"
      },
      {
        "title": "Tool use, planning, and action verification",
        "slug": "agents-robotics/306-tool-use-planning-and-action-verification",
        "status": "live"
      },
      {
        "title": "Multi-agent coordination and task allocation",
        "slug": "agents-robotics/307-multi-agent-coordination-and-task-allocation",
        "status": "live"
      },
      {
        "title": "Agent communication protocols and shared beliefs",
        "slug": "agents-robotics/308-communication-protocols-and-shared-beliefs",
        "status": "live"
      },
      {
        "title": "Auctions and market-based coordination",
        "slug": "agents-robotics/309-auctions-and-market-based-coordination",
        "status": "live"
      },
      {
        "title": "Game theory, strategic agents, and mechanism design",
        "slug": "agents-robotics/310-game-theory-strategic-agents-and-mechanism-design",
        "status": "live"
      },
      {
        "title": "Robot sensors, perception, and calibration",
        "slug": "agents-robotics/311-robot-sensors-perception-and-calibration",
        "status": "live"
      },
      {
        "title": "State estimation and Bayesian filtering",
        "slug": "agents-robotics/312-state-estimation-and-bayesian-filtering",
        "status": "live"
      },
      {
        "title": "Localization with Kalman and particle filters",
        "slug": "agents-robotics/313-localization-particle-filters-and-kalman-filters",
        "status": "live"
      },
      {
        "title": "Mapping and simultaneous localization and mapping",
        "slug": "agents-robotics/314-mapping-and-slam",
        "status": "live"
      },
      {
        "title": "Motion planning, configuration spaces, and collision checking",
        "slug": "agents-robotics/315-motion-planning-configuration-spaces-and-collision-checking",
        "status": "live"
      },
      {
        "title": "Sampling-based motion planning",
        "slug": "agents-robotics/316-sampling-based-motion-planning",
        "status": "live"
      },
      {
        "title": "Robot control, feedback, and stability",
        "slug": "agents-robotics/317-robot-control-feedback-and-stability",
        "status": "live"
      },
      {
        "title": "Task planning and execution monitoring",
        "slug": "agents-robotics/318-task-planning-and-execution-monitoring",
        "status": "live"
      },
      {
        "title": "Human-robot interaction and shared autonomy",
        "slug": "agents-robotics/319-human-robot-interaction-and-shared-autonomy",
        "status": "live"
      },
      {
        "title": "Robot safety constraints and runtime assurance",
        "slug": "agents-robotics/320-robot-safety-constraints-and-runtime-assurance",
        "status": "live"
      },
      {
        "title": "Hybrid symbolic-neural systems",
        "slug": "agents-robotics/321-hybrid-symbolic-neural-systems",
        "status": "live"
      },
      {
        "title": "Neuro-symbolic reasoning and knowledge integration",
        "slug": "agents-robotics/322-neuro-symbolic-reasoning-and-knowledge-integration",
        "status": "live"
      },
      {
        "title": "Robotics applications and deployment case studies",
        "slug": "agents-robotics/323-robotics-applications-and-deployment-case-studies",
        "status": "live"
      },
      {
        "title": "Agents and robotics staged capstone and technical defense",
        "slug": "agents-robotics/324-agents-robotics-staged-capstone-and-technical-defense",
        "status": "live"
      },
      {
        "title": "Swarm robotics and collective intelligence",
        "slug": "agents-robotics/325-swarm-robotics-and-collective-intelligence",
        "status": "live"
      },
      {
        "title": "Solve constraint problems by making rules explicit",
        "slug": "constraint-satisfaction",
        "status": "live"
      },
      {
        "title": "Classical AI: search, planning, and the shape of a decision",
        "slug": "search-and-planning",
        "status": "live"
      },
      {
        "title": "Separate uncertainty from the decision it informs",
        "slug": "uncertainty-and-decision",
        "status": "live"
      }
    ]
  },
  {
    "id": "machine-learning",
    "n": "04",
    "name": "Classical Machine Learning",
    "group": "Classical ML",
    "meta": "208 lessons",
    "summary": "A complete classical ML programme: decision framing, statistical learning, model families, validation, production practice, and assessed real-world cases.",
    "nodes": [
      {
        "title": "How to use the Classical ML course",
        "slug": "ml-001-how-to-use-the-classical-ml-course",
        "status": "live"
      },
      {
        "title": "Machine learning starts with a problem and a baseline",
        "slug": "problem-framing-and-baselines",
        "status": "live"
      },
      {
        "title": "Choose supervised, unsupervised, or self-supervised learning",
        "slug": "learning-paradigms",
        "status": "live"
      },
      {
        "title": "Generalization: why a good test score can still be wrong",
        "slug": "generalization-and-evaluation",
        "status": "live"
      },
      {
        "title": "Data-generating processes: model the world before the model",
        "slug": "ml-101-data-generating-processes",
        "status": "live"
      },
      {
        "title": "Unit of analysis and prediction time",
        "slug": "ml-102-unit-of-analysis-and-prediction-time",
        "status": "live"
      },
      {
        "title": "Target design and label quality",
        "slug": "ml-103-target-design-and-label-quality",
        "status": "live"
      },
      {
        "title": "Split data by dependency, not habit",
        "slug": "ml-104-data-splitting-by-dependency",
        "status": "live"
      },
      {
        "title": "Data auditing and profiling",
        "slug": "ml-105-data-auditing-and-profiling",
        "status": "live"
      },
      {
        "title": "Data cleaning without erasing signal",
        "slug": "ml-106-data-cleaning-without-erasing-signal",
        "status": "live"
      },
      {
        "title": "Categorical, numeric, and text features",
        "slug": "ml-107-categorical-numeric-and-text-features",
        "status": "live"
      },
      {
        "title": "Missing-data mechanisms",
        "slug": "ml-108-missing-data-mechanisms",
        "status": "live"
      },
      {
        "title": "Feature availability and leakage audit",
        "slug": "ml-109-feature-availability-and-leakage-audit",
        "status": "live"
      },
      {
        "title": "Inspect features, leakage, and missingness",
        "slug": "features-leakage-and-missingness",
        "status": "live"
      },
      {
        "title": "Make feature engineering reproducible",
        "slug": "feature-engineering-and-pipelines",
        "status": "live"
      },
      {
        "title": "Baselines, rules, and human performance",
        "slug": "ml-110-baselines-rules-and-human-performance",
        "status": "live"
      },
      {
        "title": "Decision theory and cost-sensitive machine learning",
        "slug": "ml-111-decision-theory-and-cost-sensitive-ml",
        "status": "live"
      },
      {
        "title": "A disciplined model-selection workflow",
        "slug": "ml-112-model-selection-workflow",
        "status": "live"
      },
      {
        "title": "ML project reproducibility starter",
        "slug": "ml-113-ml-project-reproducibility-starter",
        "status": "live"
      },
      {
        "title": "Lab: from question to evaluation plan",
        "slug": "ml-114-lab-from-question-to-evaluation-plan",
        "status": "live"
      },
      {
        "title": "Case study: triage under limited review capacity",
        "slug": "ml-115-case-study-triage-under-review-capacity",
        "status": "live"
      },
      {
        "title": "Use vectors and matrices as the language of ML",
        "slug": "linear-algebra-for-ml",
        "status": "live"
      },
      {
        "title": "Use probability to describe uncertainty and data variation",
        "slug": "probability-and-statistics-for-ml",
        "status": "live"
      },
      {
        "title": "Connect loss functions to optimization decisions",
        "slug": "optimization-loss-and-gradient-descent",
        "status": "live"
      },
      {
        "title": "Use regularization to control the bias-variance tradeoff",
        "slug": "regularization-and-bias-variance",
        "status": "live"
      },
      {
        "title": "Use linear regression as a transparent baseline",
        "slug": "linear-regression",
        "status": "live"
      },
      {
        "title": "Ordinary least squares from first principles",
        "slug": "ml-201-ordinary-least-squares-from-first-principles",
        "status": "live"
      },
      {
        "title": "Linear-model assumptions and diagnostics",
        "slug": "ml-202-linear-model-assumptions-and-diagnostics",
        "status": "live"
      },
      {
        "title": "Ridge, lasso, and elastic net",
        "slug": "ml-203-ridge-lasso-and-elastic-net",
        "status": "live"
      },
      {
        "title": "Feature scaling and regularization paths",
        "slug": "ml-204-feature-scaling-and-regularization-paths",
        "status": "live"
      },
      {
        "title": "Understand logistic regression as a probability-shaped classifier",
        "slug": "logistic-regression",
        "status": "live"
      },
      {
        "title": "Generalized linear models",
        "slug": "ml-205-generalized-linear-models",
        "status": "live"
      },
      {
        "title": "Logistic regression: likelihood and odds",
        "slug": "ml-206-logistic-regression-likelihood-and-odds",
        "status": "live"
      },
      {
        "title": "Multiclass and multilabel classification",
        "slug": "ml-207-multiclass-and-multilabel-classification",
        "status": "live"
      },
      {
        "title": "Poisson and count regression",
        "slug": "ml-208-poisson-and-count-regression",
        "status": "live"
      },
      {
        "title": "Quantile and robust regression",
        "slug": "ml-209-quantile-and-robust-regression",
        "status": "live"
      },
      {
        "title": "Generalized additive models",
        "slug": "ml-210-generalized-additive-models",
        "status": "live"
      },
      {
        "title": "Survival analysis and censored outcomes",
        "slug": "ml-211-survival-analysis-and-censored-outcomes",
        "status": "live"
      },
      {
        "title": "Probabilistic prediction and prediction intervals",
        "slug": "ml-212-probabilistic-prediction-and-prediction-intervals",
        "status": "live"
      },
      {
        "title": "Turn classifier scores into calibrated decisions",
        "slug": "classifiers-thresholds-and-calibration",
        "status": "live"
      },
      {
        "title": "Probability calibration in practice",
        "slug": "ml-213-probability-calibration-in-practice",
        "status": "live"
      },
      {
        "title": "Thresholds, abstention, and human review",
        "slug": "ml-214-thresholds-abstention-and-human-review",
        "status": "live"
      },
      {
        "title": "Lab: linear-model diagnostic notebook",
        "slug": "ml-215-lab-linear-model-diagnostic-notebook",
        "status": "live"
      },
      {
        "title": "Case study: demand forecast with uncertainty",
        "slug": "ml-216-case-study-demand-forecast-with-uncertainty",
        "status": "live"
      },
      {
        "title": "Use similarity carefully with nearest neighbors and kernels",
        "slug": "nearest-neighbors-and-kernels",
        "status": "live"
      },
      {
        "title": "kNN: distance metrics and feature scaling",
        "slug": "ml-301-knn-distance-metrics-and-scaling",
        "status": "live"
      },
      {
        "title": "The curse of dimensionality in classical ML",
        "slug": "ml-302-curse-of-dimensionality",
        "status": "live"
      },
      {
        "title": "Kernel methods and the kernel trick",
        "slug": "ml-303-kernel-methods-and-the-kernel-trick",
        "status": "live"
      },
      {
        "title": "Support vector machines and margins",
        "slug": "ml-304-support-vector-machines-and-margins",
        "status": "live"
      },
      {
        "title": "Read decision trees as recursive questions",
        "slug": "decision-trees-and-entropy",
        "status": "live"
      },
      {
        "title": "Decision-tree splitting criteria",
        "slug": "ml-305-decision-tree-splitting-criteria",
        "status": "live"
      },
      {
        "title": "Pruning and tree regularization",
        "slug": "ml-306-pruning-and-tree-regularization",
        "status": "live"
      },
      {
        "title": "Random forests and out-of-bag evaluation",
        "slug": "ml-307-random-forests-and-out-of-bag-evaluation",
        "status": "live"
      },
      {
        "title": "Gradient boosting from residuals",
        "slug": "ml-308-gradient-boosting-from-residuals",
        "status": "live"
      },
      {
        "title": "XGBoost, LightGBM, and CatBoost: design tradeoffs",
        "slug": "ml-309-xgboost-lightgbm-and-catboost-design-tradeoffs",
        "status": "live"
      },
      {
        "title": "Boosting hyperparameters and early stopping",
        "slug": "ml-310-boosting-hyperparameters-and-early-stopping",
        "status": "live"
      },
      {
        "title": "Combine models when their errors differ",
        "slug": "ensemble-methods",
        "status": "live"
      },
      {
        "title": "Stacking, blending, and ensemble design",
        "slug": "ml-311-stacking-blending-and-ensemble-design",
        "status": "live"
      },
      {
        "title": "Monotonic constraints and domain knowledge",
        "slug": "ml-312-monotonic-constraints-and-domain-knowledge",
        "status": "live"
      },
      {
        "title": "Partial dependence, ICE, and ALE",
        "slug": "ml-313-partial-dependence-ice-and-ale",
        "status": "live"
      },
      {
        "title": "Lab: tree and boosting model shootout",
        "slug": "ml-314-lab-tree-and-boosting-model-shootout",
        "status": "live"
      },
      {
        "title": "Case study: credit risk and reject inference",
        "slug": "ml-315-case-study-credit-risk-with-reject-inference",
        "status": "live"
      },
      {
        "title": "Case study: tabular champion–challenger",
        "slug": "ml-316-case-study-tabular-champion-challenger",
        "status": "live"
      },
      {
        "title": "Use k-means as an investigation tool, not an automatic truth",
        "slug": "clustering-and-k-means",
        "status": "live"
      },
      {
        "title": "Choose clustering objectives and validate clusters",
        "slug": "ml-401-clustering-objectives-and-validation",
        "status": "live"
      },
      {
        "title": "Build and read hierarchical clusters with dendrograms",
        "slug": "ml-402-hierarchical-clustering-and-dendrograms",
        "status": "live"
      },
      {
        "title": "Find density clusters with DBSCAN and HDBSCAN",
        "slug": "ml-403-dbscan-hdbscan-and-density-clusters",
        "status": "live"
      },
      {
        "title": "Model soft clusters with Gaussian mixtures and EM",
        "slug": "ml-404-gaussian-mixture-models-and-em",
        "status": "live"
      },
      {
        "title": "Use PCA to expose directions of variation",
        "slug": "pca-and-dimensionality-reduction",
        "status": "live"
      },
      {
        "title": "Reduce dimension beyond PCA",
        "slug": "ml-405-dimensionality-reduction-beyond-pca",
        "status": "live"
      },
      {
        "title": "Use UMAP and t-SNE without being misled",
        "slug": "ml-406-umap-tsne-and-visualization-traps",
        "status": "live"
      },
      {
        "title": "Evaluate recommenders as ranking and feedback systems",
        "slug": "recommenders-and-ranking",
        "status": "live"
      },
      {
        "title": "Build recommender representations with matrix factorization",
        "slug": "ml-407-matrix-factorization-for-recommendation",
        "status": "live"
      },
      {
        "title": "Evaluate recommender ranking objectives offline",
        "slug": "ml-408-ranking-objectives-and-offline-recommender-evaluation",
        "status": "live"
      },
      {
        "title": "Define what anomalous means before detecting it",
        "slug": "anomaly-detection",
        "status": "live"
      },
      {
        "title": "Detect anomalies with one-class and isolation methods",
        "slug": "ml-409-one-class-and-isolation-anomaly-detection",
        "status": "live"
      },
      {
        "title": "Estimate density for novelty detection",
        "slug": "ml-410-density-estimation-and-novelty-detection",
        "status": "live"
      },
      {
        "title": "Compare discriminative and generative modeling",
        "slug": "bayesian-and-generative-learning",
        "status": "live"
      },
      {
        "title": "Model sequential state with hidden Markov models",
        "slug": "ml-411-hidden-markov-models-and-sequences",
        "status": "live"
      },
      {
        "title": "Respect time in features, labels, and validation",
        "slug": "time-series-and-temporal-validation",
        "status": "live"
      },
      {
        "title": "Decompose time series and engineer leakage-safe features",
        "slug": "ml-412-time-series-decomposition-and-feature-engineering",
        "status": "live"
      },
      {
        "title": "Forecast with honest baselines and walk-forward backtests",
        "slug": "ml-413-forecasting-baselines-and-walk-forward-backtests",
        "status": "live"
      },
      {
        "title": "Lab: segment customers without turning clusters into stereotypes",
        "slug": "ml-414-lab-customer-segmentation-without-stereotypes",
        "status": "live"
      },
      {
        "title": "Case study: investigate fraud anomalies safely",
        "slug": "ml-415-case-study-fraud-anomaly-investigation",
        "status": "live"
      },
      {
        "title": "Case study: manage recommender feedback loops",
        "slug": "ml-416-case-study-recommender-feedback-loops",
        "status": "live"
      },
      {
        "title": "Design validation so comparisons mean something",
        "slug": "cross-validation-and-experimental-design",
        "status": "live"
      },
      {
        "title": "Validation design for grouped and temporal data",
        "slug": "ml-501-validation-design-for-grouped-and-temporal-data",
        "status": "live"
      },
      {
        "title": "Resampling, bootstrap, and confidence intervals",
        "slug": "ml-502-resampling-bootstrap-and-confidence-intervals",
        "status": "live"
      },
      {
        "title": "Use statistical tests to compare ML systems carefully",
        "slug": "statistical-testing-for-ml",
        "status": "live"
      },
      {
        "title": "Hypothesis tests, permutation tests, and effect sizes",
        "slug": "ml-503-hypothesis-tests-permutation-tests-and-effect-sizes",
        "status": "live"
      },
      {
        "title": "Multiple comparisons and researcher degrees of freedom",
        "slug": "ml-504-multiple-comparisons-and-researcher-degrees-of-freedom",
        "status": "live"
      },
      {
        "title": "Power analysis and sample size for model evaluations",
        "slug": "ml-505-power-analysis-and-sample-size-for-model-evaluations",
        "status": "live"
      },
      {
        "title": "Model comparison with correlated folds",
        "slug": "ml-506-model-comparison-with-correlated-folds",
        "status": "live"
      },
      {
        "title": "Error analysis as a research loop",
        "slug": "ml-507-error-analysis-as-a-research-loop",
        "status": "live"
      },
      {
        "title": "Slice discovery and subgroup reliability",
        "slug": "ml-508-slice-discovery-and-subgroup-reliability",
        "status": "live"
      },
      {
        "title": "Choose metrics for the errors you can afford",
        "slug": "imbalanced-data-and-metrics",
        "status": "live"
      },
      {
        "title": "Class imbalance, resampling, and class weights",
        "slug": "ml-509-class-imbalance-resampling-and-class-weights",
        "status": "live"
      },
      {
        "title": "Label shift, covariate shift, and concept drift",
        "slug": "ml-510-label-shift-covariate-shift-and-concept-drift",
        "status": "live"
      },
      {
        "title": "Do not confuse prediction with intervention",
        "slug": "causal-questions-vs-predictive-models",
        "status": "live"
      },
      {
        "title": "Causal diagrams for ML practitioners",
        "slug": "ml-511-causal-diagrams-for-ml-practitioners",
        "status": "live"
      },
      {
        "title": "Randomized experiments and online A/B tests",
        "slug": "ml-512-randomized-experiments-and-online-ab-tests",
        "status": "live"
      },
      {
        "title": "Observational causal estimation and its limits",
        "slug": "ml-513-observational-causal-estimation-and-its-limits",
        "status": "live"
      },
      {
        "title": "Evaluate model impact across meaningful subgroups",
        "slug": "fairness-and-subgroup-evaluation",
        "status": "live"
      },
      {
        "title": "Fairness definitions and impossibility tradeoffs",
        "slug": "ml-514-fairness-definitions-and-impossibility-tradeoffs",
        "status": "live"
      },
      {
        "title": "Lab: evaluation protocol adversarial review",
        "slug": "ml-515-lab-evaluation-protocol-adversarial-review",
        "status": "live"
      },
      {
        "title": "Case study: promotion model versus policy change",
        "slug": "ml-516-case-study-promotion-model-versus-policy-change",
        "status": "live"
      },
      {
        "title": "Explain model behavior through errors and counterfactuals",
        "slug": "interpretability-and-error-analysis",
        "status": "live"
      },
      {
        "title": "Model interpretability: questions and audiences",
        "slug": "ml-601-model-interpretability-questions-and-audiences",
        "status": "live"
      },
      {
        "title": "Permutation importance and its failure modes",
        "slug": "ml-602-permutation-importance-and-its-failure-modes",
        "status": "live"
      },
      {
        "title": "SHAP values: assumptions and misuse",
        "slug": "ml-603-shap-values-assumptions-and-misuse",
        "status": "live"
      },
      {
        "title": "Counterfactual explanations and recourse",
        "slug": "ml-604-counterfactual-explanations-and-recourse",
        "status": "live"
      },
      {
        "title": "Data contracts and schema evolution",
        "slug": "ml-605-data-contracts-and-schema-evolution",
        "status": "live"
      },
      {
        "title": "Training-serving skew",
        "slug": "ml-606-training-serving-skew",
        "status": "live"
      },
      {
        "title": "Feature stores and point-in-time correctness",
        "slug": "ml-607-feature-stores-and-point-in-time-correctness",
        "status": "live"
      },
      {
        "title": "Make an ML experiment reproducible enough to trust",
        "slug": "ml-systems-and-reproducibility",
        "status": "live"
      },
      {
        "title": "Experiment tracking and lineage",
        "slug": "ml-608-experiment-tracking-and-lineage",
        "status": "live"
      },
      {
        "title": "Model packaging and reproducible environments",
        "slug": "ml-609-model-packaging-and-reproducible-environments",
        "status": "live"
      },
      {
        "title": "Choose batch or online serving from the decision",
        "slug": "serving-batch-and-online",
        "status": "live"
      },
      {
        "title": "Batch scoring, online serving, and shadow mode",
        "slug": "ml-610-batch-scoring-online-serving-and-shadow-mode",
        "status": "live"
      },
      {
        "title": "Deployment strategies: canary, champion, and rollback",
        "slug": "ml-611-deployment-strategies-canary-champion-and-rollback",
        "status": "live"
      },
      {
        "title": "Monitor data, predictions, outcomes, and decisions for drift",
        "slug": "drift-and-monitoring",
        "status": "live"
      },
      {
        "title": "Monitoring data, model, and decision quality",
        "slug": "ml-612-monitoring-data-model-and-decision-quality",
        "status": "live"
      },
      {
        "title": "Alert design and incident response for ML",
        "slug": "ml-613-alert-design-and-incident-response-for-ml",
        "status": "live"
      },
      {
        "title": "Security and privacy threat modeling for ML",
        "slug": "ml-614-security-and-privacy-threat-modeling-for-ml",
        "status": "live"
      },
      {
        "title": "Lab: release a model with a kill switch",
        "slug": "ml-615-lab-release-a-model-with-a-kill-switch",
        "status": "live"
      },
      {
        "title": "Case study: a loan-model drift incident",
        "slug": "ml-616-case-study-loan-model-drift-incident",
        "status": "live"
      },
      {
        "title": "Connect classical ML to neural representation learning",
        "slug": "neural-network-bridge",
        "status": "live"
      },
      {
        "title": "Use learning theory to reason about generalization",
        "slug": "learning-theory-and-pac-intuition",
        "status": "live"
      },
      {
        "title": "Understand reinforcement learning as action under feedback",
        "slug": "reinforcement-learning-and-reward",
        "status": "live"
      },
      {
        "title": "Linear regression: normal equations and geometry",
        "slug": "derivations/01-linear-regression-normal-equations-and-geometry",
        "status": "live"
      },
      {
        "title": "Gradient descent and convergence for linear models",
        "slug": "derivations/02-gradient-descent-and-convergence-for-linear-models",
        "status": "live"
      },
      {
        "title": "Logistic regression: likelihood, gradient, and Hessian",
        "slug": "derivations/03-logistic-regression-likelihood-gradient-and-hessian",
        "status": "live"
      },
      {
        "title": "MAP, MLE, and regularization as priors",
        "slug": "derivations/04-map-mle-and-regularization-as-priors",
        "status": "live"
      },
      {
        "title": "SVM: primal, dual, and KKT conditions",
        "slug": "derivations/05-svm-primal-dual-and-kkt-conditions",
        "status": "live"
      },
      {
        "title": "Decision trees: impurity and information-gain calculations",
        "slug": "derivations/06-decision-tree-impurity-and-information-gain-calculations",
        "status": "live"
      },
      {
        "title": "Gradient boosting as functional gradient descent",
        "slug": "derivations/07-gradient-boosting-as-functional-gradient-descent",
        "status": "live"
      },
      {
        "title": "PCA, SVD, and best low-rank approximation",
        "slug": "derivations/08-pca-svd-and-best-low-rank-approximation",
        "status": "live"
      },
      {
        "title": "Gaussian mixtures, EM, and latent-variable inference",
        "slug": "derivations/09-gaussian-mixtures-em-and-latent-variable-inference",
        "status": "live"
      },
      {
        "title": "Bias-variance decomposition and regularization",
        "slug": "derivations/10-bias-variance-decomposition-and-regularization",
        "status": "live"
      },
      {
        "title": "Bootstrap confidence intervals and permutation tests",
        "slug": "derivations/11-bootstrap-confidence-intervals-and-permutation-tests",
        "status": "live"
      },
      {
        "title": "HMMs: forward-backward and Viterbi",
        "slug": "derivations/12-hmms-forward-backward-and-viterbi",
        "status": "live"
      },
      {
        "title": "Problem Set 1: Linear Models and Optimization",
        "slug": "problem-sets/01-linear-models-and-optimization",
        "status": "live"
      },
      {
        "title": "Problem Set 2: Probability, Likelihood, and Calibration",
        "slug": "problem-sets/02-probability-likelihood-and-calibration",
        "status": "live"
      },
      {
        "title": "Problem Set 3: Regularization and Model Selection",
        "slug": "problem-sets/03-regularization-and-model-selection",
        "status": "live"
      },
      {
        "title": "Problem Set 4: Kernels, SVMs, and Trees",
        "slug": "problem-sets/04-kernels-svms-and-trees",
        "status": "live"
      },
      {
        "title": "Problem Set 5: Ensembles and Uncertainty",
        "slug": "problem-sets/05-ensembles-and-uncertainty",
        "status": "live"
      },
      {
        "title": "Problem Set 6: Unsupervised Learning, PCA, and EM",
        "slug": "problem-sets/06-unsupervised-learning-pca-and-em",
        "status": "live"
      },
      {
        "title": "Problem Set 7: Evaluation, Statistical Inference, and Experiments",
        "slug": "problem-sets/07-evaluation-statistical-inference-and-experiments",
        "status": "live"
      },
      {
        "title": "Problem Set 8: Causal Reasoning and Fairness",
        "slug": "problem-sets/08-causal-reasoning-and-fairness",
        "status": "live"
      },
      {
        "title": "Problem Set 9: Time Series, Ranking, and Anomaly Detection",
        "slug": "problem-sets/09-time-series-ranking-and-anomaly-detection",
        "status": "live"
      },
      {
        "title": "Problem Set 10: Comprehensive Classical ML Qualifying Exam",
        "slug": "problem-sets/10-comprehensive-classical-ml-qualifying-exam",
        "status": "live"
      },
      {
        "title": "Diagnostic exam: the ML readiness audit",
        "slug": "assessments/ml-841-diagnostic-exam",
        "status": "live"
      },
      {
        "title": "Assignment 1: frame a decision and ship a reproducible baseline",
        "slug": "assessments/ml-842-assignment-01-reproducible-baseline",
        "status": "live"
      },
      {
        "title": "Assignment 2: derive, implement, and calibrate a linear decision model",
        "slug": "assessments/ml-843-assignment-02-linear-models-calibration",
        "status": "live"
      },
      {
        "title": "Assignment 3: compare trees and ensembles through a debugging clinic",
        "slug": "assessments/ml-844-assignment-03-tree-ensemble-debugging",
        "status": "live"
      },
      {
        "title": "Assignment 4: unsupervised learning without inventing stories",
        "slug": "assessments/ml-845-assignment-04-unsupervised-decision-support",
        "status": "live"
      },
      {
        "title": "Assignment 5: build a time-aware, risk-aware ML system",
        "slug": "assessments/ml-846-assignment-05-temporal-risk-aware-system",
        "status": "live"
      },
      {
        "title": "Model report template: predictive system review",
        "slug": "assessments/ml-847-model-report-template",
        "status": "live"
      },
      {
        "title": "Model report template: high-stakes review and human oversight",
        "slug": "assessments/ml-848-model-report-template-high-stakes",
        "status": "live"
      },
      {
        "title": "Staged capstone handbook: from proposal to production review",
        "slug": "assessments/ml-849-staged-capstone-handbook",
        "status": "live"
      },
      {
        "title": "Oral-defense rubric: defend an ML decision under scrutiny",
        "slug": "assessments/ml-850-oral-defense-rubric",
        "status": "live"
      },
      {
        "title": "Executable Classical ML lab studio",
        "slug": "ml-871-executable-lab-studio",
        "status": "live"
      },
      {
        "title": "Project brief and model card template",
        "slug": "ml-701-project-brief-and-model-card-template",
        "status": "live"
      },
      {
        "title": "Lab: house-price regression",
        "slug": "ml-702-lab-house-price-regression",
        "status": "live"
      },
      {
        "title": "Lab: churn classification",
        "slug": "ml-703-lab-churn-classification",
        "status": "live"
      },
      {
        "title": "Lab: medical screening with calibration",
        "slug": "ml-704-lab-medical-screening-with-calibration",
        "status": "live"
      },
      {
        "title": "Lab: fraud detection under class imbalance",
        "slug": "ml-705-lab-fraud-detection-under-class-imbalance",
        "status": "live"
      },
      {
        "title": "Lab: demand forecasting with delayed labels",
        "slug": "ml-706-lab-demand-forecasting-with-delayed-labels",
        "status": "live"
      },
      {
        "title": "Lab: content ranking with feedback",
        "slug": "ml-707-lab-content-ranking-with-feedback",
        "status": "live"
      },
      {
        "title": "Lab: clustering for exploration",
        "slug": "ml-708-lab-clustering-for-exploration",
        "status": "live"
      },
      {
        "title": "Lab: anomaly detection with investigation queues",
        "slug": "ml-709-lab-anomaly-detection-with-investigation-queues",
        "status": "live"
      },
      {
        "title": "Lab: causal question triage",
        "slug": "ml-710-lab-causal-question-triage",
        "status": "live"
      },
      {
        "title": "Lab: model debugging and error gallery",
        "slug": "ml-711-lab-model-debugging-and-error-gallery",
        "status": "live"
      },
      {
        "title": "Lab: reproducible training pipeline",
        "slug": "ml-712-lab-reproducible-training-pipeline",
        "status": "live"
      },
      {
        "title": "Lab: production readiness review",
        "slug": "ml-713-lab-production-readiness-review",
        "status": "live"
      },
      {
        "title": "Capstone: classical ML system defense",
        "slug": "ml-714-capstone-classical-ml-system-defense",
        "status": "live"
      },
      {
        "title": "Capstone: defend a complete ML system decision",
        "slug": "ml-foundations-capstone",
        "status": "live"
      },
      {
        "title": "Advanced reading and reproduction project",
        "slug": "ml-715-advanced-reading-and-reproduction-project",
        "status": "live"
      },
      {
        "title": "Qualifying problem set: proof, computation, and statistical judgement",
        "slug": "problem-sets/11-proof-and-computation-qualifying-set",
        "status": "live"
      },
      {
        "title": "Paper reproduction: AdaBoost and the training-error bound",
        "slug": "reproductions/adaboost-reproduction",
        "status": "live"
      },
      {
        "title": "Paper reproduction: least squares, shrinkage, and prediction",
        "slug": "reproductions/linear-regression-reproduction",
        "status": "live"
      },
      {
        "title": "Reproduction study: least-squares linear regression",
        "slug": "reproductions/ml-881-reproduce-least-squares-linear-regression",
        "status": "live"
      },
      {
        "title": "Reproduction study: AdaBoost weight updates and noise sensitivity",
        "slug": "reproductions/ml-882-reproduce-adaboost-weight-updates-and-noise-sensitivity",
        "status": "live"
      },
      {
        "title": "Reproduction study: random forests, OOB estimates, and correlation",
        "slug": "reproductions/ml-883-reproduce-random-forest-oob-and-correlation-tradeoffs",
        "status": "live"
      },
      {
        "title": "Reproduction study: support-vector machines and kernel choice",
        "slug": "reproductions/ml-884-reproduce-support-vector-machines-and-kernel-choice",
        "status": "live"
      },
      {
        "title": "Reproduction study: PCA, eigenfaces, and low-rank reconstruction",
        "slug": "reproductions/ml-885-reproduce-pca-and-eigenfaces-low-rank-reconstruction",
        "status": "live"
      },
      {
        "title": "Paper reproduction: low-rank reconstruction",
        "slug": "reproductions/pca-reconstruction-reproduction",
        "status": "live"
      },
      {
        "title": "Paper reproduction: random forests and out-of-bag evidence",
        "slug": "reproductions/random-forest-reproduction",
        "status": "live"
      },
      {
        "title": "Paper reproduction: margins and kernels",
        "slug": "reproductions/svm-kernel-reproduction",
        "status": "live"
      },
      {
        "title": "Public-data project: Adult income prediction",
        "slug": "public-data-projects/adult-income-project",
        "status": "live"
      },
      {
        "title": "Public-data project: APS Failure under imbalance",
        "slug": "public-data-projects/aps-failure-project",
        "status": "live"
      },
      {
        "title": "Public-data project: Bank Marketing decision support",
        "slug": "public-data-projects/bank-marketing-project",
        "status": "live"
      },
      {
        "title": "Public-data project: Bike Sharing forecasting",
        "slug": "public-data-projects/bike-sharing-project",
        "status": "live"
      },
      {
        "title": "Public-data project: Adult income decision audit",
        "slug": "public-data-projects/ml-891-adult-income-decision-audit",
        "status": "live"
      },
      {
        "title": "Public-data project: Bank marketing campaign under time and contact constraints",
        "slug": "public-data-projects/ml-892-bank-marketing-temporal-campaign",
        "status": "live"
      },
      {
        "title": "Public-data project: Bike-sharing demand forecast under temporal leakage",
        "slug": "public-data-projects/ml-893-bike-sharing-demand-forecast",
        "status": "live"
      },
      {
        "title": "Public-data project: Online Retail cohort, demand, and anomaly study",
        "slug": "public-data-projects/ml-894-online-retail-cohort-and-anomaly-study",
        "status": "live"
      },
      {
        "title": "Public-data project: MovieLens recommendation with temporal and feedback-loop audits",
        "slug": "public-data-projects/ml-895-movielens-recommendation-and-feedback",
        "status": "live"
      },
      {
        "title": "Public-data project: APS failure triage with asymmetric maintenance costs",
        "slug": "public-data-projects/ml-896-aps-failure-cost-sensitive-maintenance",
        "status": "live"
      },
      {
        "title": "Public-data project: MovieLens recommendation",
        "slug": "public-data-projects/movielens-project",
        "status": "live"
      },
      {
        "title": "Public-data project: Online Retail customer analysis",
        "slug": "public-data-projects/online-retail-project",
        "status": "live"
      },
      {
        "title": "Deep lecture: Linear and logistic regression—from objective to deployment",
        "slug": "deep-lectures/901-linear-and-logistic-regression-from-objective-to-deployment",
        "status": "live"
      },
      {
        "title": "Deep lecture: Regularisation and model selection as controlled generalisation",
        "slug": "deep-lectures/902-regularisation-and-model-selection-as-controlled-generalisation",
        "status": "live"
      },
      {
        "title": "Deep lecture: Trees, random forests, and boosting—from split objective to deployment",
        "slug": "deep-lectures/903-trees-random-forests-and-boosting-from-split-objective-to-deployment",
        "status": "live"
      },
      {
        "title": "Deep lecture: Probabilistic modelling, MLE/MAP, Bayesian inference, calibration, and uncertainty",
        "slug": "deep-lectures/904-probabilistic-modelling-mle-map-bayesian-inference-calibration-and-uncertainty",
        "status": "live"
      },
      {
        "title": "Deep lecture: Statistical inference, resampling, multiple comparison, and decision thresholds",
        "slug": "deep-lectures/905-statistical-inference-resampling-multiple-comparison-and-decision-thresholds",
        "status": "live"
      },
      {
        "title": "Deep lecture: Causal estimation—from DAGs through matching, IPW, doubly robust methods, and sensitivity",
        "slug": "deep-lectures/906-causal-estimation-from-dags-through-matching-ipw-doubly-robust-methods-and-sensitivity",
        "status": "live"
      },
      {
        "title": "Deep lecture: Time series, ranking, and recommender systems under temporal exposure feedback",
        "slug": "deep-lectures/907-time-series-ranking-and-recommender-systems-under-temporal-exposure-feedback",
        "status": "live"
      }
    ]
  },
  {
    "id": "deep-learning",
    "n": "05",
    "name": "Deep Learning",
    "group": "Classical ML",
    "meta": "136 lessons",
    "summary": "Neural networks in depth: architectures, training dynamics, and the building blocks of modern models.",
    "nodes": [
      {
        "title": "How to use the Deep Learning programme",
        "slug": "dl-001-how-to-use-the-deep-learning-program",
        "status": "live"
      },
      {
        "title": "Tensors, Shapes, and Broadcasting",
        "slug": "core/101-tensors-shapes-and-broadcasting",
        "status": "live"
      },
      {
        "title": "Perceptrons, Linear Separability, and Geometric Margins",
        "slug": "core/102-perceptrons-linear-separability-and-geometric-margins",
        "status": "live"
      },
      {
        "title": "MLPs: Composition, Capacity, and Universal Approximation",
        "slug": "core/103-mlps-composition-capacity-and-universal-approximation",
        "status": "live"
      },
      {
        "title": "The Forward Pass, Caches, and Batched Inference",
        "slug": "core/104-forward-pass-caches-and-batched-inference",
        "status": "live"
      },
      {
        "title": "Activation Functions and Signal Propagation",
        "slug": "core/105-activation-functions-and-signal-propagation",
        "status": "live"
      },
      {
        "title": "Regression Losses: MSE, MAE, Huber, and Likelihood",
        "slug": "core/106-regression-losses-mse-mae-huber-and-likelihood",
        "status": "live"
      },
      {
        "title": "Classification Losses: CE, BCE, NLL, and Logits",
        "slug": "core/107-classification-losses-ce-bce-nll-and-logits",
        "status": "live"
      },
      {
        "title": "Computation Graphs and Local Derivatives",
        "slug": "core/108-computation-graphs-and-local-derivatives",
        "status": "live"
      },
      {
        "title": "Reverse-Mode Autodiff and Vector–Jacobian Products",
        "slug": "core/109-reverse-mode-autodiff-and-vector-jacobian-products",
        "status": "live"
      },
      {
        "title": "Backpropagation by Hand for Dense Networks",
        "slug": "core/110-backpropagation-by-hand-for-dense-networks",
        "status": "live"
      },
      {
        "title": "Matrix Calculus for Neural Networks",
        "slug": "core/111-matrix-calculus-for-neural-networks",
        "status": "live"
      },
      {
        "title": "Initialization: Variance Preservation and Symmetry Breaking",
        "slug": "core/112-initialization-variance-preservation-and-symmetry-breaking",
        "status": "live"
      },
      {
        "title": "SGD, Mini-batches, and Objective Estimation",
        "slug": "core/113-sgd-minibatches-and-objective-estimation",
        "status": "live"
      },
      {
        "title": "Momentum, Nesterov, and Optimisation Geometry",
        "slug": "core/114-momentum-nesterov-and-optimization-geometry",
        "status": "live"
      },
      {
        "title": "Adaptive Optimisation: RMSProp, Adam, and AdamW",
        "slug": "core/115-adaptive-optimization-rmsprop-adam-and-adamw",
        "status": "live"
      },
      {
        "title": "Normalisation: BatchNorm, LayerNorm, and Training State",
        "slug": "core/116-normalization-batch-layer-and-training-state",
        "status": "live"
      },
      {
        "title": "Regularisation: Weight Decay, Early Stopping, and Label Smoothing",
        "slug": "core/117-regularization-weight-decay-early-stopping-and-label-smoothing",
        "status": "live"
      },
      {
        "title": "Dropout, Ensembles, and Train/Eval Semantics",
        "slug": "core/118-dropout-ensembles-and-training-evaluation-semantics",
        "status": "live"
      },
      {
        "title": "Data Augmentation, Invariances, and Leakage",
        "slug": "core/119-data-augmentation-invariances-and-leakage",
        "status": "live"
      },
      {
        "title": "Overfitting, Underfitting, and Double Descent",
        "slug": "core/120-overfitting-underfitting-and-double-descent",
        "status": "live"
      },
      {
        "title": "Batch Size, Gradient Noise, and Scaling Rules",
        "slug": "core/121-batch-size-gradient-noise-and-scaling-rules",
        "status": "live"
      },
      {
        "title": "Learning-Rate Schedulers, Warmup, and Restarts",
        "slug": "core/122-learning-rate-schedulers-warmup-and-restarts",
        "status": "live"
      },
      {
        "title": "Gradient Clipping, Exploding Gradients, and Sequence Stability",
        "slug": "core/123-gradient-clipping-exploding-gradients-and-sequence-stability",
        "status": "live"
      },
      {
        "title": "Numerical Stability, LogSumExp, and Mixed Precision",
        "slug": "core/124-numerical-stability-logsumexp-and-mixed-precision",
        "status": "live"
      },
      {
        "title": "Hyperparameter Search and Experiment Design",
        "slug": "core/125-hyperparameter-search-and-experiment-design",
        "status": "live"
      },
      {
        "title": "Debugging Training Systems and Failure Triage",
        "slug": "core/126-debugging-training-systems-and-failure-triage",
        "status": "live"
      },
      {
        "title": "Reproducibility, Determinism, and Experiment Provenance",
        "slug": "core/127-reproducibility-determinism-and-experiment-provenance",
        "status": "live"
      },
      {
        "title": "Evaluation, Thresholds, Calibration, and Uncertainty",
        "slug": "core/128-evaluation-thresholds-calibration-and-uncertainty",
        "status": "live"
      },
      {
        "title": "Transfer Learning, Fine-tuning, and Domain Shift",
        "slug": "core/129-transfer-learning-fine-tuning-and-domain-shift",
        "status": "live"
      },
      {
        "title": "Representation Probing and Diagnostic Evaluation",
        "slug": "core/130-representation-probing-and-diagnostic-evaluation",
        "status": "live"
      },
      {
        "title": "Convolutional Inductive Biases and Shape Accounting",
        "slug": "core/131-convolutional-inductive-biases-and-shape-accounting",
        "status": "live"
      },
      {
        "title": "Sequences, Attention, and Causal Masking",
        "slug": "core/132-sequences-attention-and-causal-masking",
        "status": "live"
      },
      {
        "title": "Deep Learning Systems Design: From Data Contract to Release",
        "slug": "core/133-deep-learning-systems-design-from-data-contract-to-release",
        "status": "live"
      },
      {
        "title": "Core Mastery Capstone and Oral Defense",
        "slug": "core/134-core-mastery-capstone-and-oral-defense",
        "status": "live"
      },
      {
        "title": "Images, tensors, and data contracts",
        "slug": "vision/201-images-tensors-and-data-contracts",
        "status": "live"
      },
      {
        "title": "Convolution, cross-correlation, and learned filters",
        "slug": "vision/202-convolution-cross-correlation-and-parameters",
        "status": "live"
      },
      {
        "title": "Convolution arithmetic: padding, stride, and output shapes",
        "slug": "vision/203-convolution-arithmetic-and-output-shapes",
        "status": "live"
      },
      {
        "title": "Pooling, stride, dilation, and aliasing",
        "slug": "vision/204-pooling-stride-dilation-and-aliasing",
        "status": "live"
      },
      {
        "title": "Receptive fields, effective stride, and feature pyramids",
        "slug": "vision/205-receptive-fields-and-feature-pyramids",
        "status": "live"
      },
      {
        "title": "CNN architecture families and design patterns",
        "slug": "vision/206-cnn-design-patterns-and-architectures",
        "status": "live"
      },
      {
        "title": "Residual and skip connections",
        "slug": "vision/207-residual-and-skip-connections",
        "status": "live"
      },
      {
        "title": "Normalization, initialization, and training stability",
        "slug": "vision/208-normalization-and-training-stability",
        "status": "live"
      },
      {
        "title": "Image classification, calibration, and error analysis",
        "slug": "vision/209-image-classification-and-error-analysis",
        "status": "live"
      },
      {
        "title": "Data augmentation, invariance, and leakage",
        "slug": "vision/210-data-augmentation-and-invariance",
        "status": "live"
      },
      {
        "title": "Transfer learning and fine-tuning",
        "slug": "vision/211-transfer-learning-and-fine-tuning",
        "status": "live"
      },
      {
        "title": "Object detection: boxes, IoU, matching, and suppression",
        "slug": "vision/212-object-detection-boxes-and-iou",
        "status": "live"
      },
      {
        "title": "One-stage, two-stage, and set-based detection",
        "slug": "vision/213-detection-architectures-and-losses",
        "status": "live"
      },
      {
        "title": "Semantic, instance, and panoptic segmentation",
        "slug": "vision/214-semantic-and-instance-segmentation",
        "status": "live"
      },
      {
        "title": "Segmentation decoders, skip fusion, and boundary failure",
        "slug": "vision/215-segmentation-decoders-and-boundaries",
        "status": "live"
      },
      {
        "title": "Metric learning, embeddings, and visual retrieval",
        "slug": "vision/216-metric-learning-and-visual-retrieval",
        "status": "live"
      },
      {
        "title": "Self-supervised vision: contrastive and masked learning",
        "slug": "vision/217-self-supervised-vision",
        "status": "live"
      },
      {
        "title": "Vision transformers: patches, attention, and scaling",
        "slug": "vision/218-vision-transformers-and-patch-embeddings",
        "status": "live"
      },
      {
        "title": "Hierarchical and efficient vision transformers",
        "slug": "vision/219-hierarchical-and-efficient-vision-transformers",
        "status": "live"
      },
      {
        "title": "Robustness, adversarial examples, and out-of-distribution inputs",
        "slug": "vision/220-adversarial-robustness-and-ood",
        "status": "live"
      },
      {
        "title": "Visual interpretability: saliency, CAM, and explanation limits",
        "slug": "vision/221-visual-interpretability-and-explanations",
        "status": "live"
      },
      {
        "title": "Knowledge distillation and compression",
        "slug": "vision/222-knowledge-distillation-and-model-compression",
        "status": "live"
      },
      {
        "title": "Pruning, sparsity, and quantization",
        "slug": "vision/223-pruning-sparsity-and-quantization",
        "status": "live"
      },
      {
        "title": "Vision serving, preprocessing parity, and inference pipelines",
        "slug": "vision/224-vision-serving-and-inference-pipelines",
        "status": "live"
      },
      {
        "title": "Monitoring, drift, and human review in vision systems",
        "slug": "vision/225-monitoring-drift-and-human-review",
        "status": "live"
      },
      {
        "title": "Case study: medical and scientific imaging",
        "slug": "vision/226-real-world-vision-medical-and-scientific-imaging",
        "status": "live"
      },
      {
        "title": "Case study: autonomy, traffic vision, and safety",
        "slug": "vision/227-real-world-vision-autonomy-and-safety",
        "status": "live"
      },
      {
        "title": "Case study: industrial inspection and retail vision",
        "slug": "vision/228-real-world-vision-industrial-and-retail",
        "status": "live"
      },
      {
        "title": "Multimodal vision and grounded decisions",
        "slug": "vision/229-multimodal-vision-and-grounded-decisions",
        "status": "live"
      },
      {
        "title": "Vision systems capstone: evidence from data to deployment",
        "slug": "vision/230-vision-capstone-and-mastery-check",
        "status": "live"
      },
      {
        "title": "Sequence representations: order, state, and context",
        "slug": "sequence-generative/301-sequence-representations",
        "status": "live"
      },
      {
        "title": "Batch variable-length sequences without corrupting learning",
        "slug": "sequence-generative/302-sequence-batching-padding-and-masks",
        "status": "live"
      },
      {
        "title": "Derive backpropagation through time",
        "slug": "sequence-generative/303-backpropagation-through-time",
        "status": "live"
      },
      {
        "title": "Diagnose vanishing and exploding gradients in sequences",
        "slug": "sequence-generative/304-vanishing-exploding-gradients",
        "status": "live"
      },
      {
        "title": "Build and judge vanilla recurrent neural networks",
        "slug": "sequence-generative/305-vanilla-rnns-and-stateful-models",
        "status": "live"
      },
      {
        "title": "Derive LSTM gates and long-term memory",
        "slug": "sequence-generative/306-lstm-gates-and-memory",
        "status": "live"
      },
      {
        "title": "Use GRUs and compare recurrent gating choices",
        "slug": "sequence-generative/307-gru-gated-recurrent-units",
        "status": "live"
      },
      {
        "title": "Design encoder-decoder sequence models",
        "slug": "sequence-generative/308-encoder-decoder-and-seq2seq",
        "status": "live"
      },
      {
        "title": "Derive scaled dot-product attention",
        "slug": "sequence-generative/309-attention-derivation",
        "status": "live"
      },
      {
        "title": "Understand multi-head and cross-attention",
        "slug": "sequence-generative/310-multihead-and-cross-attention",
        "status": "live"
      },
      {
        "title": "Assemble a transformer block from stable components",
        "slug": "sequence-generative/311-transformer-blocks-residuals-and-normalization",
        "status": "live"
      },
      {
        "title": "Use masks correctly in transformer attention",
        "slug": "sequence-generative/312-causal-padding-and-structured-masks",
        "status": "live"
      },
      {
        "title": "Give attention order: positional and relative encodings",
        "slug": "sequence-generative/313-positional-encodings-and-relative-position",
        "status": "live"
      },
      {
        "title": "Train transformers stably and inspect failure modes",
        "slug": "sequence-generative/314-transformer-training-stability",
        "status": "live"
      },
      {
        "title": "Reason about efficient attention and long contexts",
        "slug": "sequence-generative/315-efficient-attention-and-long-context",
        "status": "live"
      },
      {
        "title": "Use KV caching and measure autoregressive serving",
        "slug": "sequence-generative/316-kv-cache-and-serving-latency",
        "status": "live"
      },
      {
        "title": "Choose language-model objectives and tokenization deliberately",
        "slug": "sequence-generative/317-language-model-objectives-and-tokenization",
        "status": "live"
      },
      {
        "title": "Train language models with data governance and scaling discipline",
        "slug": "sequence-generative/318-language-model-training-data-and-scaling",
        "status": "live"
      },
      {
        "title": "Generate text: greedy, sampling, and beam decisions",
        "slug": "sequence-generative/319-generation-decoding-and-control",
        "status": "live"
      },
      {
        "title": "Evaluate language models beyond perplexity",
        "slug": "sequence-generative/320-language-model-evaluation-calibration-and-behavior",
        "status": "live"
      },
      {
        "title": "Learn embeddings and contrastive representation objectives",
        "slug": "sequence-generative/321-embedding-spaces-and-contrastive-learning",
        "status": "live"
      },
      {
        "title": "Build retrieval systems with trustworthy indexing",
        "slug": "sequence-generative/322-retrieval-indexing-and-approximate-search",
        "status": "live"
      },
      {
        "title": "Rerank retrieved candidates with stronger relevance models",
        "slug": "sequence-generative/323-reranking-cross-encoders-and-ranking-losses",
        "status": "live"
      },
      {
        "title": "Design retrieval-augmented generation as an evidence pipeline",
        "slug": "sequence-generative/324-retrieval-augmented-generation",
        "status": "live"
      },
      {
        "title": "Model text, images, audio, and structured signals together",
        "slug": "sequence-generative/325-multimodal-representations-and-fusion",
        "status": "live"
      },
      {
        "title": "Use autoencoders for reconstruction and representation learning",
        "slug": "sequence-generative/326-autoencoders-and-representation-bottlenecks",
        "status": "live"
      },
      {
        "title": "Derive VAEs and the evidence lower bound",
        "slug": "sequence-generative/327-variational-autoencoders-and-elbo",
        "status": "live"
      },
      {
        "title": "Train GANs and diagnose adversarial instability",
        "slug": "sequence-generative/328-gans-minimax-training-and-instability",
        "status": "live"
      },
      {
        "title": "Derive diffusion forward noising and reverse denoising",
        "slug": "sequence-generative/329-diffusion-forward-process-and-denoising",
        "status": "live"
      },
      {
        "title": "Train and sample diffusion models",
        "slug": "sequence-generative/330-diffusion-objectives-sampling-and-guidance",
        "status": "live"
      },
      {
        "title": "Understand score matching and continuous-time generation",
        "slug": "sequence-generative/331-score-models-and-score-based-generation",
        "status": "live"
      },
      {
        "title": "Model exact densities with normalizing flows",
        "slug": "sequence-generative/332-normalizing-flows-and-change-of-variables",
        "status": "live"
      },
      {
        "title": "Evaluate generative models with fidelity, diversity, and utility",
        "slug": "sequence-generative/333-generative-model-evaluation-and-benchmarks",
        "status": "live"
      },
      {
        "title": "Deploy generative systems with safety, copyright, and provenance controls",
        "slug": "sequence-generative/334-generative-safety-copyright-and-provenance",
        "status": "live"
      },
      {
        "title": "Model sequential decisions with MDPs and returns",
        "slug": "sequence-generative/335-rl-foundations-mdps-and-returns",
        "status": "live"
      },
      {
        "title": "Estimate values and choose policies",
        "slug": "sequence-generative/336-value-functions-policy-evaluation-and-control",
        "status": "live"
      },
      {
        "title": "Use policy gradients, off-policy learning, and exploration safely",
        "slug": "sequence-generative/337-policy-gradients-offpolicy-and-exploration",
        "status": "live"
      },
      {
        "title": "Bridge from RL foundations to RLHF and preference optimization",
        "slug": "sequence-generative/338-rlhf-preference-optimization-and-alignment-bridge",
        "status": "live"
      },
      {
        "title": "Data contracts and schema audits",
        "slug": "practice/401-data-contracts-and-schema-audits",
        "status": "live"
      },
      {
        "title": "Splits, groups, and temporal validation",
        "slug": "practice/402-splits-groups-and-temporal-validation",
        "status": "live"
      },
      {
        "title": "Leakage threat modelling and detection",
        "slug": "practice/403-leakage-threat-modeling-and-detection",
        "status": "live"
      },
      {
        "title": "Streaming datasets, caching, and sharding",
        "slug": "practice/404-streaming-datasets-caching-and-sharding",
        "status": "live"
      },
      {
        "title": "Graded lab: augmentation and sampling policy",
        "slug": "practice/405-augmentation-and-sampling-policy-lab",
        "status": "live"
      },
      {
        "title": "PyTorch modules, forward contracts, and shape discipline",
        "slug": "practice/406-pytorch-modules-forward-contracts-and-shapes",
        "status": "live"
      },
      {
        "title": "Graded lab: training loop, optimizer, and checkpoint",
        "slug": "practice/407-training-loop-optimization-and-checkpoints-lab",
        "status": "live"
      },
      {
        "title": "Batching, collation, masking, and token budgets",
        "slug": "practice/408-batching-collation-masking-and-token-budgets",
        "status": "live"
      },
      {
        "title": "Configuration management, seeds, and reproducibility",
        "slug": "practice/409-configuration-management-seeds-and-reproducibility",
        "status": "live"
      },
      {
        "title": "Graded lab: experiment tracking and ablations",
        "slug": "practice/410-experiment-tracking-ablation-and-decision-records-lab",
        "status": "live"
      },
      {
        "title": "Testing data, model, and training invariants",
        "slug": "practice/411-testing-data-model-and-training-invariants",
        "status": "live"
      },
      {
        "title": "GPU memory accounting and OOM recovery",
        "slug": "practice/412-gpu-memory-accounting-and-out-of-memory-recovery",
        "status": "live"
      },
      {
        "title": "Graded lab: profile an end-to-end training step",
        "slug": "practice/413-throughput-profiling-and-performance-bottlenecks-lab",
        "status": "live"
      },
      {
        "title": "Mixed precision, compilation, and numerical stability",
        "slug": "practice/414-precision-compilation-and-numerical-stability",
        "status": "live"
      },
      {
        "title": "Graded lab: distributed data parallel design",
        "slug": "practice/415-distributed-data-parallel-and-collective-failures-lab",
        "status": "live"
      },
      {
        "title": "Data versioning, lineage, and retention governance",
        "slug": "practice/416-data-versioning-lineage-and-retention-governance",
        "status": "live"
      },
      {
        "title": "Model artifacts, versioning, and supply-chain control",
        "slug": "practice/417-model-artifact-versioning-and-supply-chain-control",
        "status": "live"
      },
      {
        "title": "Graded lab: evaluate a release candidate",
        "slug": "practice/418-evaluation-gates-and-release-readiness-lab",
        "status": "live"
      },
      {
        "title": "Serving interfaces, batching, and deployment contracts",
        "slug": "practice/419-serving-interfaces-batching-and-deployment-contracts",
        "status": "live"
      },
      {
        "title": "Capacity, latency, and cost engineering",
        "slug": "practice/420-capacity-latency-and-cost-engineering",
        "status": "live"
      },
      {
        "title": "Graded lab: monitoring, drift, and retraining signals",
        "slug": "practice/421-monitoring-drift-feedback-and-retraining-lab",
        "status": "live"
      },
      {
        "title": "Calibration, abstention, and human-in-the-loop design",
        "slug": "practice/422-calibration-abstention-and-human-in-the-loop-design",
        "status": "live"
      },
      {
        "title": "Adversarial security and model supply-chain risk",
        "slug": "practice/423-adversarial-security-and-model-supply-chain-risk",
        "status": "live"
      },
      {
        "title": "Privacy-preserving training and inference",
        "slug": "practice/424-privacy-preserving-training-and-inference",
        "status": "live"
      },
      {
        "title": "Graded lab: fairness, accessibility, and ethical impact",
        "slug": "practice/425-fairness-accessibility-and-ethical-impact-lab",
        "status": "live"
      },
      {
        "title": "Model cards and communicating limitations",
        "slug": "practice/426-model-cards-and-communication-of-limitations",
        "status": "live"
      },
      {
        "title": "Incidents, rollbacks, and postmortems",
        "slug": "practice/427-incidents-rollbacks-and-postmortems",
        "status": "live"
      },
      {
        "title": "Case study: vision quality inspection from line camera to operator",
        "slug": "practice/428-case-study-vision-quality-inspection",
        "status": "live"
      },
      {
        "title": "Case study: language support with human feedback loops",
        "slug": "practice/429-case-study-language-support-and-feedback-loops",
        "status": "live"
      },
      {
        "title": "Graded staged capstone and technical defense",
        "slug": "practice/430-staged-capstone-and-technical-defense",
        "status": "live"
      },
      {
        "title": "Understand attention as learned context selection",
        "slug": "attention-and-transformers",
        "status": "live"
      },
      {
        "title": "Understand learning through loss, gradients, and updates",
        "slug": "loss-gradients-and-optimization",
        "status": "live"
      },
      {
        "title": "Deep learning: parameters learn representations",
        "slug": "neural-networks-and-representations",
        "status": "live"
      }
    ]
  },
  {
    "id": "prompt-engineering",
    "n": "09",
    "name": "Prompt Engineering",
    "group": "Working with Models",
    "meta": "142 lessons",
    "summary": "Reliable, repeatable prompting techniques for getting the output you actually want out of a model.",
    "nodes": [
      {
        "title": "The Whole Game: One Task From Vague Ask to Reliable Prompt",
        "slug": "pe-whole-game-ticket-classifier",
        "status": "live"
      },
      {
        "title": "Answer-First Prompting",
        "slug": "answer-first-prompting",
        "status": "live"
      },
      {
        "title": "System Prompts vs User Prompts",
        "slug": "system-vs-user-prompts",
        "status": "live"
      },
      {
        "title": "System vs User Messages: Who Sets the Rules",
        "slug": "system-vs-user-message-roles",
        "status": "live"
      },
      {
        "title": "What Role Prompting Actually Changes",
        "slug": "what-role-prompting-changes",
        "status": "live"
      },
      {
        "title": "Persona Theater: Roles That Change Nothing",
        "slug": "persona-theater-that-does-nothing",
        "status": "live"
      },
      {
        "title": "Before/After: A Role That Earns Its Tokens",
        "slug": "role-prompt-before-after",
        "status": "live"
      },
      {
        "title": "Prefilling: Starting the Assistant's Answer for It",
        "slug": "prefilling-the-assistant-turn",
        "status": "live"
      },
      {
        "title": "Worked Example: Prefilling to Guarantee JSON",
        "slug": "prefill-to-force-json-worked",
        "status": "live"
      },
      {
        "title": "Why 'Don't Do X' Often Backfires",
        "slug": "negative-instructions-problem",
        "status": "live"
      },
      {
        "title": "Before/After: Turning Prohibitions Into Positive Instructions",
        "slug": "rewrite-dont-into-do",
        "status": "live"
      },
      {
        "title": "Managing State Across a Multi-Turn Conversation",
        "slug": "multi-turn-prompt-state",
        "status": "live"
      },
      {
        "title": "Building a Product Assistant's System Prompt",
        "slug": "system-prompt-for-product-assistant",
        "status": "live"
      },
      {
        "title": "The Steering Levers: Role, Prefill, Format, Examples",
        "slug": "steering-levers-overview",
        "status": "live"
      },
      {
        "title": "System-Prompt Bloat and Conflicting Rules",
        "slug": "system-prompt-bloat",
        "status": "live"
      },
      {
        "title": "Quiz: Roles, System Prompts, and Steering",
        "slug": "roles-steering-quiz",
        "status": "live"
      },
      {
        "title": "Delimiters: Fencing Off Instructions from Content",
        "slug": "delimiters-and-formatting",
        "status": "live"
      },
      {
        "title": "Role Prompting: What Personas Actually Change",
        "slug": "role-prompting",
        "status": "live"
      },
      {
        "title": "Few-Shot Prompting: Teaching by Example",
        "slug": "few-shot-prompting",
        "status": "live"
      },
      {
        "title": "In-Context Learning: Teaching by Example at Inference Time",
        "slug": "in-context-learning-for-prompters",
        "status": "live"
      },
      {
        "title": "Zero-Shot: When You Don't Need Examples",
        "slug": "zero-shot-when-its-enough",
        "status": "live"
      },
      {
        "title": "Choosing Which Examples to Show",
        "slug": "few-shot-example-selection",
        "status": "live"
      },
      {
        "title": "Why a Good Example Outperforms a Paragraph of Rules",
        "slug": "why-examples-beat-instructions-sometimes",
        "status": "live"
      },
      {
        "title": "Worked Example: A Three-Shot Intent Classifier",
        "slug": "three-shot-classifier-worked",
        "status": "live"
      },
      {
        "title": "How Many Shots, and In What Order",
        "slug": "example-count-and-ordering",
        "status": "live"
      },
      {
        "title": "When Your Examples Teach the Wrong Thing",
        "slug": "few-shot-format-leakage",
        "status": "live"
      },
      {
        "title": "Examples for Format vs Examples for Reasoning",
        "slug": "examples-for-format-vs-reasoning",
        "status": "live"
      },
      {
        "title": "Retrieving Few-Shot Examples at Runtime",
        "slug": "dynamic-few-shot-retrieval",
        "status": "live"
      },
      {
        "title": "Label Bias, Recency Bias, and Majority Labels",
        "slug": "label-bias-and-majority-label",
        "status": "live"
      },
      {
        "title": "Before/After: Repairing a Broken Few-Shot Prompt",
        "slug": "fixing-a-failing-few-shot-prompt",
        "status": "live"
      },
      {
        "title": "Few-Shot Design Cheatsheet",
        "slug": "few-shot-design-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Examples and In-Context Learning",
        "slug": "examples-icl-quiz",
        "status": "live"
      },
      {
        "title": "Zero-Shot vs Few-Shot: When Examples Earn Their Tokens",
        "slug": "zero-shot-vs-few-shot",
        "status": "live"
      },
      {
        "title": "Chain-of-Thought: Getting the Model to Show Its Work",
        "slug": "chain-of-thought-prompting",
        "status": "live"
      },
      {
        "title": "What Chain-of-Thought Actually Does",
        "slug": "what-chain-of-thought-actually-does",
        "status": "live"
      },
      {
        "title": "Reasoning as a Scratchpad for a Token Predictor",
        "slug": "reasoning-as-scratchpad-intuition",
        "status": "live"
      },
      {
        "title": "Worked Example: Chain-of-Thought on a Multi-Step Problem",
        "slug": "cot-on-a-word-problem",
        "status": "live"
      },
      {
        "title": "Zero-Shot CoT vs Few-Shot CoT",
        "slug": "zero-shot-cot-vs-few-shot-cot",
        "status": "live"
      },
      {
        "title": "Answer-First vs Reasoning-First Ordering",
        "slug": "answer-first-vs-reasoning-first",
        "status": "live"
      },
      {
        "title": "Self-Consistency: Sampling and Voting",
        "slug": "self-consistency-sampling-explained",
        "status": "live"
      },
      {
        "title": "Tree-of-Thought: When the Complexity Pays Off",
        "slug": "tree-of-thought-when-worth-it",
        "status": "live"
      },
      {
        "title": "Extended Thinking and Reasoning-Effort Budgets",
        "slug": "extended-thinking-budgets",
        "status": "live"
      },
      {
        "title": "Cargo-Cult Reasoning: Steps That Don't Help",
        "slug": "cargo-cult-reasoning",
        "status": "live"
      },
      {
        "title": "When Chain-of-Thought Hurts",
        "slug": "when-cot-hurts-accuracy",
        "status": "live"
      },
      {
        "title": "Reliably Extracting the Final Answer After Reasoning",
        "slug": "extracting-final-answer-from-reasoning",
        "status": "live"
      },
      {
        "title": "Which Reasoning Technique When: A Decision Guide",
        "slug": "reasoning-technique-decision-guide",
        "status": "live"
      },
      {
        "title": "Worked Example: Voting Over Samples on a Hard Classification",
        "slug": "self-consistency-on-classification-worked",
        "status": "live"
      },
      {
        "title": "Quiz: Reasoning and Chain-of-Thought",
        "slug": "reasoning-quiz",
        "status": "live"
      },
      {
        "title": "Decomposition: Splitting One Big Prompt into a Pipeline",
        "slug": "task-decomposition",
        "status": "live"
      },
      {
        "title": "When to Split One Prompt Into a Pipeline",
        "slug": "when-to-split-a-prompt",
        "status": "live"
      },
      {
        "title": "One Prompt, One Job",
        "slug": "one-prompt-one-job-intuition",
        "status": "live"
      },
      {
        "title": "Worked Example: Refactoring a Resume Screener Into Stages",
        "slug": "monolith-to-pipeline-worked",
        "status": "live"
      },
      {
        "title": "Chain-of-Density: Iterative Summary Refinement",
        "slug": "chain-of-density-summarization-explained",
        "status": "live"
      },
      {
        "title": "Structured Output: Making the Model Speak a Contract",
        "slug": "structured-output-contracts",
        "status": "live"
      },
      {
        "title": "Enforcing a JSON Schema From the Prompt",
        "slug": "json-schema-in-prompts",
        "status": "live"
      },
      {
        "title": "Before/After: Taming Malformed JSON",
        "slug": "fixing-malformed-json-output",
        "status": "live"
      },
      {
        "title": "Building a Validate-and-Repair Loop",
        "slug": "validation-and-repair-loop",
        "status": "live"
      },
      {
        "title": "Pipeline vs Single Call: Cost, Latency, Reliability",
        "slug": "pipeline-vs-single-call-tradeoffs",
        "status": "live"
      },
      {
        "title": "Over-Decomposition: Too Many Stages",
        "slug": "over-decomposition",
        "status": "live"
      },
      {
        "title": "Worked Example: A Classify-Then-Extract Pipeline",
        "slug": "classify-then-extract-pipeline",
        "status": "live"
      },
      {
        "title": "Passing State Cleanly Between Pipeline Stages",
        "slug": "passing-state-between-stages",
        "status": "live"
      },
      {
        "title": "Decomposition and Structured-Output Cheatsheet",
        "slug": "decomposition-output-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Decomposition and Structured Output",
        "slug": "decomposition-output-quiz",
        "status": "live"
      },
      {
        "title": "Self-Consistency: Voting Across Multiple Reasoning Paths",
        "slug": "self-consistency-sampling",
        "status": "live"
      },
      {
        "title": "Why 'Don't Do X' Backfires",
        "slug": "negative-instructions-pitfall",
        "status": "live"
      },
      {
        "title": "Prompt Templates: Building Reusable, Parameterized Prompts",
        "slug": "prompt-templates-and-variables",
        "status": "live"
      },
      {
        "title": "Prompt Anti-Patterns to Stop Doing",
        "slug": "prompt-anti-patterns",
        "status": "live"
      },
      {
        "title": "The Anti-Patterns Catalog: Habits to Drop",
        "slug": "prompt-anti-patterns-catalog",
        "status": "live"
      },
      {
        "title": "Prompt Injection: When the Input Fights Your Instructions",
        "slug": "prompt-injection-basics",
        "status": "live"
      },
      {
        "title": "Worked Example: An Injection Attack and Its Mitigations",
        "slug": "injection-attack-and-defense-worked",
        "status": "live"
      },
      {
        "title": "Defense in Depth: Delimiters, Roles, and Trust Boundaries",
        "slug": "defending-with-delimiters-and-roles",
        "status": "live"
      },
      {
        "title": "Adapting Prompts Across Languages",
        "slug": "adapting-prompts-across-languages",
        "status": "live"
      },
      {
        "title": "Worked Example: A Multimodal Image-Plus-Text Prompt",
        "slug": "multimodal-prompt-worked",
        "status": "live"
      },
      {
        "title": "Robustness Mistakes: Assuming Clean, Friendly Input",
        "slug": "robustness-common-mistakes",
        "status": "live"
      },
      {
        "title": "Handling Refusals and Safety Boundaries",
        "slug": "handling-refusals-and-safety-boundaries",
        "status": "live"
      },
      {
        "title": "Cost and Token Budgets for Prompts",
        "slug": "cost-and-token-budget-for-prompts",
        "status": "live"
      },
      {
        "title": "Robustness and Safety Cheatsheet",
        "slug": "robustness-safety-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Robustness, Safety, and the Capstone",
        "slug": "robustness-capstone-quiz",
        "status": "live"
      },
      {
        "title": "Evaluating Prompts Before You Ship Them",
        "slug": "prompt-evaluation-basics",
        "status": "live"
      },
      {
        "title": "Prefilling Responses to Steer Output Format",
        "slug": "prefilling-responses",
        "status": "live"
      },
      {
        "title": "XML Tags vs. Markdown: Structuring Prompts for Reliability",
        "slug": "xml-tags-vs-markdown",
        "status": "live"
      },
      {
        "title": "Multi-Turn Prompt Design: Steering a Conversation, Not a Single Shot",
        "slug": "multi-turn-prompt-design",
        "status": "live"
      },
      {
        "title": "Prompt Portability: Writing Prompts That Survive a Model Swap",
        "slug": "prompt-portability-across-models",
        "status": "live"
      },
      {
        "title": "Prompt Versioning: Treating Prompts Like Code",
        "slug": "prompt-versioning-and-change-management",
        "status": "live"
      },
      {
        "title": "A/B Testing Prompts Against Real Traffic",
        "slug": "ab-testing-prompts-in-production",
        "status": "live"
      },
      {
        "title": "Extended Thinking: Controlling How Much a Model Reasons Before Answering",
        "slug": "extended-thinking-and-reasoning-effort",
        "status": "live"
      },
      {
        "title": "Tree-of-Thought Prompting: Branching Instead of Committing to One Chain",
        "slug": "tree-of-thought-prompting",
        "status": "live"
      },
      {
        "title": "Chain-of-Density: Iteratively Tightening a Draft",
        "slug": "chain-of-density-summarization",
        "status": "live"
      },
      {
        "title": "Meta-Prompting: Using a Model to Write Your Prompts",
        "slug": "meta-prompting-with-models",
        "status": "live"
      },
      {
        "title": "Automatic Prompt Optimization with Tools Like DSPy",
        "slug": "automatic-prompt-optimization",
        "status": "live"
      },
      {
        "title": "What prompting actually is",
        "slug": "what-prompting-is",
        "status": "live"
      },
      {
        "title": "What prompt engineering is",
        "slug": "what-prompt-engineering-is",
        "status": "live"
      },
      {
        "title": "Why Prompting Works: Steering a Next-Token Predictor",
        "slug": "why-prompts-steer-next-token-prediction",
        "status": "live"
      },
      {
        "title": "A Prompt Is a Set of Constraints on Likely Continuations",
        "slug": "prompt-as-conditioning-intuition",
        "status": "live"
      },
      {
        "title": "Prompting Is Not Programming: Living With Nondeterminism",
        "slug": "prompting-is-not-deterministic-programming",
        "status": "live"
      },
      {
        "title": "Before/After: Turning 'Summarize This' Into a Specification",
        "slug": "before-after-vague-summary-prompt",
        "status": "live"
      },
      {
        "title": "What Prompting Cannot Fix",
        "slug": "what-prompting-cannot-fix",
        "status": "live"
      },
      {
        "title": "Reliability Beats Cleverness",
        "slug": "reliability-over-clever-tricks",
        "status": "live"
      },
      {
        "title": "The Anatomy of a Production Prompt",
        "slug": "anatomy-of-a-production-prompt",
        "status": "live"
      },
      {
        "title": "Diagnosing Why a Prompt Failed",
        "slug": "reading-a-model-failure",
        "status": "live"
      },
      {
        "title": "Temperature for Prompt Engineers: When to Turn It Down",
        "slug": "temperature-and-determinism-for-prompters",
        "status": "live"
      },
      {
        "title": "The Five Mistakes Every Beginner Makes",
        "slug": "beginner-prompting-mistakes",
        "status": "live"
      },
      {
        "title": "First-Principles Prompting Cheatsheet",
        "slug": "prompt-first-principles-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Foundations and Mental Model",
        "slug": "foundations-quiz",
        "status": "live"
      },
      {
        "title": "Task framing: intent, constraints, and acceptance criteria",
        "slug": "task-framing",
        "status": "live"
      },
      {
        "title": "Prompt patterns: zero-shot, few-shot, decomposition, and critique",
        "slug": "prompt-patterns",
        "status": "live"
      },
      {
        "title": "Structured output: make the model speak a contract",
        "slug": "structured-output",
        "status": "live"
      },
      {
        "title": "Reasoning and decomposition without cargo culting",
        "slug": "reasoning-and-decomposition",
        "status": "live"
      },
      {
        "title": "Evaluate prompts with datasets, rubrics, and regression tests",
        "slug": "prompt-evaluation",
        "status": "live"
      },
      {
        "title": "Why You Evaluate Before You Ship",
        "slug": "why-eval-before-ship",
        "status": "live"
      },
      {
        "title": "Building a Prompt Eval Dataset",
        "slug": "building-an-eval-dataset",
        "status": "live"
      },
      {
        "title": "Rubric Scoring With an LLM Judge",
        "slug": "rubric-and-llm-judge",
        "status": "live"
      },
      {
        "title": "Regression Tests: Keeping a Golden Set Green",
        "slug": "regression-tests-for-prompts",
        "status": "live"
      },
      {
        "title": "A/B Testing Prompts on Real Traffic",
        "slug": "ab-testing-in-production",
        "status": "live"
      },
      {
        "title": "Worked Example: Reading an A/B Test Result",
        "slug": "reading-ab-test-results",
        "status": "live"
      },
      {
        "title": "Versioning Prompts Like Production Code",
        "slug": "prompt-versioning-like-code",
        "status": "live"
      },
      {
        "title": "A Change-Management Workflow for Prompts",
        "slug": "change-management-workflow",
        "status": "live"
      },
      {
        "title": "Portability: Surviving a Model Swap",
        "slug": "prompt-portability-across-models-strategy",
        "status": "live"
      },
      {
        "title": "Before/After: Porting a Prompt to a New Model",
        "slug": "porting-a-prompt-worked",
        "status": "live"
      },
      {
        "title": "Automatic Prompt Optimization With DSPy",
        "slug": "automatic-prompt-optimization-dspy",
        "status": "live"
      },
      {
        "title": "Meta-Prompting: Using a Model to Write Prompts",
        "slug": "meta-prompting-to-draft-prompts",
        "status": "live"
      },
      {
        "title": "Evaluation and Versioning Cheatsheet",
        "slug": "eval-versioning-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Evaluating, Versioning, and Shipping",
        "slug": "eval-shipping-quiz",
        "status": "live"
      },
      {
        "title": "Capstone: build a prompt library that can survive a change",
        "slug": "prompt-library-capstone",
        "status": "live"
      },
      {
        "title": "Separate instructions, context, examples, and output contracts",
        "slug": "instructions-context-examples",
        "status": "live"
      },
      {
        "title": "Sectioning: Instructions, Context, Examples, Output",
        "slug": "sectioning-a-prompt-into-blocks",
        "status": "live"
      },
      {
        "title": "Delimiters That Actually Reduce Errors",
        "slug": "delimiters-that-actually-help",
        "status": "live"
      },
      {
        "title": "XML vs Markdown vs JSON: Choosing a Prompt Format",
        "slug": "xml-markdown-json-formatting-tradeoffs",
        "status": "live"
      },
      {
        "title": "Before/After: Untangling a Wall-of-Text Prompt",
        "slug": "rewriting-a-wall-of-text-prompt",
        "status": "live"
      },
      {
        "title": "Task Framing: Intent, Constraints, Acceptance Criteria",
        "slug": "task-framing-intent-constraints-criteria",
        "status": "live"
      },
      {
        "title": "Writing Machine-Checkable Acceptance Criteria",
        "slug": "acceptance-criteria-in-prompts",
        "status": "live"
      },
      {
        "title": "Templates: Separating the Stable Prompt From the Variable Input",
        "slug": "prompt-templates-and-variable-slots",
        "status": "live"
      },
      {
        "title": "Implementing a Minimal Prompt Template Engine",
        "slug": "building-a-prompt-template-engine",
        "status": "live"
      },
      {
        "title": "Safely Injecting User Content Into a Template",
        "slug": "escaping-user-content-in-templates",
        "status": "live"
      },
      {
        "title": "Formatting Anti-Patterns: Over-Fencing and Inconsistent Tags",
        "slug": "formatting-anti-patterns",
        "status": "live"
      },
      {
        "title": "Where to Put the Instruction: Position and Recency Effects",
        "slug": "instruction-position-and-recency",
        "status": "live"
      },
      {
        "title": "Why Ordering and Whitespace Change the Output",
        "slug": "why-ordering-and-whitespace-matter",
        "status": "live"
      },
      {
        "title": "Worked Example: A Fully Structured Support-Reply Prompt",
        "slug": "structured-prompt-worked-example",
        "status": "live"
      },
      {
        "title": "Quiz: Structure and Formatting",
        "slug": "structure-formatting-quiz",
        "status": "live"
      },
      {
        "title": "Version prompts like production code",
        "slug": "prompt-versioning-and-reuse",
        "status": "live"
      },
      {
        "title": "Adapt prompts across modalities and languages",
        "slug": "multimodal-and-localized-prompts",
        "status": "live"
      },
      {
        "title": "Capstone Project: Build a Versioned, Evaluated Prompt Library",
        "slug": "prompt-library-capstone-project",
        "status": "live"
      }
    ]
  },
  {
    "id": "context-engineering",
    "n": "10",
    "name": "Context Engineering",
    "group": "Working with Models",
    "meta": "132 lessons",
    "summary": "Curating what actually goes into the context window so the model has the right information, in the right order, at the right cost.",
    "nodes": [
      {
        "title": "The Whole Game of Context Engineering",
        "slug": "the-whole-game-of-context-engineering",
        "status": "live"
      },
      {
        "title": "Context Engineering vs Prompt Engineering",
        "slug": "context-engineering-vs-prompting",
        "status": "live"
      },
      {
        "title": "Relevance Filtering: Deciding What Doesn't Make the Cut",
        "slug": "relevance-filtering",
        "status": "live"
      },
      {
        "title": "Context Ordering: Why Position Changes What the Model Notices",
        "slug": "context-ordering-and-recency-effects",
        "status": "live"
      },
      {
        "title": "Retrieval vs Stuffing: Fetch Just-in-Time or Load It All",
        "slug": "retrieval-vs-context-stuffing",
        "status": "live"
      },
      {
        "title": "Stuff It or Retrieve It",
        "slug": "stuffing-vs-retrieval-decision",
        "status": "live"
      },
      {
        "title": "When Long Context Beats RAG",
        "slug": "when-long-context-beats-rag",
        "status": "live"
      },
      {
        "title": "The Just-in-Time Loading Pattern",
        "slug": "just-in-time-context-loading-pattern",
        "status": "live"
      },
      {
        "title": "Lazy vs Eager Loading",
        "slug": "lazy-vs-eager-context-loading",
        "status": "live"
      },
      {
        "title": "Building a Just-in-Time Loader",
        "slug": "building-a-jit-loader",
        "status": "live"
      },
      {
        "title": "Progressive Tool Disclosure",
        "slug": "progressive-tool-disclosure-in-depth",
        "status": "live"
      },
      {
        "title": "A Retrieve-Then-Filter Pipeline",
        "slug": "retrieving-then-filtering-pipeline",
        "status": "live"
      },
      {
        "title": "Strategies for Million-Token Windows",
        "slug": "million-token-window-strategies",
        "status": "live"
      },
      {
        "title": "Pass Pointers, Not Payloads",
        "slug": "reference-by-pointer-not-value",
        "status": "live"
      },
      {
        "title": "How Retrieval and Budget Interact",
        "slug": "retrieval-budget-interaction",
        "status": "live"
      },
      {
        "title": "Over-Retrieval and Over-Stuffing",
        "slug": "over-retrieval-and-stuffing-mistakes",
        "status": "live"
      },
      {
        "title": "Retrieval vs Stuffing Cheatsheet",
        "slug": "retrieval-vs-stuffing-cheatsheet",
        "status": "live"
      },
      {
        "title": "Retrieval and JIT Quiz",
        "slug": "retrieval-and-jit-quiz",
        "status": "live"
      },
      {
        "title": "Token Budgeting: Splitting a Fixed Context Window",
        "slug": "token-budgeting-strategies",
        "status": "live"
      },
      {
        "title": "What a Token Budget Actually Is",
        "slug": "what-a-token-budget-is",
        "status": "live"
      },
      {
        "title": "Setting Per-Segment Budgets",
        "slug": "setting-per-segment-budgets",
        "status": "live"
      },
      {
        "title": "Budget as a Zero-Sum Pie",
        "slug": "the-budget-allocation-mental-model",
        "status": "live"
      },
      {
        "title": "The Cost, Latency, and Quality Curve",
        "slug": "cost-latency-quality-tradeoff-curve",
        "status": "live"
      },
      {
        "title": "Measuring What Fills the Window",
        "slug": "measuring-what-fills-the-window",
        "status": "live"
      },
      {
        "title": "Building a Context Observability View",
        "slug": "building-a-context-observability-dashboard",
        "status": "live"
      },
      {
        "title": "A Per-Turn Token Ledger",
        "slug": "token-accounting-per-turn-ledger",
        "status": "live"
      },
      {
        "title": "Fixed, Proportional, and Priority Budgets",
        "slug": "budgeting-strategies-compared",
        "status": "live"
      },
      {
        "title": "Reallocating the Budget on the Fly",
        "slug": "dynamic-budget-reallocation",
        "status": "live"
      },
      {
        "title": "Budgeting for a Conversation That Grows",
        "slug": "budgeting-for-multi-turn-growth",
        "status": "live"
      },
      {
        "title": "Instrumenting Token Spend in Production",
        "slug": "instrumenting-token-spend-in-production",
        "status": "live"
      },
      {
        "title": "Budgeting Mistakes That Bite Later",
        "slug": "budgeting-common-mistakes",
        "status": "live"
      },
      {
        "title": "Token Budget Cheatsheet",
        "slug": "token-budget-cheatsheet",
        "status": "live"
      },
      {
        "title": "Budgeting and Observability Quiz",
        "slug": "budgeting-and-observability-quiz",
        "status": "live"
      },
      {
        "title": "Memory vs State: What Persists Across Turns and Sessions",
        "slug": "conversation-memory-and-state",
        "status": "live"
      },
      {
        "title": "Compaction: Summarizing History to Reclaim Context Space",
        "slug": "summarization-for-compaction",
        "status": "live"
      },
      {
        "title": "Sliding Windows: Rolling Off Old Turns Without Losing the Thread",
        "slug": "sliding-window-context-management",
        "status": "live"
      },
      {
        "title": "Context Rot: When More Tokens Make the Model Worse",
        "slug": "context-rot",
        "status": "live"
      },
      {
        "title": "Context Rot Explained",
        "slug": "context-rot-explained",
        "status": "live"
      },
      {
        "title": "Why More Tokens Can Hurt",
        "slug": "why-more-tokens-hurt",
        "status": "live"
      },
      {
        "title": "Context Poisoning and Distraction",
        "slug": "context-poisoning-and-distraction-deep",
        "status": "live"
      },
      {
        "title": "Injection Through Retrieved Content",
        "slug": "prompt-injection-via-retrieved-content",
        "status": "live"
      },
      {
        "title": "Detecting Context Degradation",
        "slug": "detecting-context-degradation",
        "status": "live"
      },
      {
        "title": "Testing Whether Context Actually Helps",
        "slug": "testing-whether-context-helps",
        "status": "live"
      },
      {
        "title": "A/B Testing Context Variants",
        "slug": "ab-testing-context-variants",
        "status": "live"
      },
      {
        "title": "An Eval Harness for Context Choices",
        "slug": "eval-harness-for-context",
        "status": "live"
      },
      {
        "title": "Poisoning in the Wild",
        "slug": "poisoning-real-world-scenarios",
        "status": "live"
      },
      {
        "title": "An Information View of Context Noise",
        "slug": "entropy-and-context-noise",
        "status": "live"
      },
      {
        "title": "Failure-Mode Mistakes",
        "slug": "context-failure-mode-mistakes",
        "status": "live"
      },
      {
        "title": "Failure-Mode Cheatsheet",
        "slug": "failure-mode-cheatsheet",
        "status": "live"
      },
      {
        "title": "Failure Modes Quiz",
        "slug": "failure-modes-quiz",
        "status": "live"
      },
      {
        "title": "Structuring Injected Context So the Model Can Actually Use It",
        "slug": "structured-context-injection",
        "status": "live"
      },
      {
        "title": "Merging Context from Multiple Tools Without Contradictions",
        "slug": "multi-source-context-merging",
        "status": "live"
      },
      {
        "title": "Long-Context Strategies for Million-Token Windows",
        "slug": "long-context-strategies",
        "status": "live"
      },
      {
        "title": "Testing Whether More Context Actually Helps",
        "slug": "context-window-testing-and-eval",
        "status": "live"
      },
      {
        "title": "Context Window Anatomy: Where Every Token Actually Goes",
        "slug": "context-window-anatomy",
        "status": "live"
      },
      {
        "title": "Why Context Is the Real Bottleneck",
        "slug": "why-context-is-the-real-bottleneck",
        "status": "live"
      },
      {
        "title": "The Window as Working Memory",
        "slug": "context-window-as-working-memory",
        "status": "live"
      },
      {
        "title": "Dissecting a Live Context Payload",
        "slug": "dissecting-a-live-context-payload",
        "status": "live"
      },
      {
        "title": "Tokens Are Not Words",
        "slug": "tokens-are-not-words",
        "status": "live"
      },
      {
        "title": "Counting Tokens in Practice",
        "slug": "counting-tokens-in-practice",
        "status": "live"
      },
      {
        "title": "Where Prompting Ends and Context Engineering Begins",
        "slug": "the-context-engineering-vs-prompting-line",
        "status": "live"
      },
      {
        "title": "System, User, Assistant, Tool: Roles as Structure",
        "slug": "message-roles-and-structure",
        "status": "live"
      },
      {
        "title": "The Stateless Model Behind the Stateful Agent",
        "slug": "stateless-model-stateful-agent",
        "status": "live"
      },
      {
        "title": "Reading a Context Budget",
        "slug": "reading-a-context-budget-pie",
        "status": "live"
      },
      {
        "title": "Five Ways Beginners Blow the Window",
        "slug": "beginner-context-mistakes",
        "status": "live"
      },
      {
        "title": "Context Engineering Vocabulary",
        "slug": "context-engineering-vocabulary",
        "status": "live"
      },
      {
        "title": "Foundations Quiz",
        "slug": "foundations-quiz",
        "status": "live"
      },
      {
        "title": "Lost in the Middle: Why Position Beats Presence",
        "slug": "lost-in-the-middle",
        "status": "live"
      },
      {
        "title": "The Include-or-Cut Decision",
        "slug": "what-to-include-vs-what-to-cut",
        "status": "live"
      },
      {
        "title": "Relevance Filtering in Depth",
        "slug": "relevance-filtering-in-depth",
        "status": "live"
      },
      {
        "title": "Signal-to-Noise in the Window",
        "slug": "signal-to-noise-in-context",
        "status": "live"
      },
      {
        "title": "Lost in the Middle, Explained",
        "slug": "lost-in-the-middle-explained",
        "status": "live"
      },
      {
        "title": "Recency and Primacy Effects",
        "slug": "recency-and-primacy-effects",
        "status": "live"
      },
      {
        "title": "Ordering Context for Attention",
        "slug": "ordering-context-for-attention",
        "status": "live"
      },
      {
        "title": "Reproducing Lost in the Middle Yourself",
        "slug": "reproducing-lost-in-the-middle",
        "status": "live"
      },
      {
        "title": "Structured Context Injection",
        "slug": "structured-context-injection-patterns",
        "status": "live"
      },
      {
        "title": "XML vs Markdown vs JSON Delimiters",
        "slug": "xml-vs-markdown-vs-json-delimiting",
        "status": "live"
      },
      {
        "title": "Placing Instructions So They Stick",
        "slug": "placing-instructions-for-adherence",
        "status": "live"
      },
      {
        "title": "Filtering vs Reranking",
        "slug": "filtering-vs-reranking",
        "status": "live"
      },
      {
        "title": "Selection and Ordering Mistakes",
        "slug": "relevance-filtering-common-mistakes",
        "status": "live"
      },
      {
        "title": "Selection and Ordering Cheatsheet",
        "slug": "selection-and-ordering-cheatsheet",
        "status": "live"
      },
      {
        "title": "Selection and Ordering Quiz",
        "slug": "selection-ordering-quiz",
        "status": "live"
      },
      {
        "title": "Hierarchical Summarization: Compressing History in Layers",
        "slug": "hierarchical-summarization",
        "status": "live"
      },
      {
        "title": "Why Compaction Is Unavoidable",
        "slug": "why-compaction-is-necessary",
        "status": "live"
      },
      {
        "title": "Summarization for Compaction",
        "slug": "summarization-for-compaction-deep",
        "status": "live"
      },
      {
        "title": "Hierarchical Summarization",
        "slug": "hierarchical-summarization-explained",
        "status": "live"
      },
      {
        "title": "Building a Rolling Summarizer",
        "slug": "building-a-rolling-summarizer",
        "status": "live"
      },
      {
        "title": "Sliding Window Context Management",
        "slug": "sliding-window-context-management-deep",
        "status": "live"
      },
      {
        "title": "Scratchpad and Working-Memory Patterns",
        "slug": "scratchpad-working-memory-patterns",
        "status": "live"
      },
      {
        "title": "Memory vs State",
        "slug": "memory-vs-state-distinction",
        "status": "live"
      },
      {
        "title": "Memory Across Sessions",
        "slug": "cross-session-memory-architecture",
        "status": "live"
      },
      {
        "title": "Vector, KV, and Graph Memory Stores",
        "slug": "structured-memory-stores-compared",
        "status": "live"
      },
      {
        "title": "What to Remember, What to Forget",
        "slug": "what-to-remember-vs-forget",
        "status": "live"
      },
      {
        "title": "When Compaction Drops the Thing That Mattered",
        "slug": "compaction-that-drops-key-facts",
        "status": "live"
      },
      {
        "title": "Compacting a 200-Step Agent Run",
        "slug": "compacting-a-long-agent-run",
        "status": "live"
      },
      {
        "title": "Memory and Compaction Cheatsheet",
        "slug": "memory-and-compaction-cheatsheet",
        "status": "live"
      },
      {
        "title": "Compaction and Memory Quiz",
        "slug": "compaction-memory-quiz",
        "status": "live"
      },
      {
        "title": "Tool Output Deduplication: Stopping Repeated Results from Eating the Budget",
        "slug": "tool-output-deduplication",
        "status": "live"
      },
      {
        "title": "Cache-Aware Context Design: Ordering for Cache Hits",
        "slug": "cache-aware-context-design",
        "status": "live"
      },
      {
        "title": "Tool Output Is Context Too",
        "slug": "tool-output-is-context-too",
        "status": "live"
      },
      {
        "title": "Tool Output Deduplication",
        "slug": "tool-output-deduplication-deep",
        "status": "live"
      },
      {
        "title": "Merging Context From Many Sources",
        "slug": "merging-multi-source-context",
        "status": "live"
      },
      {
        "title": "Deduping Overlapping Tool Results",
        "slug": "deduping-overlapping-tool-results",
        "status": "live"
      },
      {
        "title": "How Prompt Caching Works",
        "slug": "prompt-caching-mechanics",
        "status": "live"
      },
      {
        "title": "Cache-Aware Context Design",
        "slug": "cache-aware-context-design-deep",
        "status": "live"
      },
      {
        "title": "Ordering for Cache Hits",
        "slug": "ordering-for-cache-hits",
        "status": "live"
      },
      {
        "title": "KV Cache and Context Prefixes",
        "slug": "kv-cache-and-context-prefixes",
        "status": "live"
      },
      {
        "title": "Measuring Cache Savings",
        "slug": "measuring-cache-savings",
        "status": "live"
      },
      {
        "title": "Normalizing Sources Before Merge",
        "slug": "normalizing-tool-schemas-for-merge",
        "status": "live"
      },
      {
        "title": "Cache and Merge Mistakes",
        "slug": "cache-invalidation-mistakes",
        "status": "live"
      },
      {
        "title": "Tools and Caching Cheatsheet",
        "slug": "tools-and-caching-cheatsheet",
        "status": "live"
      },
      {
        "title": "Tools and Caching Quiz",
        "slug": "tools-caching-quiz",
        "status": "live"
      },
      {
        "title": "Context Observability: Instrumenting What's Actually in the Window",
        "slug": "context-observability-and-token-accounting",
        "status": "live"
      },
      {
        "title": "Structured Memory Stores: Vector, Key-Value, or Knowledge Graph",
        "slug": "structured-memory-stores",
        "status": "live"
      },
      {
        "title": "Scratchpad Patterns: Giving an Agent Somewhere to Think",
        "slug": "scratchpad-and-working-memory-patterns",
        "status": "live"
      },
      {
        "title": "Progressive Tool Disclosure: Hiding Tools Until They're Needed",
        "slug": "progressive-tool-disclosure",
        "status": "live"
      },
      {
        "title": "Just-in-Time Context: Letting the Agent Fetch Instead of Preload",
        "slug": "just-in-time-context-loading",
        "status": "live"
      },
      {
        "title": "Context Handoff Between Agents: Passing the Slice, Not the Stack",
        "slug": "context-handoff-between-agents",
        "status": "live"
      },
      {
        "title": "The Multi-Agent Context Problem",
        "slug": "multi-agent-context-problem",
        "status": "live"
      },
      {
        "title": "Context Handoff Between Agents",
        "slug": "context-handoff-between-agents-deep",
        "status": "live"
      },
      {
        "title": "Designing a Handoff Payload",
        "slug": "handoff-payload-design",
        "status": "live"
      },
      {
        "title": "Subagent Context Isolation",
        "slug": "subagent-context-isolation",
        "status": "live"
      },
      {
        "title": "Orchestrator-Worker Context Flow",
        "slug": "orchestrator-worker-context-flow",
        "status": "live"
      },
      {
        "title": "What a Subagent Should Return",
        "slug": "what-a-subagent-should-return",
        "status": "live"
      },
      {
        "title": "Shared vs Private Context Stores",
        "slug": "shared-vs-private-context-stores",
        "status": "live"
      },
      {
        "title": "Compressing Context for Handoff",
        "slug": "compressing-context-for-handoff",
        "status": "live"
      },
      {
        "title": "Reviewing a Full Context Architecture",
        "slug": "end-to-end-context-architecture-review",
        "status": "live"
      },
      {
        "title": "Multi-Agent Context Mistakes",
        "slug": "multi-agent-context-mistakes",
        "status": "live"
      },
      {
        "title": "Context Engineering Master Cheatsheet",
        "slug": "context-engineering-master-cheatsheet",
        "status": "live"
      },
      {
        "title": "Multi-Agent and Capstone Quiz",
        "slug": "multi-agent-and-capstone-quiz",
        "status": "live"
      },
      {
        "title": "Context Poisoning: How One Bad Result Contaminates Everything After It",
        "slug": "context-poisoning-and-distraction",
        "status": "live"
      },
      {
        "title": "Capstone: Build a Budgeted, Context-Managed Agent",
        "slug": "build-a-budgeted-context-managed-agent",
        "status": "live"
      }
    ]
  },
  {
    "id": "structured-outputs",
    "n": "11",
    "name": "Structured Outputs",
    "group": "Working with Models",
    "meta": "122 lessons",
    "summary": "Getting models to return machine-parseable, schema-valid data instead of free text.",
    "nodes": [
      {
        "title": "The Whole Game of Structured Output",
        "slug": "the-whole-game-of-structured-output",
        "status": "live"
      },
      {
        "title": "Why Structured Output: Free Text vs Machine-Parseable Data",
        "slug": "why-structured-output",
        "status": "live"
      },
      {
        "title": "Three Layers of Reliability",
        "slug": "what-reliable-structure-really-means",
        "status": "live"
      },
      {
        "title": "Why Parsing Prose Always Breaks",
        "slug": "strings-are-not-data-intuition",
        "status": "live"
      },
      {
        "title": "The Schema as a Contract",
        "slug": "the-contract-between-model-and-code",
        "status": "live"
      },
      {
        "title": "From Prose to Parsed, Step by Step",
        "slug": "from-prose-to-parsed-worked-example",
        "status": "live"
      },
      {
        "title": "Four Roads to Structured Output",
        "slug": "three-ways-to-get-json-overview",
        "status": "live"
      },
      {
        "title": "Where Structured Output Shows Up in a System",
        "slug": "where-structured-output-fits-in-a-system",
        "status": "live"
      },
      {
        "title": "The Beginner Traps",
        "slug": "structured-output-early-mistakes",
        "status": "live"
      },
      {
        "title": "What One Bad Field Costs Downstream",
        "slug": "cost-of-getting-it-wrong-intuition",
        "status": "live"
      },
      {
        "title": "Thinking in a Reliability Budget",
        "slug": "reliability-budget-thinking",
        "status": "live"
      },
      {
        "title": "One Task, Four Mechanisms",
        "slug": "same-task-four-ways-mini-tour",
        "status": "live"
      },
      {
        "title": "Why Models Emit Broken JSON",
        "slug": "why-models-emit-invalid-json",
        "status": "live"
      },
      {
        "title": "Foundations Checkpoint",
        "slug": "foundations-quiz",
        "status": "live"
      },
      {
        "title": "JSON Mode: Forcing Valid JSON Out of the Model",
        "slug": "json-mode-basics",
        "status": "live"
      },
      {
        "title": "JSON Schema: Specifying Your Exact Data Contract",
        "slug": "json-schema-for-outputs",
        "status": "live"
      },
      {
        "title": "The JSON Schema Subset That Matters",
        "slug": "json-schema-essentials-for-outputs",
        "status": "live"
      },
      {
        "title": "Pydantic Models for Extraction",
        "slug": "pydantic-models-for-extraction",
        "status": "live"
      },
      {
        "title": "Zod Schemas for Extraction",
        "slug": "zod-schemas-for-extraction",
        "status": "live"
      },
      {
        "title": "Pydantic and Zod Side by Side",
        "slug": "pydantic-and-zod-side-by-side",
        "status": "live"
      },
      {
        "title": "Modeling Nested Objects and Arrays",
        "slug": "designing-nested-and-array-fields",
        "status": "live"
      },
      {
        "title": "Modeling an Invoice with Line Items",
        "slug": "invoice-line-items-nested-example",
        "status": "live"
      },
      {
        "title": "Optional, Nullable, Default, Missing",
        "slug": "optional-nullable-and-defaults",
        "status": "live"
      },
      {
        "title": "The Optional-vs-Nullable Bugs",
        "slug": "optional-vs-nullable-mistakes",
        "status": "live"
      },
      {
        "title": "Enums, Literals, and Bounded Fields",
        "slug": "enums-and-constrained-value-fields",
        "status": "live"
      },
      {
        "title": "A Status Enum with a Safe Fallback",
        "slug": "status-enum-worked-example",
        "status": "live"
      },
      {
        "title": "Discriminated Unions for Heterogeneous Items",
        "slug": "discriminated-unions-for-variants",
        "status": "live"
      },
      {
        "title": "An Event Stream as a Discriminated Union",
        "slug": "event-log-discriminated-union-example",
        "status": "live"
      },
      {
        "title": "Field Descriptions Are Inline Prompts",
        "slug": "field-descriptions-as-prompts",
        "status": "live"
      },
      {
        "title": "Schema-Shape Antipatterns",
        "slug": "schema-shape-antipatterns",
        "status": "live"
      },
      {
        "title": "Field Design Decision Table",
        "slug": "field-design-cheatsheet",
        "status": "live"
      },
      {
        "title": "Schema Languages Checkpoint",
        "slug": "schema-design-quiz",
        "status": "live"
      },
      {
        "title": "Enums: Locking a Field to a Fixed Set of Values",
        "slug": "enums-and-constrained-fields",
        "status": "live"
      },
      {
        "title": "Nested Objects and Arrays in Output Schemas",
        "slug": "nested-and-array-schemas",
        "status": "live"
      },
      {
        "title": "Tool Schemas as a Structured-Extraction Mechanism",
        "slug": "tool-function-schemas",
        "status": "live"
      },
      {
        "title": "Pydantic and Zod: Deriving Schemas from Code",
        "slug": "pydantic-zod-schema-patterns",
        "status": "live"
      },
      {
        "title": "Schema Design Choices That Reduce Model Errors",
        "slug": "schema-design-for-reliability",
        "status": "live"
      },
      {
        "title": "Four Properties of a Reliable Schema",
        "slug": "what-makes-a-schema-reliable",
        "status": "live"
      },
      {
        "title": "Make the Right Answer the Easy Path",
        "slug": "shape-the-easy-path-intuition",
        "status": "live"
      },
      {
        "title": "Refactoring a Fragile Schema",
        "slug": "refactoring-a-fragile-schema-example",
        "status": "live"
      },
      {
        "title": "When to Flatten and When to Nest",
        "slug": "flat-vs-nested-tradeoffs",
        "status": "live"
      },
      {
        "title": "Field Names and Order Change Behavior",
        "slug": "naming-and-ordering-fields",
        "status": "live"
      },
      {
        "title": "Evidence Before Label",
        "slug": "reasoning-field-ordering-example",
        "status": "live"
      },
      {
        "title": "Letting the Model Say 'I Don't Know'",
        "slug": "representing-uncertainty-in-schemas",
        "status": "live"
      },
      {
        "title": "A Not-Found Sentinel That Stops Hallucination",
        "slug": "not-found-sentinel-example",
        "status": "live"
      },
      {
        "title": "Versioning a Schema Without Breaking Consumers",
        "slug": "schema-versioning-basics",
        "status": "live"
      },
      {
        "title": "Migrating v1 to v2 in Code",
        "slug": "migrating-a-schema-version",
        "status": "live"
      },
      {
        "title": "Complexity vs Accuracy, and When to Split",
        "slug": "schema-complexity-vs-model-accuracy",
        "status": "live"
      },
      {
        "title": "Reliability-Design Mistakes",
        "slug": "reliability-design-mistakes",
        "status": "live"
      },
      {
        "title": "Pre-Ship Schema Checklist",
        "slug": "reliable-schema-checklist",
        "status": "live"
      },
      {
        "title": "Reliable Schemas Checkpoint",
        "slug": "reliability-design-quiz",
        "status": "live"
      },
      {
        "title": "Constrained Decoding: How Guaranteed-Valid Output Actually Works",
        "slug": "constrained-decoding-under-the-hood",
        "status": "live"
      },
      {
        "title": "What JSON Mode Does and Doesn't Promise",
        "slug": "json-mode-what-it-guarantees",
        "status": "live"
      },
      {
        "title": "How Constrained Decoding Masks Tokens",
        "slug": "constrained-decoding-mechanics-deep-dive",
        "status": "live"
      },
      {
        "title": "Asking Nicely vs a Physical Rail",
        "slug": "guardrails-vs-guidance-intuition",
        "status": "live"
      },
      {
        "title": "Compiling a Schema into a Constraint",
        "slug": "schema-constrained-decoding-explained",
        "status": "live"
      },
      {
        "title": "Grammars Beyond JSON",
        "slug": "grammar-constrained-beyond-json",
        "status": "live"
      },
      {
        "title": "Writing a GBNF Grammar by Hand",
        "slug": "gbnf-grammar-worked-example",
        "status": "live"
      },
      {
        "title": "Turning On Structured Modes in Code",
        "slug": "enabling-structured-modes-across-sdks",
        "status": "live"
      },
      {
        "title": "The Cost of Constraints",
        "slug": "what-constraints-cost-you",
        "status": "live"
      },
      {
        "title": "When Tight Constraints Hurt Reasoning",
        "slug": "constraints-and-model-quality-interaction",
        "status": "live"
      },
      {
        "title": "Separating Reasoning from Structuring",
        "slug": "thinking-then-structuring-pattern",
        "status": "live"
      },
      {
        "title": "Reason Freely, Then Emit Strictly",
        "slug": "reason-then-emit-worked-example",
        "status": "live"
      },
      {
        "title": "Picking the Wrong Mechanism",
        "slug": "mechanism-selection-mistakes",
        "status": "live"
      },
      {
        "title": "Decoding Mechanisms Cheatsheet",
        "slug": "decoding-mechanisms-cheatsheet",
        "status": "live"
      },
      {
        "title": "Mechanisms Checkpoint",
        "slug": "mechanisms-quiz",
        "status": "live"
      },
      {
        "title": "Validation and Auto-Repair: Catching and Fixing Bad Output",
        "slug": "validation-and-auto-repair",
        "status": "live"
      },
      {
        "title": "Always Validate at the Boundary",
        "slug": "the-validation-layer",
        "status": "live"
      },
      {
        "title": "Validate, Then Branch",
        "slug": "validate-then-branch-pipeline",
        "status": "live"
      },
      {
        "title": "A Taxonomy of Structured-Output Failures",
        "slug": "failure-modes-taxonomy",
        "status": "live"
      },
      {
        "title": "Diagnosing Five Real Broken Outputs",
        "slug": "diagnosing-five-real-failures",
        "status": "live"
      },
      {
        "title": "The Repair Ladder",
        "slug": "auto-repair-strategies",
        "status": "live"
      },
      {
        "title": "A Bounded Repair Loop",
        "slug": "repair-loop-implementation",
        "status": "live"
      },
      {
        "title": "Repairing Partial and Streamed JSON",
        "slug": "incremental-json-repair-explained",
        "status": "live"
      },
      {
        "title": "Building a Tolerant Incremental Parser",
        "slug": "incremental-parser-walkthrough",
        "status": "live"
      },
      {
        "title": "Consuming Structured Output as It Streams",
        "slug": "streaming-structured-output-model",
        "status": "live"
      },
      {
        "title": "Rendering Results as They Stream",
        "slug": "streaming-progress-ui-example",
        "status": "live"
      },
      {
        "title": "The Partial-Parse State Machine",
        "slug": "partial-parse-state-machine-deep-dive",
        "status": "live"
      },
      {
        "title": "Repair-Loop Mistakes",
        "slug": "repair-loop-mistakes",
        "status": "live"
      },
      {
        "title": "When to Reject Instead of Repair",
        "slug": "when-not-to-repair",
        "status": "live"
      },
      {
        "title": "Failure-to-Repair Cheatsheet",
        "slug": "failure-and-repair-cheatsheet",
        "status": "live"
      },
      {
        "title": "Runtime Checkpoint",
        "slug": "runtime-quiz",
        "status": "live"
      },
      {
        "title": "Streaming Structured Output: Parsing Before the Response Finishes",
        "slug": "streaming-structured-output",
        "status": "live"
      },
      {
        "title": "Structured Output Failure Modes and How to Spot Them",
        "slug": "structured-output-failure-modes",
        "status": "live"
      },
      {
        "title": "Optional and Nullable Fields: Modeling 'The Model Doesn't Know'",
        "slug": "optional-and-nullable-fields",
        "status": "live"
      },
      {
        "title": "Discriminated Unions: One Field Deciding the Shape of the Rest",
        "slug": "discriminated-unions-in-schemas",
        "status": "live"
      },
      {
        "title": "Thinking Then Structuring: Reasoning in Prose Before Emitting the Schema",
        "slug": "thinking-then-structuring",
        "status": "live"
      },
      {
        "title": "Cross-Provider Structured Output: Why 'JSON Mode' Isn't One Thing",
        "slug": "cross-provider-structured-output-differences",
        "status": "live"
      },
      {
        "title": "Incremental JSON Repair: Fixing Truncated Output Instead of Discarding It",
        "slug": "incremental-json-repair",
        "status": "live"
      },
      {
        "title": "Schema Versioning: Evolving a Contract Without Breaking Consumers",
        "slug": "schema-versioning-and-migration",
        "status": "live"
      },
      {
        "title": "Evaluating Structured Output: Validity, Accuracy, and Completeness Are Different Axes",
        "slug": "evaluating-structured-output-quality",
        "status": "live"
      },
      {
        "title": "The Cross-Provider Landscape",
        "slug": "cross-provider-landscape",
        "status": "live"
      },
      {
        "title": "One Schema, Three Providers",
        "slug": "same-schema-three-providers-example",
        "status": "live"
      },
      {
        "title": "Keeping Schema Code Provider-Agnostic",
        "slug": "writing-portable-schema-code",
        "status": "live"
      },
      {
        "title": "A Provider Adapter",
        "slug": "provider-adapter-implementation",
        "status": "live"
      },
      {
        "title": "Metrics for Structured-Output Quality",
        "slug": "evaluating-structured-output-quality-metrics",
        "status": "live"
      },
      {
        "title": "Building an Eval Harness",
        "slug": "building-an-extraction-eval-harness",
        "status": "live"
      },
      {
        "title": "Curating a Gold Dataset",
        "slug": "building-a-gold-dataset",
        "status": "live"
      },
      {
        "title": "A Field-Level Scorecard",
        "slug": "field-level-scorecard-example",
        "status": "live"
      },
      {
        "title": "Regression-Testing Structured Output in CI",
        "slug": "regression-testing-schemas-and-prompts",
        "status": "live"
      },
      {
        "title": "Monitoring in Production",
        "slug": "monitoring-structured-output-in-production",
        "status": "live"
      },
      {
        "title": "Evaluation and Portability Mistakes",
        "slug": "eval-and-provider-mistakes",
        "status": "live"
      },
      {
        "title": "Portability and Eval Cheatsheet",
        "slug": "cross-provider-and-eval-cheatsheet",
        "status": "live"
      },
      {
        "title": "Portability and Evaluation Checkpoint",
        "slug": "capstone-and-eval-quiz",
        "status": "live"
      },
      {
        "title": "Grammar-Constrained Generation Beyond JSON",
        "slug": "grammar-constrained-generation",
        "status": "live"
      },
      {
        "title": "Structured Extraction from PDFs, Forms, and Screenshots",
        "slug": "structured-extraction-from-documents-and-images",
        "status": "live"
      },
      {
        "title": "Extraction Is Schema-Filling",
        "slug": "extraction-as-a-structured-output-problem",
        "status": "live"
      },
      {
        "title": "A Receipt Image to a Typed Object",
        "slug": "receipt-image-to-schema-example",
        "status": "live"
      },
      {
        "title": "Strategies for Long Documents",
        "slug": "long-document-extraction-strategies",
        "status": "live"
      },
      {
        "title": "Chunk, Extract, Merge",
        "slug": "chunk-and-merge-extraction",
        "status": "live"
      },
      {
        "title": "Extracting Clauses from a 40-Page Contract",
        "slug": "contract-clause-extraction-example",
        "status": "live"
      },
      {
        "title": "Tool Calling as an Extraction Mechanism",
        "slug": "tool-and-function-schemas-for-extraction",
        "status": "live"
      },
      {
        "title": "Forcing a Tool Call to Extract",
        "slug": "function-calling-extraction-implementation",
        "status": "live"
      },
      {
        "title": "Extracting Tables Reliably",
        "slug": "multi-field-tables-from-documents",
        "status": "live"
      },
      {
        "title": "Transactions from a Bank Statement",
        "slug": "bank-statement-transactions-example",
        "status": "live"
      },
      {
        "title": "Grounding Extractions in the Source",
        "slug": "grounding-and-citations-in-extraction",
        "status": "live"
      },
      {
        "title": "Extraction Mistakes",
        "slug": "extraction-mistakes",
        "status": "live"
      },
      {
        "title": "Confidence and Review Routing",
        "slug": "extraction-confidence-and-review-routing",
        "status": "live"
      },
      {
        "title": "Extraction Pipeline Cheatsheet",
        "slug": "extraction-pipeline-cheatsheet",
        "status": "live"
      },
      {
        "title": "Extraction Checkpoint",
        "slug": "extraction-quiz",
        "status": "live"
      },
      {
        "title": "Long-Document Structured Extraction: One Schema Instance from Many Passes",
        "slug": "long-document-structured-extraction",
        "status": "live"
      },
      {
        "title": "Capstone: A Production Extraction Service",
        "slug": "build-a-production-extraction-service",
        "status": "live"
      }
    ]
  },
  {
    "id": "hallucinations",
    "n": "12",
    "name": "Hallucinations & Reliability",
    "group": "Working with Models",
    "meta": "132 lessons",
    "summary": "Understanding why models fabricate, and the concrete techniques to ground, verify, and contain it.",
    "nodes": [
      {
        "title": "The Whole Game: From Fabrication to Trustworthy Systems",
        "slug": "reliability-whole-game",
        "status": "live"
      },
      {
        "title": "What a Hallucination Actually Is",
        "slug": "what-is-a-hallucination",
        "status": "live"
      },
      {
        "title": "Why Models Hallucinate: The Mechanics Behind Confident Wrong Answers",
        "slug": "why-models-hallucinate",
        "status": "live"
      },
      {
        "title": "Intuition: A Fluent Guess With No 'I'm Unsure' Signal",
        "slug": "hallucination-as-confident-guessing",
        "status": "live"
      },
      {
        "title": "How Next-Token Prediction Produces Fabrication",
        "slug": "next-token-mechanics-of-fabrication",
        "status": "live"
      },
      {
        "title": "Deep Dive: Why the Training Objective Rewards Guessing Over Abstention",
        "slug": "training-objective-rewards-guessing",
        "status": "live"
      },
      {
        "title": "Hallucination, Error, Bug, and Bias: Drawing the Lines",
        "slug": "hallucination-vs-error-vs-bug",
        "status": "live"
      },
      {
        "title": "Worked Example: Dissecting One Real Hallucination",
        "slug": "anatomy-of-a-hallucination",
        "status": "live"
      },
      {
        "title": "Parametric vs. Contextual Knowledge",
        "slug": "parametric-vs-contextual-knowledge",
        "status": "live"
      },
      {
        "title": "Intuition: The Model Cannot Feel the Boundary of Its Knowledge",
        "slug": "no-ground-truth-signal",
        "status": "live"
      },
      {
        "title": "Variants: Hallucination in Text, Code, Vision, and Structured Output",
        "slug": "hallucination-across-modalities",
        "status": "live"
      },
      {
        "title": "Common Myths: 'Bigger Models Don't Hallucinate' and Other Errors",
        "slug": "myths-about-hallucination",
        "status": "live"
      },
      {
        "title": "When 'Making Things Up' Is Actually the Goal",
        "slug": "when-hallucination-is-desirable",
        "status": "live"
      },
      {
        "title": "Deep Dive: Is Hallucination Fixable in Principle?",
        "slug": "is-hallucination-fixable",
        "status": "live"
      },
      {
        "title": "Worked Example: Scoring a Prompt for Hallucination Risk",
        "slug": "risk-factor-walkthrough",
        "status": "live"
      },
      {
        "title": "Cheatsheet: Foundations Vocabulary and Root Causes",
        "slug": "foundations-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Foundations of Hallucination",
        "slug": "foundations-quiz",
        "status": "live"
      },
      {
        "title": "Hallucination Risk Factors: Which Tasks Are Most Dangerous",
        "slug": "hallucination-risk-factors",
        "status": "live"
      },
      {
        "title": "Leading Questions and False Premises That Induce Hallucination",
        "slug": "adversarial-and-leading-prompts",
        "status": "live"
      },
      {
        "title": "Grounding: Constraining Answers to Supplied Sources",
        "slug": "grounding-with-source-documents",
        "status": "live"
      },
      {
        "title": "RAG as Hallucination Mitigation",
        "slug": "retrieval-augmented-mitigation",
        "status": "live"
      },
      {
        "title": "The Mitigation Landscape: Ground, Constrain, Prompt, Abstain",
        "slug": "mitigation-strategy-landscape",
        "status": "live"
      },
      {
        "title": "Grounding: Anchoring Answers to Evidence",
        "slug": "grounding-fundamentals",
        "status": "live"
      },
      {
        "title": "Implementation: A RAG Grounding Pipeline",
        "slug": "rag-grounding-pipeline-impl",
        "status": "live"
      },
      {
        "title": "Deep Dive: Why RAG Still Hallucinates",
        "slug": "why-rag-still-hallucinates",
        "status": "live"
      },
      {
        "title": "Implementation: Corrective and Self-RAG",
        "slug": "corrective-rag-pattern-impl",
        "status": "live"
      },
      {
        "title": "Implementation: Forcing Every Claim to Cite Its Source",
        "slug": "enforcing-citations-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: Verifying That Citations Actually Support Claims",
        "slug": "citation-verification-loop",
        "status": "live"
      },
      {
        "title": "Constrained Generation: Shrinking the Space to Fabricate In",
        "slug": "constrained-generation-concept",
        "status": "live"
      },
      {
        "title": "Implementation: Schema-Constrained and Grammar-Constrained Output",
        "slug": "structured-output-decoding-impl",
        "status": "live"
      },
      {
        "title": "Prompting Patterns That Lower Hallucination",
        "slug": "prompting-patterns-to-reduce-fabrication",
        "status": "live"
      },
      {
        "title": "Worked Example: Grounding Recipes in the System Prompt",
        "slug": "system-prompt-grounding-recipes",
        "status": "live"
      },
      {
        "title": "Context Engineering: Giving the Model the Right Evidence",
        "slug": "context-engineering-for-grounding",
        "status": "live"
      },
      {
        "title": "Deep Dive: The Coverage-Faithfulness-Abstention Triangle",
        "slug": "mitigation-tradeoffs-deep-dive",
        "status": "live"
      },
      {
        "title": "Common Mistakes: Mitigations That Backfire",
        "slug": "mitigation-antipatterns",
        "status": "live"
      },
      {
        "title": "Variants: Choosing Mitigations by Task",
        "slug": "mitigation-by-task-type",
        "status": "live"
      },
      {
        "title": "Cheatsheet: The Mitigation Stack",
        "slug": "mitigation-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Reducing Hallucination",
        "slug": "mitigation-quiz",
        "status": "live"
      },
      {
        "title": "Citations: Making Every Claim Traceable to a Source",
        "slug": "citations-and-attribution",
        "status": "live"
      },
      {
        "title": "Teaching a Model to Say 'I Don't Know'",
        "slug": "teaching-models-to-say-i-dont-know",
        "status": "live"
      },
      {
        "title": "Self-Verification: Having the Model Check Its Own Work",
        "slug": "self-verification-techniques",
        "status": "live"
      },
      {
        "title": "The Detection Landscape: What We Can and Can't Observe",
        "slug": "detection-landscape-overview",
        "status": "live"
      },
      {
        "title": "Black-Box vs. White-Box Detection",
        "slug": "black-box-vs-white-box-detection",
        "status": "live"
      },
      {
        "title": "Intuition: If It Keeps Changing Its Story, Distrust It",
        "slug": "consistency-implies-reliability",
        "status": "live"
      },
      {
        "title": "Implementation: A Self-Consistency Hallucination Detector",
        "slug": "self-consistency-detector-impl",
        "status": "live"
      },
      {
        "title": "Implementation: Self-Verification and Chain-of-Verification",
        "slug": "self-verification-chain-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: When Self-Verification Rubber-Stamps a Lie",
        "slug": "self-verification-when-it-fails",
        "status": "live"
      },
      {
        "title": "Implementation: Cross-Checking Across Multiple Models",
        "slug": "ensemble-cross-check-impl",
        "status": "live"
      },
      {
        "title": "LLM-as-Judge for Faithfulness and Factuality",
        "slug": "llm-as-judge-for-faithfulness",
        "status": "live"
      },
      {
        "title": "Implementation: NLI Entailment as a Grounding Check",
        "slug": "nli-entailment-grounding-check-impl",
        "status": "live"
      },
      {
        "title": "Implementation: ChainPoll-Style Ensemble Judging",
        "slug": "chainpoll-detector-impl",
        "status": "live"
      },
      {
        "title": "Retrieval-Based Fact Checking as Detection",
        "slug": "retrieval-based-factuality-check",
        "status": "live"
      },
      {
        "title": "Common Mistakes: When Detectors Give False Comfort",
        "slug": "detection-false-comfort",
        "status": "live"
      },
      {
        "title": "Comparison: Choosing a Detection Method",
        "slug": "detection-methods-compared",
        "status": "live"
      },
      {
        "title": "Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source",
        "slug": "detecting-vs-preventing",
        "status": "live"
      },
      {
        "title": "Cheatsheet: Detection Methods and When to Use Them",
        "slug": "detection-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Detecting Hallucination",
        "slug": "detection-quiz",
        "status": "live"
      },
      {
        "title": "Confidence Signals: What Model Certainty Actually Reflects",
        "slug": "confidence-and-uncertainty-signals",
        "status": "live"
      },
      {
        "title": "Confidence, Uncertainty, and Calibration: Three Different Things",
        "slug": "confidence-uncertainty-calibration-defs",
        "status": "live"
      },
      {
        "title": "Intuition: Fluency Is Not Confidence",
        "slug": "why-fluent-text-feels-confident",
        "status": "live"
      },
      {
        "title": "Implementation: Deriving Confidence from Token Logprobs",
        "slug": "token-logprob-confidence-impl",
        "status": "live"
      },
      {
        "title": "Deep Dive: Semantic Entropy, Uncertainty Over Meanings",
        "slug": "semantic-entropy-uncertainty-deep-dive",
        "status": "live"
      },
      {
        "title": "Implementation: Semantic Entropy with Meaning Clustering",
        "slug": "semantic-entropy-clustering-impl",
        "status": "live"
      },
      {
        "title": "Verbalized vs. Elicited Confidence",
        "slug": "verbalized-vs-elicited-confidence",
        "status": "live"
      },
      {
        "title": "Deep Dive: Calibration Error and Reliability Diagrams",
        "slug": "calibration-error-reliability-diagrams",
        "status": "live"
      },
      {
        "title": "Implementation: Measuring and Plotting Calibration",
        "slug": "measuring-plotting-calibration-impl",
        "status": "live"
      },
      {
        "title": "Why Instruction-Tuning and RLHF Degrade Calibration",
        "slug": "why-rlhf-hurts-calibration",
        "status": "live"
      },
      {
        "title": "Abstention as a First-Class Behavior",
        "slug": "abstention-as-a-skill",
        "status": "live"
      },
      {
        "title": "Implementation: Eliciting Abstention Without Retraining",
        "slug": "teaching-abstention-via-prompting-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: Routing by Uncertainty Score",
        "slug": "uncertainty-in-practice-triage",
        "status": "live"
      },
      {
        "title": "Common Mistakes: Confidence Antipatterns",
        "slug": "confidence-antipatterns",
        "status": "live"
      },
      {
        "title": "Cheatsheet: Confidence Signals and Calibration",
        "slug": "uncertainty-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Uncertainty and Calibration",
        "slug": "uncertainty-quiz",
        "status": "live"
      },
      {
        "title": "Fact-Checking Pipelines Before Output Ships",
        "slug": "fact-checking-pipelines",
        "status": "live"
      },
      {
        "title": "Guardrails for High-Stakes Output",
        "slug": "guardrails-for-high-stakes-output",
        "status": "live"
      },
      {
        "title": "Reliability Architecture: Wiring the Pieces Together",
        "slug": "reliability-architecture-overview",
        "status": "live"
      },
      {
        "title": "A Taxonomy of Guardrails",
        "slug": "guardrails-taxonomy",
        "status": "live"
      },
      {
        "title": "Implementation: Input and Output Guardrails",
        "slug": "input-output-guardrail-impl",
        "status": "live"
      },
      {
        "title": "Implementation: An Automated Fact-Checking Pipeline",
        "slug": "fact-checking-pipeline-impl",
        "status": "live"
      },
      {
        "title": "Escalation and Human-in-the-Loop Design",
        "slug": "escalation-human-in-the-loop",
        "status": "live"
      },
      {
        "title": "Implementation: Confidence-Gated Escalation",
        "slug": "confidence-gated-escalation-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: A High-Stakes Medical/Legal Deployment",
        "slug": "high-stakes-case-study",
        "status": "live"
      },
      {
        "title": "The UX of Uncertainty: Showing Sources and Hedges",
        "slug": "ux-of-uncertainty",
        "status": "live"
      },
      {
        "title": "Deep Dive: Latency, Cost, and Reliability Tradeoffs",
        "slug": "latency-cost-reliability-tradeoffs",
        "status": "live"
      },
      {
        "title": "Implementation: Monitoring Hallucination in Production",
        "slug": "monitoring-hallucination-in-prod",
        "status": "live"
      },
      {
        "title": "Incident Response When a Hallucination Ships",
        "slug": "incident-response-for-hallucination",
        "status": "live"
      },
      {
        "title": "Common Mistakes: Production Reliability Antipatterns",
        "slug": "production-antipatterns",
        "status": "live"
      },
      {
        "title": "Cheatsheet: Production Reliability Checklist",
        "slug": "production-reliability-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Production Handling",
        "slug": "production-quiz",
        "status": "live"
      },
      {
        "title": "Measuring Hallucination Rate Instead of Spot-Checking",
        "slug": "hallucination-evaluation-and-benchmarks",
        "status": "live"
      },
      {
        "title": "What to Measure: Factuality, Faithfulness, and Abstention Metrics",
        "slug": "what-to-measure-metrics",
        "status": "live"
      },
      {
        "title": "Denominators Matter: Defining Hallucination Rate Precisely",
        "slug": "hallucination-rate-denominators",
        "status": "live"
      },
      {
        "title": "Deep Dive: A Tour of Hallucination Benchmarks",
        "slug": "hallucination-benchmarks-tour",
        "status": "live"
      },
      {
        "title": "Implementation: FActScore-Style Atomic-Fact Evaluation",
        "slug": "factscore-eval-impl",
        "status": "live"
      },
      {
        "title": "Implementation: An LLM-as-Judge Evaluation Harness",
        "slug": "llm-judge-eval-harness-impl",
        "status": "live"
      },
      {
        "title": "Faithfulness Metrics for RAG Systems",
        "slug": "rag-faithfulness-metrics",
        "status": "live"
      },
      {
        "title": "Implementation: Automated RAG Faithfulness Scoring",
        "slug": "ragas-faithfulness-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: Building a Golden Hallucination Eval Set",
        "slug": "building-golden-eval-set",
        "status": "live"
      },
      {
        "title": "Human Evaluation and Annotation Protocols",
        "slug": "human-annotation-protocols",
        "status": "live"
      },
      {
        "title": "Deep Dive: Evaluating the Detector Itself",
        "slug": "evaluating-your-detector",
        "status": "live"
      },
      {
        "title": "Common Mistakes: Evaluation Pitfalls and Benchmark Gaming",
        "slug": "evaluation-pitfalls",
        "status": "live"
      },
      {
        "title": "Worked Example: Hallucination Regression Testing in CI",
        "slug": "tracking-hallucination-in-ci",
        "status": "live"
      },
      {
        "title": "Cheatsheet: Measuring Hallucination",
        "slug": "evaluation-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Measuring Hallucination Rate",
        "slug": "evaluation-quiz",
        "status": "live"
      },
      {
        "title": "Sycophancy vs. Hallucination: Agreeing Wrong Is a Different Failure",
        "slug": "sycophancy-vs-hallucination",
        "status": "live"
      },
      {
        "title": "Citation Hallucination: Fabricated Sources That Look Completely Real",
        "slug": "citation-hallucination",
        "status": "live"
      },
      {
        "title": "The Master Axis: Factual vs. Faithfulness Hallucination",
        "slug": "factual-vs-faithfulness-distinction",
        "status": "live"
      },
      {
        "title": "Intrinsic vs. Extrinsic Hallucination",
        "slug": "intrinsic-vs-extrinsic-hallucination",
        "status": "live"
      },
      {
        "title": "Worked Example: One Wrong Answer, Different Diagnoses",
        "slug": "same-output-two-failure-modes",
        "status": "live"
      },
      {
        "title": "Deep Dive: Why Fabricated Citations Look So Real",
        "slug": "fabricated-citations-deep-dive",
        "status": "live"
      },
      {
        "title": "Worked Example: Hallucinated APIs and Slopsquatting",
        "slug": "code-hallucination-walkthrough",
        "status": "live"
      },
      {
        "title": "Implementation: A Guard Against Hallucinated Packages",
        "slug": "detecting-package-slop-impl",
        "status": "live"
      },
      {
        "title": "Worked Example: Fabricated Tool Names and Arguments",
        "slug": "tool-call-argument-fabrication",
        "status": "live"
      },
      {
        "title": "Worked Example: Knowledge-Cutoff and Temporal Fabrication",
        "slug": "temporal-hallucination-cases",
        "status": "live"
      },
      {
        "title": "Worked Example: When a Summary Betrays Its Source",
        "slug": "summarization-unfaithfulness",
        "status": "live"
      },
      {
        "title": "Deep Dive: How Errors Compound Across Reasoning Hops",
        "slug": "multi-hop-compounding-deep-dive",
        "status": "live"
      },
      {
        "title": "Sycophancy: Fabrication Driven by Agreement",
        "slug": "sycophancy-as-a-mode",
        "status": "live"
      },
      {
        "title": "Worked Example: False Premises and Leading Questions",
        "slug": "leading-prompt-fabrication",
        "status": "live"
      },
      {
        "title": "Variants: Hallucination Signatures in Medicine, Law, and Finance",
        "slug": "domain-specific-hallucination-variants",
        "status": "live"
      },
      {
        "title": "Common Mistakes: Mislabeling the Type Leads to the Wrong Fix",
        "slug": "misclassifying-hallucination-types",
        "status": "live"
      },
      {
        "title": "Cheatsheet: A Decision Tree for Classifying Any Hallucination",
        "slug": "taxonomy-decision-tree",
        "status": "live"
      },
      {
        "title": "Quiz: Classifying Hallucination Types",
        "slug": "taxonomy-quiz",
        "status": "live"
      },
      {
        "title": "Code Hallucination and Package Slop: Invented APIs, Real Supply-Chain Risk",
        "slug": "code-hallucination-and-package-slop",
        "status": "live"
      },
      {
        "title": "Knowledge Cutoff and Temporal Hallucination",
        "slug": "knowledge-cutoff-and-temporal-hallucination",
        "status": "live"
      },
      {
        "title": "Summarization Hallucination: Facts the Source Never Said",
        "slug": "summarization-hallucination",
        "status": "live"
      },
      {
        "title": "Tool-Call Hallucination: Inventing Calls, Arguments, or Results",
        "slug": "tool-call-hallucination",
        "status": "live"
      },
      {
        "title": "Multi-Hop Compounding: How One Wrong Step Snowballs",
        "slug": "multi-hop-compounding-hallucination",
        "status": "live"
      },
      {
        "title": "Escalation Design: Handing Off to a Human When Confidence Drops",
        "slug": "escalation-design-for-uncertain-answers",
        "status": "live"
      },
      {
        "title": "Semantic Entropy: Measuring Uncertainty by Resampling",
        "slug": "semantic-entropy-and-uncertainty-quantification",
        "status": "live"
      },
      {
        "title": "Calibration: What Prompting Can't Fix and Training Has To",
        "slug": "calibration-training-vs-prompting",
        "status": "live"
      },
      {
        "title": "Ensemble Cross-Checking: Catching Hallucinations Through Disagreement",
        "slug": "ensemble-cross-checking",
        "status": "live"
      },
      {
        "title": "Capstone: Build a Reliability-Hardened QA System",
        "slug": "capstone-trustworthy-qa-system",
        "status": "live"
      }
    ]
  },
  {
    "id": "genai-app-dev",
    "n": "13",
    "name": "GenAI App Dev",
    "group": "Building",
    "meta": "130 lessons",
    "summary": "Turn a working prompt into a shipped product: streaming UX, cost and latency budgets, and the plumbing that keeps a GenAI feature alive in production.",
    "nodes": [
      {
        "title": "The Whole Game: Build a Support-Reply Drafter End to End",
        "slug": "the-whole-game-genai-feature-tour",
        "status": "live"
      },
      {
        "title": "Anatomy of a GenAI Feature",
        "slug": "anatomy-of-a-genai-feature",
        "status": "live"
      },
      {
        "title": "The Deterministic Shell Around a Probabilistic Core",
        "slug": "what-makes-a-feature-genai",
        "status": "live"
      },
      {
        "title": "Tracing One Request Through Eight Hops",
        "slug": "request-lifecycle-mental-model",
        "status": "live"
      },
      {
        "title": "Your First Call, Worked in TypeScript and Python",
        "slug": "first-api-call-walkthrough-ts-python",
        "status": "live"
      },
      {
        "title": "System, User, Assistant: The Message Envelope",
        "slug": "messages-roles-and-the-prompt-envelope",
        "status": "live"
      },
      {
        "title": "Temperature, top_p, and max_tokens in Practice",
        "slug": "tuning-sampling-params-in-an-app",
        "status": "live"
      },
      {
        "title": "SDK vs Raw API vs Framework: Choosing Your Layer",
        "slug": "sdk-vs-raw-api-decision",
        "status": "live"
      },
      {
        "title": "Scaffolding a GenAI Project From Zero",
        "slug": "scaffolding-a-genai-project",
        "status": "live"
      },
      {
        "title": "What Actually Happens Over the Wire",
        "slug": "what-happens-over-the-wire",
        "status": "live"
      },
      {
        "title": "Where the LLM Boundary Belongs in Your Architecture",
        "slug": "where-the-llm-boundary-lives",
        "status": "live"
      },
      {
        "title": "Turning a Vague Product Ask Into a Buildable Spec",
        "slug": "from-product-ask-to-feature-spec",
        "status": "live"
      },
      {
        "title": "Antipatterns in Your First GenAI Feature",
        "slug": "first-genai-feature-antipatterns",
        "status": "live"
      },
      {
        "title": "GenAI Feature Starter Checklist",
        "slug": "genai-feature-starter-checklist",
        "status": "live"
      },
      {
        "title": "Quiz: The GenAI Request Lifecycle",
        "slug": "quiz-genai-foundations",
        "status": "live"
      },
      {
        "title": "Your First LLM API Call",
        "slug": "your-first-llm-api-call",
        "status": "live"
      },
      {
        "title": "Streaming Responses to the UI",
        "slug": "streaming-responses-to-the-ui",
        "status": "live"
      },
      {
        "title": "Why Streaming Changes Perceived Latency",
        "slug": "why-stream-tokens",
        "status": "live"
      },
      {
        "title": "How Token Streaming Works End to End",
        "slug": "streaming-response-fundamentals",
        "status": "live"
      },
      {
        "title": "SSE vs WebSockets: Choosing a Transport",
        "slug": "sse-vs-websockets-deep",
        "status": "live"
      },
      {
        "title": "A Streaming SSE Endpoint in Next.js",
        "slug": "streaming-sse-nextjs-endpoint",
        "status": "live"
      },
      {
        "title": "Consuming a Token Stream in React",
        "slug": "consuming-a-stream-in-react",
        "status": "live"
      },
      {
        "title": "Streaming From a Python FastAPI Backend",
        "slug": "streaming-in-python-fastapi",
        "status": "live"
      },
      {
        "title": "Chat UX That Doesn't Feel Broken",
        "slug": "chat-ux-that-doesnt-feel-broken",
        "status": "live"
      },
      {
        "title": "Stop, Regenerate, and Rendering Partial Output",
        "slug": "stop-regenerate-and-partial-render",
        "status": "live"
      },
      {
        "title": "Generative UI: Rendering Components From Model Output",
        "slug": "generative-ui-rendering-components",
        "status": "live"
      },
      {
        "title": "Streaming Structured Output Into Live Components",
        "slug": "streaming-structured-generative-ui",
        "status": "live"
      },
      {
        "title": "Accepting Multimodal Input: Images, Audio, Files",
        "slug": "multimodal-input-images-audio-files",
        "status": "live"
      },
      {
        "title": "From File Upload to a Multimodal Call",
        "slug": "uploading-and-sending-images",
        "status": "live"
      },
      {
        "title": "Streaming Failure Modes and How to Survive Them",
        "slug": "streaming-failure-modes",
        "status": "live"
      },
      {
        "title": "Backpressure, Cancellation, and Abort Propagation",
        "slug": "backpressure-and-cancellation",
        "status": "live"
      },
      {
        "title": "Streaming and Chat UX Cheatsheet",
        "slug": "streaming-ux-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Streaming and Real-Time UX",
        "slug": "quiz-streaming-ux",
        "status": "live"
      },
      {
        "title": "Designing Chat UX That Doesn't Feel Broken",
        "slug": "designing-chat-ux",
        "status": "live"
      },
      {
        "title": "Trimming Conversation History for Context Limits",
        "slug": "trimming-conversation-history",
        "status": "live"
      },
      {
        "title": "Prompt Caching for Speed and Cost",
        "slug": "prompt-caching-for-speed-and-cost",
        "status": "live"
      },
      {
        "title": "Setting Latency Budgets for LLM Features",
        "slug": "latency-budgets-for-llm-features",
        "status": "live"
      },
      {
        "title": "Setting a Latency Budget",
        "slug": "latency-budgets",
        "status": "live"
      },
      {
        "title": "Where the Milliseconds Go",
        "slug": "where-latency-comes-from",
        "status": "live"
      },
      {
        "title": "Measuring Latency: p50, p95, and TTFT",
        "slug": "measuring-latency-p50-p95",
        "status": "live"
      },
      {
        "title": "Token Accounting and Per-User Quotas",
        "slug": "token-accounting-and-quotas",
        "status": "live"
      },
      {
        "title": "Prompt Caching for Speed and Cost",
        "slug": "prompt-caching",
        "status": "live"
      },
      {
        "title": "Implementing Prompt Caching",
        "slug": "implementing-prompt-caching",
        "status": "live"
      },
      {
        "title": "Cutting Cost With a Model Cascade",
        "slug": "cutting-cost-with-model-cascade",
        "status": "live"
      },
      {
        "title": "Moving Long Tasks to Background Jobs",
        "slug": "background-jobs-for-long-tasks",
        "status": "live"
      },
      {
        "title": "The Queue, Worker, and Webhook Pattern",
        "slug": "queue-worker-webhook-pattern",
        "status": "live"
      },
      {
        "title": "Client-Side Inference: When It Makes Sense",
        "slug": "client-side-inference-tradeoffs",
        "status": "live"
      },
      {
        "title": "Performance and Cost Antipatterns",
        "slug": "perf-cost-antipatterns",
        "status": "live"
      },
      {
        "title": "Streaming, Caching, and Batching Together",
        "slug": "streaming-caching-batching-together",
        "status": "live"
      },
      {
        "title": "Performance and Cost Cheatsheet",
        "slug": "perf-cost-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Performance and Cost",
        "slug": "quiz-performance-cost",
        "status": "live"
      },
      {
        "title": "Cost Budgets and Usage Tracking",
        "slug": "cost-budgets-and-usage-tracking",
        "status": "live"
      },
      {
        "title": "Rate Limits and Retry Strategies",
        "slug": "rate-limits-and-retry-strategies",
        "status": "live"
      },
      {
        "title": "Building a Provider Abstraction Layer",
        "slug": "provider-abstraction-layers",
        "status": "live"
      },
      {
        "title": "The Provider Landscape and Its Tradeoffs",
        "slug": "provider-landscape-and-tradeoffs",
        "status": "live"
      },
      {
        "title": "Why (and How Far) to Abstract the Provider",
        "slug": "why-abstract-the-provider",
        "status": "live"
      },
      {
        "title": "Designing a Common Provider Interface",
        "slug": "building-a-provider-interface-ts",
        "status": "live"
      },
      {
        "title": "Writing Two Adapters Behind One Interface",
        "slug": "provider-adapter-anthropic-openai",
        "status": "live"
      },
      {
        "title": "Routing: Picking a Model Per Request",
        "slug": "model-routing-strategies",
        "status": "live"
      },
      {
        "title": "Implementing Failover and Fallback Chains",
        "slug": "implementing-failover-and-fallback-chains",
        "status": "live"
      },
      {
        "title": "Cost- and Capability-Aware Routing in Action",
        "slug": "cost-and-capability-based-routing",
        "status": "live"
      },
      {
        "title": "Normalizing Responses: Usage, Finish Reasons, and Errors",
        "slug": "normalizing-responses-across-providers",
        "status": "live"
      },
      {
        "title": "Handling API Keys and Secrets Safely",
        "slug": "secrets-and-key-management",
        "status": "live"
      },
      {
        "title": "Storing Secrets: Env, Vault, and KMS Patterns",
        "slug": "secret-storage-env-vault-kms",
        "status": "live"
      },
      {
        "title": "Build Your Own Layer or Use a Gateway?",
        "slug": "gateway-vs-in-app-abstraction",
        "status": "live"
      },
      {
        "title": "When the Abstraction Leaks (and Over-Abstraction)",
        "slug": "provider-abstraction-leaks",
        "status": "live"
      },
      {
        "title": "Provider Layer Cheatsheet",
        "slug": "provider-layer-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Provider Layer and Secrets",
        "slug": "quiz-provider-layer",
        "status": "live"
      },
      {
        "title": "Handling API Keys and Secrets Safely",
        "slug": "handling-api-keys-and-secrets",
        "status": "live"
      },
      {
        "title": "Error Handling for LLM Calls",
        "slug": "error-handling-for-llm-calls",
        "status": "live"
      },
      {
        "title": "The Failure Modes of an LLM Call",
        "slug": "failure-modes-of-llm-calls",
        "status": "live"
      },
      {
        "title": "Typed Errors and a Clean Error Boundary",
        "slug": "try-catch-and-typed-errors",
        "status": "live"
      },
      {
        "title": "Rate Limits and When to Retry",
        "slug": "rate-limits-and-retry",
        "status": "live"
      },
      {
        "title": "Exponential Backoff With Jitter",
        "slug": "exponential-backoff-with-jitter",
        "status": "live"
      },
      {
        "title": "Timeouts, Deadlines, and Circuit Breakers",
        "slug": "timeouts-and-circuit-breakers",
        "status": "live"
      },
      {
        "title": "Input Validation and Prompt-Injection Defense",
        "slug": "input-validation-and-injection-defense",
        "status": "live"
      },
      {
        "title": "Output Validation and Moderation Gates",
        "slug": "output-validation-and-moderation",
        "status": "live"
      },
      {
        "title": "When to Put a Human in the Loop",
        "slug": "human-in-the-loop-review",
        "status": "live"
      },
      {
        "title": "Building a Review Queue",
        "slug": "building-a-review-queue",
        "status": "live"
      },
      {
        "title": "An Escalation and Approval Flow",
        "slug": "escalation-and-approval-flow",
        "status": "live"
      },
      {
        "title": "Reliability Antipatterns",
        "slug": "reliability-antipatterns",
        "status": "live"
      },
      {
        "title": "Idempotency and Partial-Failure Recovery",
        "slug": "idempotency-and-partial-failure",
        "status": "live"
      },
      {
        "title": "Reliability and Safety Cheatsheet",
        "slug": "reliability-safety-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Reliability and Safety",
        "slug": "quiz-reliability-safety",
        "status": "live"
      },
      {
        "title": "Guardrails and Input Validation",
        "slug": "guardrails-and-input-validation",
        "status": "live"
      },
      {
        "title": "Shipping Your First End-to-End GenAI App",
        "slug": "shipping-your-first-end-to-end-app",
        "status": "live"
      },
      {
        "title": "Prompt Versioning and Safe Rollbacks",
        "slug": "prompt-versioning-and-rollback",
        "status": "live"
      },
      {
        "title": "Versioning Prompts in Git and a Registry",
        "slug": "versioning-prompts-in-git-and-registry",
        "status": "live"
      },
      {
        "title": "Feature Flags and Gradual Rollout",
        "slug": "feature-flags-and-gradual-rollout",
        "status": "live"
      },
      {
        "title": "Canary and Percentage-Based Rollout",
        "slug": "canary-and-percentage-rollout",
        "status": "live"
      },
      {
        "title": "Observability for GenAI Features",
        "slug": "observability-for-genai",
        "status": "live"
      },
      {
        "title": "Instrumenting Requests With Tracing",
        "slug": "instrumenting-with-tracing",
        "status": "live"
      },
      {
        "title": "Logging Prompts and Completions Safely",
        "slug": "logging-prompts-and-completions-safely",
        "status": "live"
      },
      {
        "title": "Evals and Regression Testing for Prompts",
        "slug": "evals-and-regression-testing",
        "status": "live"
      },
      {
        "title": "A/B Testing Two Prompt Versions",
        "slug": "a-b-testing-two-prompts",
        "status": "live"
      },
      {
        "title": "Shipping a GenAI Feature End to End",
        "slug": "shipping-end-to-end",
        "status": "live"
      },
      {
        "title": "Launch-Day Antipatterns",
        "slug": "launch-day-antipatterns",
        "status": "live"
      },
      {
        "title": "Incident Response for AI Features",
        "slug": "incident-response-for-ai-features",
        "status": "live"
      },
      {
        "title": "Shipping and Operating Cheatsheet",
        "slug": "shipping-operating-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: Shipping and Operating",
        "slug": "quiz-shipping-operating",
        "status": "live"
      },
      {
        "title": "Choosing an SDK: Vercel AI SDK, LangChain, or the Raw API",
        "slug": "sdk-vs-raw-api",
        "status": "live"
      },
      {
        "title": "Handling Multimodal Input: Images, Audio, and Files",
        "slug": "handling-multimodal-input",
        "status": "live"
      },
      {
        "title": "SSE vs. WebSockets for Streaming LLM Output",
        "slug": "sse-vs-websockets",
        "status": "live"
      },
      {
        "title": "Session and State Management for Multi-Turn Features",
        "slug": "session-state-multi-turn",
        "status": "live"
      },
      {
        "title": "Session and State for Multi-Turn Features",
        "slug": "session-and-state-management",
        "status": "live"
      },
      {
        "title": "Storing and Reloading Conversation History",
        "slug": "storing-conversation-history",
        "status": "live"
      },
      {
        "title": "Context Limits and Why History Must Be Trimmed",
        "slug": "context-limits-and-trimming",
        "status": "live"
      },
      {
        "title": "Trimming: Sliding Windows and Rolling Summaries",
        "slug": "sliding-window-and-summarization-trim",
        "status": "live"
      },
      {
        "title": "Why Application Code Needs Structured Output",
        "slug": "structured-output-in-apps",
        "status": "live"
      },
      {
        "title": "Schema, Validation, and Auto-Repair",
        "slug": "json-schema-and-validation",
        "status": "live"
      },
      {
        "title": "Extracting Typed Records From Freeform Text",
        "slug": "extracting-typed-data-from-freeform",
        "status": "live"
      },
      {
        "title": "Structured Output Failures and Repair Traps",
        "slug": "structured-output-failures",
        "status": "live"
      },
      {
        "title": "Tool Calls Are Requests for Authority",
        "slug": "tool-calling-as-authority",
        "status": "live"
      },
      {
        "title": "Implementing the Tool-Call Loop",
        "slug": "implementing-a-tool-call-loop",
        "status": "live"
      },
      {
        "title": "Two Tools: A Read API and a Guarded DB Write",
        "slug": "building-a-weather-and-db-tool",
        "status": "live"
      },
      {
        "title": "Multi-Step Tool Loops and Where They Go Wrong",
        "slug": "multi-step-agentic-tool-loops",
        "status": "live"
      },
      {
        "title": "Tool-Calling Authority Mistakes",
        "slug": "tool-call-authority-mistakes",
        "status": "live"
      },
      {
        "title": "Tool/Function Calling Across Providers",
        "slug": "function-calling-across-providers",
        "status": "live"
      },
      {
        "title": "State, Structured Output, and Tools Cheatsheet",
        "slug": "state-and-tools-cheatsheet",
        "status": "live"
      },
      {
        "title": "Quiz: State, Structured Output, and Tools",
        "slug": "quiz-state-structured-tools",
        "status": "live"
      },
      {
        "title": "Prompt Versioning and Safe Rollbacks",
        "slug": "prompt-versioning-rollback",
        "status": "live"
      },
      {
        "title": "Feature-Flagging and Gradual Rollouts for AI Features",
        "slug": "feature-flagging-ai-features",
        "status": "live"
      },
      {
        "title": "Model Routing and Multi-Provider Failover",
        "slug": "model-routing-and-failover",
        "status": "live"
      },
      {
        "title": "Background Jobs for Long-Running AI Tasks",
        "slug": "background-jobs-for-long-running-ai-tasks",
        "status": "live"
      },
      {
        "title": "Human-in-the-Loop Review Queues",
        "slug": "human-in-the-loop-review-queues",
        "status": "live"
      },
      {
        "title": "Generative UI: Rendering Components from Model Output",
        "slug": "generative-ui",
        "status": "live"
      },
      {
        "title": "Client-Side LLM Inference in the Browser",
        "slug": "client-side-inference",
        "status": "live"
      },
      {
        "title": "Build an AI feature around a request lifecycle",
        "slug": "api-lifecycle-and-structured-output",
        "status": "live"
      },
      {
        "title": "Treat tool calls as requests for authority",
        "slug": "tool-calling-and-authority",
        "status": "live"
      },
      {
        "title": "Capstone: Ship a Production GenAI Assistant",
        "slug": "capstone-ship-a-genai-assistant",
        "status": "live"
      }
    ]
  },
  {
    "id": "rag",
    "n": "14",
    "name": "RAG",
    "group": "Building",
    "meta": "56 lessons",
    "summary": "Ground model answers in your own data — from chunking and embeddings through hybrid retrieval, reranking, and knowing when to skip RAG entirely.",
    "nodes": [
      {
        "title": "RAG, End to End: The Whole Game",
        "slug": "rag-whole-game",
        "status": "live"
      },
      {
        "title": "What Is RAG and When to Use It",
        "slug": "what-is-rag-and-when-to-use-it",
        "status": "live"
      },
      {
        "title": "Chunking Strategies for Documents",
        "slug": "chunking-strategies-for-documents",
        "status": "live"
      },
      {
        "title": "Chunking Strategies Compared",
        "slug": "chunking-strategies-compared",
        "status": "live"
      },
      {
        "title": "Chunking, Worked: One PDF Through Three Strategies",
        "slug": "chunking-worked-example",
        "status": "live"
      },
      {
        "title": "Chunking: Common Mistakes",
        "slug": "chunking-common-mistakes",
        "status": "live"
      },
      {
        "title": "Chunking Cheatsheet",
        "slug": "chunking-cheatsheet",
        "status": "live"
      },
      {
        "title": "Chunking: Check Yourself",
        "slug": "chunking-quiz",
        "status": "live"
      },
      {
        "title": "Embeddings and Semantic Similarity",
        "slug": "embeddings-and-semantic-similarity",
        "status": "live"
      },
      {
        "title": "Similarity Search and ANN Indexes",
        "slug": "similarity-search-and-ann-indexes",
        "status": "live"
      },
      {
        "title": "ANN Index Methods Compared",
        "slug": "retrieval-methods-compared",
        "status": "live"
      },
      {
        "title": "Vector Retrieval, Worked: Query to Top-k",
        "slug": "retrieval-worked-example",
        "status": "live"
      },
      {
        "title": "Vector Retrieval: Common Mistakes",
        "slug": "retrieval-common-mistakes",
        "status": "live"
      },
      {
        "title": "Vector Retrieval Cheatsheet",
        "slug": "retrieval-cheatsheet",
        "status": "live"
      },
      {
        "title": "Vector Retrieval: Check Yourself",
        "slug": "retrieval-quiz",
        "status": "live"
      },
      {
        "title": "Choosing a Vector Database",
        "slug": "choosing-a-vector-database",
        "status": "live"
      },
      {
        "title": "Sizing a Vector DB, Worked: 5M Vectors",
        "slug": "vector-db-worked-example",
        "status": "live"
      },
      {
        "title": "Choosing a Vector DB: Common Mistakes",
        "slug": "vector-db-common-mistakes",
        "status": "live"
      },
      {
        "title": "Vector DB Cheatsheet",
        "slug": "vector-db-cheatsheet",
        "status": "live"
      },
      {
        "title": "Choosing a Vector DB: Check Yourself",
        "slug": "vector-db-quiz",
        "status": "live"
      },
      {
        "title": "Metadata Filtering in Retrieval",
        "slug": "metadata-filtering-in-retrieval",
        "status": "live"
      },
      {
        "title": "Hybrid Search: Lexical and Vector Combined",
        "slug": "hybrid-search-lexical-and-vector",
        "status": "live"
      },
      {
        "title": "Hybrid Search, Worked: When Vectors Miss the Exact Term",
        "slug": "hybrid-search-worked-example",
        "status": "live"
      },
      {
        "title": "Hybrid Search: Common Mistakes",
        "slug": "hybrid-search-common-mistakes",
        "status": "live"
      },
      {
        "title": "Hybrid Search Cheatsheet",
        "slug": "hybrid-search-cheatsheet",
        "status": "live"
      },
      {
        "title": "Hybrid Search: Check Yourself",
        "slug": "hybrid-search-quiz",
        "status": "live"
      },
      {
        "title": "Query Rewriting and Expansion",
        "slug": "query-rewriting-and-expansion",
        "status": "live"
      },
      {
        "title": "Reranking Retrieved Results",
        "slug": "reranking-retrieved-results",
        "status": "live"
      },
      {
        "title": "Reranking Methods Compared",
        "slug": "reranking-methods-compared",
        "status": "live"
      },
      {
        "title": "Reranking, Worked: Fixing a Wrong Top-1",
        "slug": "reranking-worked-example",
        "status": "live"
      },
      {
        "title": "Reranking: Common Mistakes",
        "slug": "reranking-common-mistakes",
        "status": "live"
      },
      {
        "title": "Reranking Cheatsheet",
        "slug": "reranking-cheatsheet",
        "status": "live"
      },
      {
        "title": "Reranking: Check Yourself",
        "slug": "reranking-quiz",
        "status": "live"
      },
      {
        "title": "Grounding Answers with Citations",
        "slug": "grounding-answers-with-citations",
        "status": "live"
      },
      {
        "title": "Building a RAG Pipeline End to End",
        "slug": "building-a-rag-pipeline-end-to-end",
        "status": "live"
      },
      {
        "title": "Evaluating RAG Quality",
        "slug": "evaluating-rag-quality",
        "status": "live"
      },
      {
        "title": "Evaluating RAG, Worked: A Golden Set from Scratch",
        "slug": "rag-eval-worked-example",
        "status": "live"
      },
      {
        "title": "RAG Evaluation: Common Mistakes",
        "slug": "rag-eval-common-mistakes",
        "status": "live"
      },
      {
        "title": "RAG Evaluation Cheatsheet",
        "slug": "rag-eval-cheatsheet",
        "status": "live"
      },
      {
        "title": "RAG Evaluation: Check Yourself",
        "slug": "rag-eval-quiz",
        "status": "live"
      },
      {
        "title": "When RAG Is the Wrong Tool",
        "slug": "when-rag-is-the-wrong-tool",
        "status": "live"
      },
      {
        "title": "Parsing PDFs, Tables, and Scanned Documents for RAG",
        "slug": "parsing-documents-for-rag",
        "status": "live"
      },
      {
        "title": "Parent-Document Retrieval: Small Chunks, Big Context",
        "slug": "parent-document-retrieval",
        "status": "live"
      },
      {
        "title": "Contextual Retrieval: Prepending Context Before Embedding",
        "slug": "contextual-retrieval",
        "status": "live"
      },
      {
        "title": "RAG Over Structured Data: Tables, SQL, and Spreadsheets",
        "slug": "structured-data-rag",
        "status": "live"
      },
      {
        "title": "Access-Controlled Retrieval: Per-User Permissions in RAG",
        "slug": "access-controlled-retrieval",
        "status": "live"
      },
      {
        "title": "Incremental Indexing and Keeping an Index Fresh",
        "slug": "incremental-indexing-freshness",
        "status": "live"
      },
      {
        "title": "Caching Retrieval and Generation in a RAG Pipeline",
        "slug": "rag-caching-and-cost",
        "status": "live"
      },
      {
        "title": "Multi-Vector and Late-Interaction Retrieval (ColBERT)",
        "slug": "multi-vector-retrieval",
        "status": "live"
      },
      {
        "title": "Multimodal RAG: Retrieving Over Images and Layout",
        "slug": "multimodal-rag",
        "status": "live"
      },
      {
        "title": "Agentic RAG: Iterative, Multi-Hop Retrieval",
        "slug": "agentic-rag",
        "status": "live"
      },
      {
        "title": "Corrective and Self-RAG: Grading Retrieval Before Answering",
        "slug": "corrective-self-rag",
        "status": "live"
      },
      {
        "title": "GraphRAG: Retrieval Over a Knowledge Graph",
        "slug": "graphrag",
        "status": "live"
      },
      {
        "title": "Build retrieval from corpus to ranked context",
        "slug": "ingestion-chunking-and-retrieval",
        "status": "live"
      },
      {
        "title": "Control grounding, citations, and context budgets",
        "slug": "grounding-citations-and-context-budgets",
        "status": "live"
      },
      {
        "title": "Capstone: Build a Grounded Support Bot",
        "slug": "rag-capstone-support-bot",
        "status": "live"
      }
    ]
  },
  {
    "id": "tools-function-calling",
    "n": "15",
    "name": "Tools & Function Calling",
    "group": "Building",
    "meta": "123 lessons",
    "summary": "Give a model hands: design tool schemas it can call correctly, execute them safely, and handle the ways tool calling breaks.",
    "nodes": [
      {
        "title": "The Whole Game: A Tool Call From Question to Answer",
        "slug": "tool-calling-whole-game",
        "status": "live"
      },
      {
        "title": "What Is Tool Calling",
        "slug": "what-is-tool-calling",
        "status": "live"
      },
      {
        "title": "Anatomy of a Tool Call",
        "slug": "anatomy-of-a-tool-call",
        "status": "live"
      },
      {
        "title": "Tools Are the Model's Only Hands",
        "slug": "tools-as-the-models-hands",
        "status": "live"
      },
      {
        "title": "The Agent Loop",
        "slug": "the-tool-call-loop",
        "status": "live"
      },
      {
        "title": "Your First Tool Call, End to End",
        "slug": "first-tool-call-walkthrough",
        "status": "live"
      },
      {
        "title": "Why a Model Needs Tools at All",
        "slug": "why-models-need-tools",
        "status": "live"
      },
      {
        "title": "How Models Learn to Emit Tool Calls",
        "slug": "how-models-learn-to-call-tools",
        "status": "live"
      },
      {
        "title": "Tool Calling Across Providers",
        "slug": "tool-calling-across-providers",
        "status": "live"
      },
      {
        "title": "Structured Output vs. Tool Calls: Which and When",
        "slug": "structured-output-vs-tool-calls-when",
        "status": "live"
      },
      {
        "title": "Beginner Tool-Calling Mistakes",
        "slug": "foundations-common-mistakes",
        "status": "live"
      },
      {
        "title": "It's Still Text In, Text Out",
        "slug": "tool-calling-still-text-in-text-out",
        "status": "live"
      },
      {
        "title": "Tool-Calling Vocabulary Cheatsheet",
        "slug": "tool-calling-glossary-cheatsheet",
        "status": "live"
      },
      {
        "title": "Foundations Quiz",
        "slug": "foundations-quiz",
        "status": "live"
      },
      {
        "title": "Designing a Tool Schema",
        "slug": "designing-a-tool-schema",
        "status": "live"
      },
      {
        "title": "The JSON Schema Subset That Matters for Tools",
        "slug": "json-schema-for-tools-essentials",
        "status": "live"
      },
      {
        "title": "Designing a Schema From a Fuzzy Requirement",
        "slug": "designing-a-tool-schema-walkthrough",
        "status": "live"
      },
      {
        "title": "Writing Descriptions Models Actually Follow",
        "slug": "writing-descriptions-models-follow-deep",
        "status": "live"
      },
      {
        "title": "Good vs. Bad Descriptions, Side by Side",
        "slug": "good-vs-bad-tool-descriptions",
        "status": "live"
      },
      {
        "title": "Parameter Design Patterns",
        "slug": "parameter-design-patterns",
        "status": "live"
      },
      {
        "title": "Enum vs. Free-Form Parameters",
        "slug": "enum-vs-freeform-parameters",
        "status": "live"
      },
      {
        "title": "Descriptions Are Prompt Engineering",
        "slug": "descriptions-are-prompts",
        "status": "live"
      },
      {
        "title": "The Token Cost of Tool Schemas",
        "slug": "token-cost-of-schemas-deep",
        "status": "live"
      },
      {
        "title": "Measuring and Trimming Schema Tokens",
        "slug": "measuring-and-trimming-schema-tokens",
        "status": "live"
      },
      {
        "title": "Converting an OpenAPI Spec to Tool Schemas",
        "slug": "openapi-to-schema-conversion",
        "status": "live"
      },
      {
        "title": "Versioning Schemas Without Breaking Agents",
        "slug": "schema-versioning-strategies",
        "status": "live"
      },
      {
        "title": "Evolving send_email v1 to v2",
        "slug": "versioning-a-schema-worked",
        "status": "live"
      },
      {
        "title": "Schema Design Mistakes",
        "slug": "schema-design-common-mistakes",
        "status": "live"
      },
      {
        "title": "Production Schema Checklist",
        "slug": "tool-schema-design-cheatsheet",
        "status": "live"
      },
      {
        "title": "Schema Design Quiz",
        "slug": "schema-design-quiz",
        "status": "live"
      },
      {
        "title": "Writing Tool Descriptions Models Actually Follow",
        "slug": "writing-tool-descriptions-models-follow",
        "status": "live"
      },
      {
        "title": "Tool Choice and Forcing Tool Use",
        "slug": "tool-choice-and-forcing-tool-use",
        "status": "live"
      },
      {
        "title": "Executing Tool Calls Safely",
        "slug": "executing-tool-calls-safely",
        "status": "live"
      },
      {
        "title": "From tool_call to Function Call",
        "slug": "execution-authority-model",
        "status": "live"
      },
      {
        "title": "Building a Registry and Dispatcher",
        "slug": "building-a-tool-dispatcher",
        "status": "live"
      },
      {
        "title": "Never Trust the Model's Arguments",
        "slug": "validating-tool-arguments",
        "status": "live"
      },
      {
        "title": "The Confused-Deputy Problem",
        "slug": "the-authority-problem",
        "status": "live"
      },
      {
        "title": "Sandboxing Principles",
        "slug": "sandboxing-execution-principles",
        "status": "live"
      },
      {
        "title": "Sandboxing a Tool in a Container",
        "slug": "sandboxing-with-containers",
        "status": "live"
      },
      {
        "title": "Subprocess vs. Container vs. microVM vs. WASM",
        "slug": "sandboxing-approaches-compared",
        "status": "live"
      },
      {
        "title": "Human-in-the-Loop Approval Gates",
        "slug": "approval-gates-design",
        "status": "live"
      },
      {
        "title": "Implementing an Approval Gate",
        "slug": "implementing-an-approval-gate",
        "status": "live"
      },
      {
        "title": "Classifying Tools by Risk Tier",
        "slug": "classifying-tool-risk-tiers",
        "status": "live"
      },
      {
        "title": "Returning Results the Model Can Use",
        "slug": "returning-results-to-the-model",
        "status": "live"
      },
      {
        "title": "Returning a 5,000-Row Result Without Blowing Context",
        "slug": "formatting-large-tool-results",
        "status": "live"
      },
      {
        "title": "Tool Results Are an Injection Vector",
        "slug": "tool-results-as-injection-vector",
        "status": "live"
      },
      {
        "title": "Caching Tool Results Across Calls",
        "slug": "caching-tool-results",
        "status": "live"
      },
      {
        "title": "Execution Safety Mistakes",
        "slug": "execution-safety-common-mistakes",
        "status": "live"
      },
      {
        "title": "Execution Safety Quiz",
        "slug": "execution-safety-quiz",
        "status": "live"
      },
      {
        "title": "Sandboxing Tool Execution",
        "slug": "sandboxing-tool-execution",
        "status": "live"
      },
      {
        "title": "Returning Tool Results to the Model",
        "slug": "returning-tool-results-to-the-model",
        "status": "live"
      },
      {
        "title": "Handling Tool Errors and Retries",
        "slug": "handling-tool-errors-and-retries",
        "status": "live"
      },
      {
        "title": "A Taxonomy of Tool-Calling Failures",
        "slug": "taxonomy-of-tool-failures",
        "status": "live"
      },
      {
        "title": "Handling Tool Errors and Retries",
        "slug": "handling-errors-and-retries",
        "status": "live"
      },
      {
        "title": "Returning Errors the Model Can Act On",
        "slug": "returning-actionable-errors",
        "status": "live"
      },
      {
        "title": "Retry, Back Off, or Give Up",
        "slug": "retry-strategies-for-tools",
        "status": "live"
      },
      {
        "title": "How a Model Corrects Its Own Call",
        "slug": "self-correction-mechanics",
        "status": "live"
      },
      {
        "title": "Self-Correction in a Full Trace",
        "slug": "self-correction-worked-example",
        "status": "live"
      },
      {
        "title": "When the Model Invents a Tool",
        "slug": "hallucinated-tool-calls",
        "status": "live"
      },
      {
        "title": "Stopping Runaway Loops",
        "slug": "infinite-loop-and-retry-caps",
        "status": "live"
      },
      {
        "title": "Debugging a Stuck Agent",
        "slug": "debugging-a-stuck-agent-loop",
        "status": "live"
      },
      {
        "title": "Fail to the Model, the User, or Silently Retry",
        "slug": "error-surface-strategies",
        "status": "live"
      },
      {
        "title": "Reliability Mistakes",
        "slug": "reliability-common-mistakes",
        "status": "live"
      },
      {
        "title": "Error Handling Cheatsheet",
        "slug": "error-handling-cheatsheet",
        "status": "live"
      },
      {
        "title": "Reliability Quiz",
        "slug": "reliability-quiz",
        "status": "live"
      },
      {
        "title": "Parallel Tool Calls",
        "slug": "parallel-tool-calls",
        "status": "live"
      },
      {
        "title": "Sequential, Multi-Step Tool Use",
        "slug": "sequential-multi-step-tool-use",
        "status": "live"
      },
      {
        "title": "Structured Output vs. Tool Calls",
        "slug": "structured-output-vs-tool-calls",
        "status": "live"
      },
      {
        "title": "Common Tool-Calling Failure Modes",
        "slug": "common-tool-calling-failure-modes",
        "status": "live"
      },
      {
        "title": "Testing and Debugging Tool Calls",
        "slug": "testing-and-debugging-tool-calls",
        "status": "live"
      },
      {
        "title": "Converting an OpenAPI Spec into Tool Schemas",
        "slug": "openapi-to-tool-schema",
        "status": "live"
      },
      {
        "title": "The Token Cost of Tool Schemas",
        "slug": "token-cost-of-tool-schemas",
        "status": "live"
      },
      {
        "title": "Tool Selection at Scale: When You Have Hundreds of Tools",
        "slug": "tool-selection-at-scale",
        "status": "live"
      },
      {
        "title": "Tool Choice: auto, required, none, and Named",
        "slug": "tool-choice-modes",
        "status": "live"
      },
      {
        "title": "Forcing extract_invoice Every Time",
        "slug": "forcing-a-specific-tool-worked",
        "status": "live"
      },
      {
        "title": "When to Force and When to Let It Decide",
        "slug": "when-to-force-vs-auto",
        "status": "live"
      },
      {
        "title": "Why More Tools Means Worse Choices",
        "slug": "too-many-tools-confuse-models",
        "status": "live"
      },
      {
        "title": "Selecting From Hundreds of Tools",
        "slug": "tool-selection-at-scale-strategies",
        "status": "live"
      },
      {
        "title": "Retrieval Over a 200-Tool Registry",
        "slug": "rag-over-tools-retrieval",
        "status": "live"
      },
      {
        "title": "Progressive Disclosure and Namespacing",
        "slug": "progressive-tool-disclosure-patterns",
        "status": "live"
      },
      {
        "title": "Router Tools and Grouped Dispatch",
        "slug": "tool-namespacing-and-grouping",
        "status": "live"
      },
      {
        "title": "Selection Accuracy at 5, 50, and 200 Tools",
        "slug": "measuring-selection-accuracy-vs-count",
        "status": "live"
      },
      {
        "title": "Tool Selection Mistakes at Scale",
        "slug": "tool-selection-common-mistakes",
        "status": "live"
      },
      {
        "title": "Scaling Tools Cheatsheet",
        "slug": "scaling-tools-cheatsheet",
        "status": "live"
      },
      {
        "title": "Tool Selection Quiz",
        "slug": "tool-selection-quiz",
        "status": "live"
      },
      {
        "title": "Caching Tool Results Across Calls",
        "slug": "tool-result-caching",
        "status": "live"
      },
      {
        "title": "Streaming Partial Tool Calls",
        "slug": "streaming-partial-tool-calls",
        "status": "live"
      },
      {
        "title": "Chaining Tool Calls into a DAG Workflow",
        "slug": "chaining-tools-into-workflows",
        "status": "live"
      },
      {
        "title": "Sequential, Dependent Tool Use",
        "slug": "sequential-multi-step-basics",
        "status": "live"
      },
      {
        "title": "A Sequential Booking Flow",
        "slug": "sequential-booking-flow-worked",
        "status": "live"
      },
      {
        "title": "Parallel Tool Calls",
        "slug": "parallel-tool-calls-mechanics",
        "status": "live"
      },
      {
        "title": "Executing Parallel Calls Concurrently",
        "slug": "executing-parallel-calls-async",
        "status": "live"
      },
      {
        "title": "Parallel or Sequential?",
        "slug": "parallel-vs-sequential-decision",
        "status": "live"
      },
      {
        "title": "Chaining Calls Into a DAG",
        "slug": "chaining-into-dag-workflows",
        "status": "live"
      },
      {
        "title": "Building a DAG Executor",
        "slug": "building-a-tool-dag-executor",
        "status": "live"
      },
      {
        "title": "Model-Driven vs. Code-Driven Orchestration",
        "slug": "model-driven-vs-code-driven-orchestration",
        "status": "live"
      },
      {
        "title": "Streaming Partial Tool Calls",
        "slug": "streaming-partial-tool-calls-concept",
        "status": "live"
      },
      {
        "title": "Parsing Streamed Argument Deltas",
        "slug": "parsing-streamed-tool-call-deltas",
        "status": "live"
      },
      {
        "title": "A Live 'Calling search_flights…' UI",
        "slug": "streaming-ui-for-tool-calls",
        "status": "live"
      },
      {
        "title": "Orchestration Mistakes",
        "slug": "orchestration-common-mistakes",
        "status": "live"
      },
      {
        "title": "Orchestration Cheatsheet",
        "slug": "orchestration-cheatsheet",
        "status": "live"
      },
      {
        "title": "Orchestration Quiz",
        "slug": "orchestration-quiz",
        "status": "live"
      },
      {
        "title": "Approval Gates for Sensitive Tool Calls",
        "slug": "approval-gates-for-sensitive-tools",
        "status": "live"
      },
      {
        "title": "Self-Correction When the Model Calls a Tool Wrong",
        "slug": "self-correction-on-bad-tool-calls",
        "status": "live"
      },
      {
        "title": "Benchmarking Tool Use: BFCL and Function-Calling Evals",
        "slug": "benchmarking-tool-use",
        "status": "live"
      },
      {
        "title": "Code Execution as a Tool",
        "slug": "code-execution-as-a-tool",
        "status": "live"
      },
      {
        "title": "Code Execution as a Tool",
        "slug": "code-execution-as-a-tool-concept",
        "status": "live"
      },
      {
        "title": "Building a Sandboxed Code Interpreter",
        "slug": "building-a-code-interpreter-tool",
        "status": "live"
      },
      {
        "title": "One Code Tool vs. Dozens of API Tools",
        "slug": "code-execution-vs-many-tools",
        "status": "live"
      },
      {
        "title": "Computer-Use and Browser-Control Tools",
        "slug": "computer-use-and-browser-tools-concept",
        "status": "live"
      },
      {
        "title": "Building a Browser-Control Loop",
        "slug": "building-a-browser-tool-loop",
        "status": "live"
      },
      {
        "title": "API Tools vs. Computer Use for the Same Task",
        "slug": "api-tools-vs-computer-use",
        "status": "live"
      },
      {
        "title": "Testing Tool Calls",
        "slug": "testing-tool-calls-strategies",
        "status": "live"
      },
      {
        "title": "Unit-Testing Handlers and Replaying Traces",
        "slug": "unit-testing-tool-handlers",
        "status": "live"
      },
      {
        "title": "Debugging With Trace Logging",
        "slug": "debugging-with-trace-logging",
        "status": "live"
      },
      {
        "title": "Benchmarking Tool Use With BFCL",
        "slug": "benchmarking-with-bfcl",
        "status": "live"
      },
      {
        "title": "Building Your Own Eval Harness",
        "slug": "building-a-tool-use-eval-harness",
        "status": "live"
      },
      {
        "title": "Reading BFCL Scores Critically",
        "slug": "reading-bfcl-leaderboard",
        "status": "live"
      },
      {
        "title": "Advanced-Tools Mistakes",
        "slug": "advanced-tools-common-mistakes",
        "status": "live"
      },
      {
        "title": "Advanced Tools and Testing Quiz",
        "slug": "advanced-tools-quiz",
        "status": "live"
      },
      {
        "title": "Computer-Use and Browser-Control Tools",
        "slug": "computer-use-and-browser-tools",
        "status": "live"
      },
      {
        "title": "Versioning Tool Schemas Without Breaking Running Agents",
        "slug": "tool-schema-versioning",
        "status": "live"
      },
      {
        "title": "Capstone: Build a Complete Tool-Using Agent",
        "slug": "capstone-build-a-tool-using-agent",
        "status": "live"
      }
    ]
  },
  {
    "id": "mcp",
    "n": "16",
    "name": "MCP",
    "group": "Building",
    "meta": "57 lessons",
    "summary": "The protocol that lets any AI app plug into any tool or data source — servers, primitives, transports, auth and production operation, with worked examples, comparisons and debugging clinics throughout.",
    "nodes": [
      {
        "title": "What Is MCP",
        "slug": "what-is-mcp",
        "status": "live"
      },
      {
        "title": "Your First MCP Server",
        "slug": "first-mcp-server",
        "status": "live"
      },
      {
        "title": "Building an MCP Server, Worked: Empty File to Live Tool",
        "slug": "mcp-server-worked-example",
        "status": "live"
      },
      {
        "title": "Building an MCP Server: Common Mistakes",
        "slug": "mcp-server-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Server Cheatsheet",
        "slug": "mcp-server-cheatsheet",
        "status": "live"
      },
      {
        "title": "Building an MCP Server: Check Yourself",
        "slug": "mcp-server-quiz",
        "status": "live"
      },
      {
        "title": "MCP Architecture: Hosts, Clients, Servers",
        "slug": "mcp-architecture-hosts-clients-servers",
        "status": "live"
      },
      {
        "title": "MCP Tools, Resources, and Prompts",
        "slug": "mcp-tools-resources-and-prompts",
        "status": "live"
      },
      {
        "title": "Primitives, Worked: The Same Capability as a Tool, a Resource and a Prompt",
        "slug": "mcp-primitives-worked-example",
        "status": "live"
      },
      {
        "title": "MCP Primitives: Common Mistakes",
        "slug": "mcp-primitives-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Primitives Cheatsheet",
        "slug": "mcp-primitives-cheatsheet",
        "status": "live"
      },
      {
        "title": "MCP Primitives: Check Yourself",
        "slug": "mcp-primitives-quiz",
        "status": "live"
      },
      {
        "title": "MCP Transports: stdio vs. HTTP",
        "slug": "mcp-transports-stdio-vs-http",
        "status": "live"
      },
      {
        "title": "MCP Transports Compared",
        "slug": "mcp-transports-compared",
        "status": "live"
      },
      {
        "title": "Transports, Worked: The Same Server Over stdio and HTTP",
        "slug": "mcp-transports-worked-example",
        "status": "live"
      },
      {
        "title": "MCP Transports: Common Mistakes",
        "slug": "mcp-transports-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Transports Cheatsheet",
        "slug": "mcp-transports-cheatsheet",
        "status": "live"
      },
      {
        "title": "MCP Transports: Check Yourself",
        "slug": "mcp-transports-quiz",
        "status": "live"
      },
      {
        "title": "Connecting a Client to an MCP Server",
        "slug": "connecting-a-client-to-an-mcp-server",
        "status": "live"
      },
      {
        "title": "MCP Tool Discovery and Schemas",
        "slug": "mcp-tool-discovery-and-schemas",
        "status": "live"
      },
      {
        "title": "MCP and the Context Window",
        "slug": "mcp-context-window",
        "status": "live"
      },
      {
        "title": "MCP Auth Fundamentals",
        "slug": "mcp-auth-fundamentals",
        "status": "live"
      },
      {
        "title": "The Agent That Dies Overnight: OAuth",
        "slug": "agent-dies-overnight-oauth",
        "status": "live"
      },
      {
        "title": "Securing MCP Servers Against Prompt Injection",
        "slug": "securing-mcp-servers-against-prompt-injection",
        "status": "live"
      },
      {
        "title": "MCP Auth Approaches Compared",
        "slug": "mcp-auth-compared",
        "status": "live"
      },
      {
        "title": "Auth, Worked: The Token That Expires at 3am",
        "slug": "mcp-auth-worked-example",
        "status": "live"
      },
      {
        "title": "MCP Auth and Security: Common Mistakes",
        "slug": "mcp-auth-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Auth Cheatsheet",
        "slug": "mcp-auth-cheatsheet",
        "status": "live"
      },
      {
        "title": "MCP Auth and Security: Check Yourself",
        "slug": "mcp-auth-quiz",
        "status": "live"
      },
      {
        "title": "Inspecting and Testing MCP Servers",
        "slug": "inspecting-and-testing-mcp-servers",
        "status": "live"
      },
      {
        "title": "MCP Registries and Discovery",
        "slug": "mcp-registries-and-discovery",
        "status": "live"
      },
      {
        "title": "Versioning MCP Servers Without Breaking Clients",
        "slug": "versioning-mcp-servers-without-breaking-clients",
        "status": "live"
      },
      {
        "title": "Running MCP Servers in Production",
        "slug": "running-mcp-servers-in-production",
        "status": "live"
      },
      {
        "title": "Debugging Common MCP Failures",
        "slug": "debugging-common-mcp-failures",
        "status": "live"
      },
      {
        "title": "Debugging MCP, Worked: Four Failures From Symptom to Cause",
        "slug": "mcp-debugging-worked-example",
        "status": "live"
      },
      {
        "title": "Debugging and Testing MCP: Common Mistakes",
        "slug": "mcp-debugging-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Debugging Cheatsheet",
        "slug": "mcp-debugging-cheatsheet",
        "status": "live"
      },
      {
        "title": "Debugging MCP: Check Yourself",
        "slug": "mcp-debugging-quiz",
        "status": "live"
      },
      {
        "title": "MCP Roots: Scoping a Server to a Filesystem Boundary",
        "slug": "mcp-roots",
        "status": "live"
      },
      {
        "title": "Structured Content and Output Schemas in MCP Tools",
        "slug": "structured-tool-output",
        "status": "live"
      },
      {
        "title": "Resource Subscriptions: Notifying Clients When Data Changes",
        "slug": "resource-subscriptions",
        "status": "live"
      },
      {
        "title": "Streamable HTTP: Sessions, Resumption, and Reconnects",
        "slug": "streamable-http-deep-dive",
        "status": "live"
      },
      {
        "title": "Stateful vs. Stateless MCP Server Design",
        "slug": "stateful-vs-stateless-servers",
        "status": "live"
      },
      {
        "title": "MCP Elicitation: Servers Asking the User Mid-Session",
        "slug": "mcp-elicitation",
        "status": "live"
      },
      {
        "title": "MCP Sampling: Letting a Server Borrow the Client's LLM",
        "slug": "mcp-sampling",
        "status": "live"
      },
      {
        "title": "Orchestrating Multiple MCP Servers in One Client Session",
        "slug": "multi-server-orchestration",
        "status": "live"
      },
      {
        "title": "The Gateway Pattern: Proxying Many MCP Servers Behind One",
        "slug": "mcp-gateway-pattern",
        "status": "live"
      },
      {
        "title": "Supply-Chain Trust: Vetting Third-Party MCP Servers",
        "slug": "supply-chain-trust-in-mcp",
        "status": "live"
      },
      {
        "title": "Sandboxing Untrusted MCP Servers",
        "slug": "sandboxing-untrusted-servers",
        "status": "live"
      },
      {
        "title": "Building an MCP Client From Scratch",
        "slug": "building-an-mcp-client",
        "status": "live"
      },
      {
        "title": "MCP Deployment Options Compared",
        "slug": "mcp-deployment-compared",
        "status": "live"
      },
      {
        "title": "Deployment, Worked: One Server From Laptop to Team",
        "slug": "mcp-deployment-worked-example",
        "status": "live"
      },
      {
        "title": "Running MCP Servers: Common Mistakes",
        "slug": "mcp-deployment-common-mistakes",
        "status": "live"
      },
      {
        "title": "MCP Operations Cheatsheet",
        "slug": "mcp-deployment-cheatsheet",
        "status": "live"
      },
      {
        "title": "Running MCP Servers: Check Yourself",
        "slug": "mcp-deployment-quiz",
        "status": "live"
      },
      {
        "title": "Learn the primitives and lifecycle of MCP-style tool connections",
        "slug": "primitives-lifecycle-and-transport",
        "status": "live"
      },
      {
        "title": "Design MCP servers with narrow capabilities",
        "slug": "server-design-and-permissions",
        "status": "live"
      }
    ]
  },
  {
    "id": "agentic-ai",
    "n": "17",
    "name": "Agentic AI",
    "group": "Agentic",
    "meta": "28 lessons",
    "summary": "What an agent actually is, the loop that makes one work, and when to reach for one instead of a plain prompt or workflow.",
    "nodes": [
      {
        "title": "What Makes Something an Agent",
        "slug": "what-is-an-agent",
        "status": "live"
      },
      {
        "title": "The Agent Loop: Sense, Think, Act",
        "slug": "the-agent-loop",
        "status": "live"
      },
      {
        "title": "Giving Agents Tools",
        "slug": "tool-use-basics",
        "status": "live"
      },
      {
        "title": "ReAct: Interleaving Reasoning and Acting",
        "slug": "react-pattern",
        "status": "live"
      },
      {
        "title": "Planning Before Acting",
        "slug": "planning-and-task-decomposition",
        "status": "live"
      },
      {
        "title": "Short-Term vs Long-Term Memory",
        "slug": "agent-memory-short-vs-long-term",
        "status": "live"
      },
      {
        "title": "Reflection: Letting an Agent Grade Itself",
        "slug": "reflection-and-self-critique",
        "status": "live"
      },
      {
        "title": "Recovering When Tools Fail",
        "slug": "error-handling-and-retries",
        "status": "live"
      },
      {
        "title": "Multi-Agent Patterns: Orchestrator, Pipeline, Debate",
        "slug": "multi-agent-patterns",
        "status": "live"
      },
      {
        "title": "Choosing an Orchestration Framework",
        "slug": "agent-orchestration-frameworks",
        "status": "live"
      },
      {
        "title": "Setting the Autonomy Dial",
        "slug": "autonomy-vs-control",
        "status": "live"
      },
      {
        "title": "When a Workflow Beats an Agent",
        "slug": "when-not-to-use-an-agent",
        "status": "live"
      },
      {
        "title": "Diagnosing Agent Failure Modes",
        "slug": "common-agent-failure-modes",
        "status": "live"
      },
      {
        "title": "Reading an Agent's Trace",
        "slug": "evaluating-agent-behavior-in-dev",
        "status": "live"
      },
      {
        "title": "Termination Conditions: Teaching an Agent When It's Done",
        "slug": "stopping-conditions-for-agents",
        "status": "live"
      },
      {
        "title": "Plan-and-Execute vs. ReAct: Hierarchical Task Decomposition",
        "slug": "hierarchical-task-decomposition",
        "status": "live"
      },
      {
        "title": "Persistent Memory Architectures: Beyond the Context Window",
        "slug": "persistent-agent-memory",
        "status": "live"
      },
      {
        "title": "Context Isolation: Why Subagents Get a Clean Slate",
        "slug": "subagent-context-isolation",
        "status": "live"
      },
      {
        "title": "LangGraph, CrewAI, AutoGen: What Each Framework Actually Buys You",
        "slug": "choosing-an-agent-framework",
        "status": "live"
      },
      {
        "title": "Computer-Use Agents: Letting a Model Operate a GUI",
        "slug": "computer-use-agents",
        "status": "live"
      },
      {
        "title": "Inside a Coding Agent: How Claude Code and SWE-Agent Work",
        "slug": "coding-agent-architecture",
        "status": "live"
      },
      {
        "title": "Blackboard and Swarm: Decentralized Multi-Agent Coordination",
        "slug": "blackboard-and-swarm-patterns",
        "status": "live"
      },
      {
        "title": "Tree of Thoughts and MCTS: Search-Based Planning for Agents",
        "slug": "tree-search-for-agent-planning",
        "status": "live"
      },
      {
        "title": "Agent-to-Agent Protocols: How Agents Will Talk to Each Other",
        "slug": "agent-to-agent-protocols",
        "status": "live"
      },
      {
        "title": "Benchmarking Agents: SWE-bench, WebArena, and GAIA",
        "slug": "agent-benchmarks",
        "status": "live"
      },
      {
        "title": "Cost-Aware Agents: Budgeting Tokens Across a Long-Running Loop",
        "slug": "cost-aware-agent-loops",
        "status": "live"
      },
      {
        "title": "Choose an agent only when a workflow is not enough",
        "slug": "agents-vs-workflows",
        "status": "live"
      },
      {
        "title": "Design agent state, memory, and recovery explicitly",
        "slug": "state-memory-and-recovery",
        "status": "live"
      }
    ]
  },
  {
    "id": "harness-design",
    "n": "18",
    "name": "Harness Design",
    "group": "Agentic",
    "meta": "26 lessons",
    "summary": "The engineering scaffold — control loop, tool routing, policy, sandboxing, state — that turns a raw model into a working, controllable agent.",
    "nodes": [
      {
        "title": "The Harness: Everything Around the Model",
        "slug": "what-is-a-harness",
        "status": "live"
      },
      {
        "title": "Building the Control Loop",
        "slug": "the-control-loop",
        "status": "live"
      },
      {
        "title": "Routing Tool Calls to Real Code",
        "slug": "tool-routing-and-registries",
        "status": "live"
      },
      {
        "title": "Composing the System Prompt at Runtime",
        "slug": "prompt-composition",
        "status": "live"
      },
      {
        "title": "Deny-Floors: Rules No Prompt Can Override",
        "slug": "deny-floors-and-policy-layers",
        "status": "live"
      },
      {
        "title": "Allow/Ask/Deny: Designing Approval Gates",
        "slug": "permission-and-approval-systems",
        "status": "live"
      },
      {
        "title": "Running Agents Headless from a Terminal",
        "slug": "headless-cli-agents",
        "status": "live"
      },
      {
        "title": "Sandboxing Tool Execution in a Harness",
        "slug": "subprocess-isolation-and-sandboxing",
        "status": "live"
      },
      {
        "title": "Checkpointing Long-Running Agent State",
        "slug": "state-and-checkpointing",
        "status": "live"
      },
      {
        "title": "Streaming Tokens and Tool Events",
        "slug": "streaming-model-output",
        "status": "live"
      },
      {
        "title": "Guardrails as Code, Not Prose",
        "slug": "guardrails-as-code",
        "status": "live"
      },
      {
        "title": "Managing Context Inside a Long Session",
        "slug": "context-window-management-in-a-harness",
        "status": "live"
      },
      {
        "title": "Delegating Work to Subagents",
        "slug": "subagent-and-task-delegation",
        "status": "live"
      },
      {
        "title": "Logging Every Step for Debuggability",
        "slug": "observability-and-logging",
        "status": "live"
      },
      {
        "title": "Hooks: Letting Users Extend the Harness Without Forking It",
        "slug": "hooks-as-extension-points",
        "status": "live"
      },
      {
        "title": "Config Layering: Global, Project, and Local Settings",
        "slug": "config-layering",
        "status": "live"
      },
      {
        "title": "Truncating and Paginating Oversized Tool Output",
        "slug": "tool-output-truncation",
        "status": "live"
      },
      {
        "title": "Handling Ctrl-C: Clean Interruption Mid-Tool-Call",
        "slug": "interrupt-and-cancellation-handling",
        "status": "live"
      },
      {
        "title": "Scheduling Parallel Tool Calls Without Races",
        "slug": "parallel-tool-scheduling",
        "status": "live"
      },
      {
        "title": "Model Routing and Fallback Inside a Harness",
        "slug": "model-routing-and-fallback",
        "status": "live"
      },
      {
        "title": "Crash Recovery: Resuming an Agent Session After an Unexpected Exit",
        "slug": "crash-recovery-and-resumption",
        "status": "live"
      },
      {
        "title": "Docker, gVisor, and Firecracker: Choosing a Sandbox Boundary",
        "slug": "sandboxing-technology-choices",
        "status": "live"
      },
      {
        "title": "Keeping Secrets Out of Prompts, Logs, and Transcripts",
        "slug": "secrets-in-the-harness",
        "status": "live"
      },
      {
        "title": "Tracing a Harness: Structured Spans for Every Model and Tool Call",
        "slug": "harness-observability",
        "status": "live"
      },
      {
        "title": "Testing a Harness Against Simulated Tool Environments",
        "slug": "simulated-tool-environments",
        "status": "live"
      },
      {
        "title": "Orchestrating Concurrent Model Calls Across Processes",
        "slug": "distributed-harness-orchestration",
        "status": "live"
      }
    ]
  },
  {
    "id": "evals-red-teaming",
    "n": "19",
    "name": "Evals & Red-teaming",
    "group": "Agentic",
    "meta": "28 lessons",
    "summary": "How to measure whether your agent actually works, and how to break it before an attacker does.",
    "nodes": [
      {
        "title": "Why Vibes-Based Iteration Breaks Down",
        "slug": "why-evals-matter",
        "status": "live"
      },
      {
        "title": "Building a Golden Dataset",
        "slug": "building-a-golden-dataset",
        "status": "live"
      },
      {
        "title": "Offline Evals vs Production Monitoring",
        "slug": "offline-vs-online-evals",
        "status": "live"
      },
      {
        "title": "Choosing Metrics That Actually Measure Success",
        "slug": "writing-eval-metrics",
        "status": "live"
      },
      {
        "title": "LLM-as-Judge: Grading Outputs with a Model",
        "slug": "llm-as-judge",
        "status": "live"
      },
      {
        "title": "Turning Bugs into a Regression Suite",
        "slug": "building-a-regression-suite",
        "status": "live"
      },
      {
        "title": "Designing a Human Review Workflow",
        "slug": "human-evaluation-and-annotation",
        "status": "live"
      },
      {
        "title": "Shipping Changes by Eval Diff",
        "slug": "eval-driven-iteration",
        "status": "live"
      },
      {
        "title": "Prompt Injection: When Content Becomes Instructions",
        "slug": "prompt-injection-basics",
        "status": "live"
      },
      {
        "title": "Common Jailbreak Techniques and Their Defenses",
        "slug": "jailbreak-techniques-and-defenses",
        "status": "live"
      },
      {
        "title": "Testing for Scope Escape",
        "slug": "scope-escape-and-tool-abuse",
        "status": "live"
      },
      {
        "title": "Running a Structured Red-Team Exercise",
        "slug": "adversarial-red-teaming-process",
        "status": "live"
      },
      {
        "title": "Automating Adversarial Probes",
        "slug": "automated-adversarial-testing",
        "status": "live"
      },
      {
        "title": "Tracking Eval Scores Across Model Versions",
        "slug": "eval-and-safety-metrics-dashboards",
        "status": "live"
      },
      {
        "title": "Taming Flaky Evals: Non-Determinism, Caching, and Retries",
        "slug": "flaky-eval-mitigation",
        "status": "live"
      },
      {
        "title": "Confidence Intervals and Sample Size for Eval Scores",
        "slug": "statistical-rigor-in-evals",
        "status": "live"
      },
      {
        "title": "Pairwise vs. Pointwise: Two Ways to Grade Model Output",
        "slug": "pairwise-vs-pointwise-grading",
        "status": "live"
      },
      {
        "title": "LLM-Judge Bias: Position, Verbosity, and Self-Preference Effects",
        "slug": "llm-judge-bias-and-calibration",
        "status": "live"
      },
      {
        "title": "Promptfoo, Braintrust, and Ragas: Picking an Eval Tool",
        "slug": "eval-tooling-landscape",
        "status": "live"
      },
      {
        "title": "Goodhart's Law: When a Benchmark Stops Measuring What You Wanted",
        "slug": "goodharting-your-benchmark",
        "status": "live"
      },
      {
        "title": "Evaluating Agent Trajectories, Not Just Final Answers",
        "slug": "evaluating-agent-trajectories",
        "status": "live"
      },
      {
        "title": "Safety Evals vs. Capability Evals: Different Goals, Different Designs",
        "slug": "safety-vs-capability-evals",
        "status": "live"
      },
      {
        "title": "Crescendo, Many-Shot, and TAP: Building an Adversarial Prompt Set",
        "slug": "adversarial-dataset-construction",
        "status": "live"
      },
      {
        "title": "Red-Teaming Tool-Use: Excessive Permissions and Tool Misuse",
        "slug": "tool-use-red-teaming",
        "status": "live"
      },
      {
        "title": "Red-Teaming Images, Audio, and Files, Not Just Text",
        "slug": "multimodal-red-teaming",
        "status": "live"
      },
      {
        "title": "Continuous Red-Teaming: Bug Bounties and Live Adversarial Traffic",
        "slug": "continuous-red-teaming-in-production",
        "status": "live"
      },
      {
        "title": "Build evaluation datasets and rubrics before choosing a judge",
        "slug": "datasets-rubrics-and-judges",
        "status": "live"
      },
      {
        "title": "Turn evaluation into release gates and live signals",
        "slug": "regression-gates-and-online-signals",
        "status": "live"
      }
    ]
  },
  {
    "id": "production",
    "n": "20",
    "name": "Production & Ops",
    "group": "Production",
    "meta": "28 lessons",
    "summary": "Run AI features like real infrastructure: observe every call, control the bill, and know exactly what to do the moment something breaks.",
    "nodes": [
      {
        "title": "Log Every LLM Call as Structured Data",
        "slug": "structured-logging-for-llm-calls",
        "status": "live"
      },
      {
        "title": "Redact PII Before It Hits Your Logs",
        "slug": "pii-redaction-in-llm-logs",
        "status": "live"
      },
      {
        "title": "Track Cost Per Request and Per User",
        "slug": "token-and-cost-tracking",
        "status": "live"
      },
      {
        "title": "Cache Prompts and Responses to Cut Cost",
        "slug": "prompt-and-semantic-caching",
        "status": "live"
      },
      {
        "title": "Trace Multi-Step Agent and RAG Pipelines",
        "slug": "tracing-multi-step-ai-pipelines",
        "status": "live"
      },
      {
        "title": "Catch Regressions with Evals in CI",
        "slug": "eval-based-regression-testing",
        "status": "live"
      },
      {
        "title": "Set SLOs for Latency, Cost, and Quality",
        "slug": "latency-and-cost-slos",
        "status": "live"
      },
      {
        "title": "Rate-Limit and Add Backpressure to LLM Traffic",
        "slug": "rate-limiting-llm-apps",
        "status": "live"
      },
      {
        "title": "Canary and Shadow-Test Prompt or Model Changes",
        "slug": "canary-and-shadow-releases",
        "status": "live"
      },
      {
        "title": "Put a Kill Switch on Every AI Feature",
        "slug": "feature-flags-and-kill-switches",
        "status": "live"
      },
      {
        "title": "Write an On-Call Playbook for AI Failures",
        "slug": "on-call-playbooks-for-ai",
        "status": "live"
      },
      {
        "title": "Run a Postmortem After a Model Incident",
        "slug": "incident-postmortems-for-ai",
        "status": "live"
      },
      {
        "title": "Set a Data Retention Policy for AI Systems",
        "slug": "data-retention-and-privacy-policy",
        "status": "live"
      },
      {
        "title": "Monitor Production Traffic for Prompt Injection and Abuse",
        "slug": "prompt-injection-monitoring",
        "status": "live"
      },
      {
        "title": "Treat Prompts as Versioned Config, Not Embedded Strings",
        "slug": "prompts-as-versioned-config",
        "status": "live"
      },
      {
        "title": "Put an LLM Gateway in Front of Every Provider",
        "slug": "llm-gateway-and-provider-abstraction",
        "status": "live"
      },
      {
        "title": "Set Per-Tenant Token Budgets and Quotas",
        "slug": "per-tenant-token-budgets-and-quotas",
        "status": "live"
      },
      {
        "title": "Cache on Meaning, Not Just Exact Text Match",
        "slug": "semantic-caching-beyond-exact-match",
        "status": "live"
      },
      {
        "title": "Route Offline Workloads Through Batch APIs",
        "slug": "batch-api-for-non-interactive-workloads",
        "status": "live"
      },
      {
        "title": "Route Requests to Cheap or Frontier Models by Difficulty",
        "slug": "model-routing-by-task-complexity",
        "status": "live"
      },
      {
        "title": "Instrument LLM Calls with OpenTelemetry's GenAI Conventions",
        "slug": "opentelemetry-genai-semantic-conventions",
        "status": "live"
      },
      {
        "title": "Shed Load Gracefully Instead of Falling Over",
        "slug": "load-shedding-and-graceful-degradation",
        "status": "live"
      },
      {
        "title": "Load-Test Agentic Traffic Where One Request Fans Out Into Dozens",
        "slug": "capacity-planning-and-load-testing-for-agentic-traffic",
        "status": "live"
      },
      {
        "title": "Build an Escalation Queue for Low-Confidence Output",
        "slug": "human-escalation-queues-for-low-confidence-output",
        "status": "live"
      },
      {
        "title": "Fail Over Automatically When a Model Provider Goes Down",
        "slug": "multi-provider-failover-and-redundancy",
        "status": "live"
      },
      {
        "title": "Survive Model Deprecations and Silent Version Drift",
        "slug": "model-deprecation-and-version-pinning",
        "status": "live"
      },
      {
        "title": "Observe quality, cost, and latency as one production system",
        "slug": "observability-cost-and-latency",
        "status": "live"
      },
      {
        "title": "Ship AI systems with versioning, rollback, and incident paths",
        "slug": "deployment-versioning-and-incidents",
        "status": "live"
      }
    ]
  },
  {
    "id": "fine-tuning",
    "n": "21",
    "name": "Fine-tuning & Optimization",
    "group": "Production",
    "meta": "26 lessons",
    "summary": "Know when specializing a model beats a better prompt, then fine-tune, shrink, and serve it efficiently once you do.",
    "nodes": [
      {
        "title": "Decide: Fine-Tune, Prompt, or RAG?",
        "slug": "fine-tune-vs-prompt-vs-rag",
        "status": "live"
      },
      {
        "title": "Choose a Base Model to Fine-Tune",
        "slug": "picking-a-base-model-to-fine-tune",
        "status": "live"
      },
      {
        "title": "Build a Fine-Tuning Dataset That Works",
        "slug": "building-a-fine-tuning-dataset",
        "status": "live"
      },
      {
        "title": "Generate Synthetic Training Data with a Larger Model",
        "slug": "synthetic-data-generation",
        "status": "live"
      },
      {
        "title": "Full Fine-Tuning vs Parameter-Efficient Fine-Tuning",
        "slug": "full-fine-tuning-vs-peft",
        "status": "live"
      },
      {
        "title": "Fine-Tune with LoRA and QLoRA",
        "slug": "lora-and-qlora-fine-tuning",
        "status": "live"
      },
      {
        "title": "SFT vs Preference Tuning (DPO/RLHF)",
        "slug": "supervised-fine-tuning-vs-preference-tuning",
        "status": "live"
      },
      {
        "title": "Set Hyperparameters for a Fine-Tuning Run",
        "slug": "fine-tuning-run-hyperparameters",
        "status": "live"
      },
      {
        "title": "Diagnose Catastrophic Forgetting and Overfitting",
        "slug": "catastrophic-forgetting-and-overfitting",
        "status": "live"
      },
      {
        "title": "Evaluate a Fine-Tuned Model Before Shipping",
        "slug": "evaluating-a-fine-tuned-model",
        "status": "live"
      },
      {
        "title": "Quantize a Model: GGUF, AWQ, and GPTQ",
        "slug": "quantization-gguf-awq-gptq",
        "status": "live"
      },
      {
        "title": "Distill a Large Model into a Small One",
        "slug": "knowledge-distillation",
        "status": "live"
      },
      {
        "title": "Optimize Inference Serving: Batching and KV Cache",
        "slug": "inference-serving-optimization",
        "status": "live"
      },
      {
        "title": "Merge and Version LoRA Adapters",
        "slug": "merging-and-versioning-adapters",
        "status": "live"
      },
      {
        "title": "Deduplicate and Decontaminate Your Training Data",
        "slug": "dataset-decontamination-and-deduplication",
        "status": "live"
      },
      {
        "title": "Choose a Fine-Tuning Framework: Axolotl, Unsloth, TRL, torchtune",
        "slug": "choosing-a-training-framework",
        "status": "live"
      },
      {
        "title": "Pick LoRA Rank and Target Modules",
        "slug": "lora-rank-and-target-module-selection",
        "status": "live"
      },
      {
        "title": "Set a Learning Rate Schedule and Warmup",
        "slug": "learning-rate-schedules-and-warmup",
        "status": "live"
      },
      {
        "title": "Train Across GPUs with FSDP and DeepSpeed ZeRO",
        "slug": "distributed-training-with-fsdp-and-deepspeed",
        "status": "live"
      },
      {
        "title": "Fit Bigger Batches with Gradient Checkpointing and Flash Attention",
        "slug": "memory-optimization-gradient-checkpointing-flash-attention",
        "status": "live"
      },
      {
        "title": "Reward Modeling and PPO: What's Inside 'RLHF'",
        "slug": "rlhf-reward-modeling-and-ppo",
        "status": "live"
      },
      {
        "title": "DPO vs. ORPO vs. KTO: Choosing a Preference-Tuning Method",
        "slug": "dpo-vs-orpo-vs-kto",
        "status": "live"
      },
      {
        "title": "Fine-Tune a Model for Reliable Function Calling",
        "slug": "fine-tuning-for-function-calling",
        "status": "live"
      },
      {
        "title": "Extend Context Length with RoPE Scaling and YaRN",
        "slug": "context-length-extension-rope-scaling",
        "status": "live"
      },
      {
        "title": "Merge Full Models with SLERP, TIES, and DARE",
        "slug": "model-merging-slerp-ties-dare",
        "status": "live"
      },
      {
        "title": "Managed Fine-Tuning API vs. Self-Hosting the Run",
        "slug": "choosing-managed-vs-self-hosted-fine-tuning",
        "status": "live"
      }
    ]
  },
  {
    "id": "responsible-ai",
    "n": "22",
    "name": "Responsible AI",
    "group": "Production",
    "meta": "6 lessons",
    "summary": "Safety, fairness, privacy, and governance — building AI you can defend.",
    "nodes": [
      {
        "title": "Risk before model: frame the system, not just the prompt",
        "slug": "risk-before-model",
        "status": "live"
      },
      {
        "title": "Privacy, fairness, provenance, and accessibility",
        "slug": "privacy-fairness-provenance",
        "status": "live"
      },
      {
        "title": "Red-teaming LLM applications: attack the system you actually built",
        "slug": "red-teaming-llm-apps",
        "status": "live"
      },
      {
        "title": "Lab: turn a prompt injection finding into a regression test",
        "slug": "adversarial-testing-lab",
        "status": "live"
      },
      {
        "title": "Make responsible AI work visible through artifacts",
        "slug": "governance-artifacts",
        "status": "live"
      },
      {
        "title": "Treat privacy, fairness, and accessibility as system properties",
        "slug": "privacy-fairness-and-accessibility",
        "status": "live"
      }
    ]
  }
];

// The catalogue is intentionally pedagogical: after literacy, maths, and data
// practice, readers move through classical ML before deep learning and the
// broader AI survey. Numeric labels remain the single source of ordering.
export const tracks: Track[] = [...unsortedTracks].sort((a, b) => Number(a.n) - Number(b.n));

export const roleTracks: RoleTrack[] = [
  {
    "id": "developer",
    "name": "Developer",
    "blurb": "Ship AI features that survive production, not just demos.",
    "status": "live"
  },
  {
    "id": "ml-engineer",
    "name": "ML Engineer",
    "blurb": "Go under the hood: train, fine-tune, and serve models efficiently.",
    "status": "live"
  },
  {
    "id": "data-scientist",
    "name": "Data Scientist",
    "blurb": "Turn LLMs into reliable tools for data work.",
    "status": "live"
  },
  {
    "id": "product-manager",
    "name": "Product Manager",
    "blurb": "Make sound calls on what to build with AI and what to avoid.",
    "status": "live"
  },
  {
    "id": "founder",
    "name": "Founder",
    "blurb": "Go from idea to a shipped, defensible AI product.",
    "status": "live"
  },
  {
    "id": "ceo",
    "name": "CEO",
    "blurb": "Understand AI deeply enough to steer strategy, not just slides.",
    "status": "live"
  },
  {
    "id": "designer",
    "name": "Designer",
    "blurb": "Design AI interactions that feel trustworthy, not magical or broken.",
    "status": "live"
  },
  {
    "id": "content-creator",
    "name": "Content Creator",
    "blurb": "Get consistent, high-quality output from models for creative work.",
    "status": "live"
  },
  {
    "id": "marketer",
    "name": "Marketer",
    "blurb": "Apply AI across content, research, and campaigns without getting burned.",
    "status": "live"
  },
  {
    "id": "security-engineer",
    "name": "Security Engineer",
    "blurb": "Find and fix the ways AI systems and agents get broken.",
    "status": "live"
  },
  {
    "id": "student",
    "name": "Student",
    "blurb": "Build a real foundation, from the maths up to working systems.",
    "status": "live"
  }
];
export function getTrack(id: string): Track | undefined { return tracks.find((t) => t.id === id); }
export const statusLabel: Record<NodeStatus, string> = { live: 'Live', curated: 'Curated', coming: 'Coming soon' };
