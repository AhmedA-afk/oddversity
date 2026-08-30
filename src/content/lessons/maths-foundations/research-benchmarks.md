---
title: "Research Benchmarks"
track: "maths-foundations"
status: live
summary: "Research pass: browser-reviewed 2026-08-29."
duration: "4 min read"
---

# Mathematics Foundations for AI · research benchmark and scope decisions

Research pass: browser-reviewed 2026-08-29  
Course: overview · atomic checklist · assignments

## Decision

Oddversity will not copy a provider syllabus or impose a page ceiling. It will
use a **layered, AI-relevant 129-core / 28-specialist curriculum**, authoring
incrementally whenever a concept needs a separate derivation, example family,
lab, misconception clinic, or reference page. The checklist is allowed to grow
when research reveals a prerequisite or a distinct failure mode.

## What the browser review found

| Source | What it offers | What Oddversity adopts | What it must add or avoid |
|---|---|---|---|
| [GeeksforGeeks AI–ML–DS](https://www.geeksforgeeks.org/category/ai-ml-ds/) | a large, highly granular category archive; the reviewed page exposed 6.7K+ posts alongside overlapping ML, Python, DL, and AI categories | grouped navigation and room for narrow references | a raw archive is not a prerequisite graph or an assessment model; never equate category count with course depth |
| [freeCodeCamp College Algebra with Python](https://www.freecodecamp.org/learn/college-algebra-with-python/) | one-semester sequencing, instructional videos, Colab notebooks, assignments, projects, and a personal calculator notebook | a computational notebook that grows with the course; recurring projects rather than isolated quizzes | it is algebra-first, so add vector/matrix, probability, inference, optimisation, and AI failure analysis |
| [TutorialsPoint Mathematics for ML](https://www.tutorialspoint.com/machine_learning/machine_learning_mathematics.htm) | an approachable overview of linear algebra, calculus, probability, and statistics, connected to ML terms such as SVD, Jacobians, gradients, and tensors | an answer-first orientation before formal depth | four headings are not enough: split derivation, numerical implementation, interpretation, and debugging into different units |
| [Coursera / DeepLearning.AI M4ML & DS](https://www.coursera.org/specializations/mathematics-for-machine-learning-and-data-science) | three applied courses—linear algebra, calculus, and probability/statistics—with Python labs; outcomes include rank, independence, PCA, gradient descent, distributions, confidence intervals, tests, MLE, and MAP | visual intuition plus Python labs and explicit outcome language | extend through numerical stability, conditioning, information theory, kernel methods, causality, and specialist branches |
| [Codecademy Math](https://www.codecademy.com/catalog/subject/math) | short focused courses and practice projects in linear algebra, differential calculus, probability, statistics, discrete maths, causal inference, regression, and proofs | atomic units, short practice, projects, cheatsheets, and a clear distinction between course and reference | do not let short estimated durations replace proof, derivation, or independent problem solving |
| [Udemy search](https://www.udemy.com/courses/search/?q=mathematics%20for%20machine%20learning) | a marketplace rather than a single canonical pathway; search results can vary by locale and catalogue state | use it only as evidence of learner demand for applied, bundled maths | it is not a stable source of sequence or quality standards |
| [MIT 18.06](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/) | a full undergraduate linear-algebra course with lectures, readings, problem sets, and exams; emphasis includes systems, vector spaces, determinants, eigenvalues, similarity, and positive-definite matrices | problem-set cadence and matrix depth before black-box library use | retain only AI-relevant applications; avoid importing unrelated theorem coverage as filler |
| [MIT 18.065](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/) | matrix methods tied directly to probability, statistics, optimisation, signal processing, and deep learning, with assignments and a final project | SVD/PCA/conditioning plus a signals branch and final project | make computations executable and tie every decomposition to an AI decision |
| [Stanford CS229 syllabus](https://cs229.stanford.edu/syllabus-new.html) | linear algebra and probability review plus linear/logistic regression, exponential families, Newton's method, kernels, neural nets, learning theory, PCA, Gaussian models, HMMs, GPs, optimisation, and projects | add kernels, exponential families, second-order optimisation, HMMs, and project-grade practice | do not hide prerequisite maths inside later model lessons |
| [Harvard Stat 110](https://stat110.hsites.harvard.edu/youtube) | a complete probability lecture sequence with counting, conditional probability, Bayes, distributions, LOTUS, covariance, joint/marginal/conditional distributions, transformations, Beta/Gamma, conditional expectation, Markov chains, and practice/solutions | probability needs lecture-level granularity, not a single survey page | retain AI-relevant depth and connect each concept to estimation, uncertainty, or sequential systems |

## Checklist changes made from this pass

The pass expands the prior 121-core / 27-specialist scope to **129 core / 28
specialist units**. The additions are intentionally atomic:

- **M0.9–M0.10:** arithmetic/rate fluency plus sequences, recurrences,
  polynomial/quadratic behaviour, and growth rates;
- **M3.12:** kernel matrices and the kernel trick;
- **M6.13:** conditional expectation and variance;
- **M7.15:** quantiles, order statistics, empirical distributions, and anomaly
  thresholds; M7.1 also gains Hypergeometric and Negative Binomial models;
- **M8.13:** causal inference foundations;
- **M9.9:** exponential families, sufficient statistics, and GLM intuition;
- **M10.11:** Newton, quasi-Newton, and coordinate-descent methods; and
- **S2.9:** Hidden Markov models, filtering, and decoding. S4.6 now explicitly
  covers do-calculus and identifiability limits after the core causal unit.

## Authoring implications

Use sources for curriculum shape, not as text to paraphrase. Each Oddversity
unit must independently teach the mechanism and retain the course contract:
four worked scenarios, derivation/proof intuition where appropriate, symbolic +
visual + computational views, a deliberately broken case, and observable
practice. The immediate authoring order remains algebra/notation, vector
geometry, single-variable calculus, and probability; the newly added M0.9–M0.10
now sit in that first batch rather than being deferred as “school maths.”
