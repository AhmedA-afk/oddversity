// The Forward Deployed Engineer path. Deliberately NOT a resequencing of the
// main curriculum: it is its own tree with its own categories (phases), sub-
// categories (modules) and page kinds, built from the research in
// ../../get_money_xD/fde/. Node status is derived at build time from whether a
// content file exists under src/content/fde/<phase>/<slug>.md — the list below
// is the plan, the disk is the truth, so nothing here can drift into a lie.

export type FdeKind = 'lesson' | 'lab' | 'drill' | 'bootcamp' | 'capstone' | 'reference';

export interface FdeNode {
  slug: string;
  title: string;
  kind: FdeKind;
  /** Short line for cards and the phase page. Content frontmatter overrides it. */
  blurb?: string;
}

export interface FdeModule {
  id: string;
  name: string;
  /** One sentence: what you can do after this module. */
  outcome: string;
  nodes: FdeNode[];
}

export interface FdePhase {
  id: string;
  n: string;
  name: string;
  /** Which of the four stages this phase belongs to. */
  stage: 1 | 2 | 3 | 4;
  /** Rough placement in the 36-week plan. */
  weeks: string;
  summary: string;
  /** Why an FDE needs this, in one line — the thing that differs from a generic SWE path. */
  fieldNote: string;
  modules: FdeModule[];
}

export const fdeRole = {
  id: 'forward-deployed-engineer',
  name: 'Forward Deployed Engineer',
  short: 'FDE',
  blurb: 'Zero to a hireable Forward Deployed Engineer: the engineer who ships inside the customer.',
  description:
    'A complete, independent path from no code to a hireable Forward Deployed Engineer. It is not the main curriculum resequenced. It has its own phases, its own drills, simulated customers to practise against, and capstones rebuilt from public FDE deployments. Written with the Indian market in view and the global one in scope.',
  /** The honest recommendation. See the hub page for the reasoning. */
  length: { months: 9, weeks: 36, hoursPerWeek: '12–15', totalHours: '≈ 500' },
  stages: [
    { n: 1, name: 'Foundations', weeks: 'Weeks 1–12', line: 'From nothing to "deployed a service unaided", sequenced for the field: SQL, shell, HTTP and debugging before algorithms.' },
    { n: 2, name: 'Build', weeks: 'Weeks 13–24', line: 'Engineering craft under a deadline, enterprise data, and AI application work where the eval comes before the build.' },
    { n: 3, name: 'The field', weeks: 'Weeks 25–32', line: "Deploy into someone else's environment, run discovery and bootcamps against simulated customers, turn one-offs into product." },
    { n: 4, name: 'Hireable', weeks: 'Weeks 33–36', line: 'The interview loops, the decomposition round, the take-home with a recorded walkthrough, and the evidence portfolio.' },
  ],
};

export const fdePhases: FdePhase[] = [
  {
    id: 'orientation',
    n: '00',
    name: 'The role, honestly',
    stage: 1,
    weeks: 'Week 1',
    summary: 'What a Forward Deployed Engineer actually does, where the title came from, what the postings ask for, what the critics say, and how this path is built.',
    fieldNote: 'Most people applying for the title cannot describe the one thing that separates it from a solutions engineer. You will be able to, in one sentence.',
    modules: [
      {
        id: 'what-it-is',
        name: 'What the job is',
        outcome: 'Describe the role, its history and its two archetypes accurately enough to survive a hiring manager.',
        nodes: [
          { slug: 'what-a-forward-deployed-engineer-does', title: 'What a Forward Deployed Engineer actually does', kind: 'lesson', blurb: 'The job in one paragraph, then the week that paragraph hides.' },
          { slug: 'delta-echo-dev-where-the-title-came-from', title: 'Delta, Echo, Dev: where the title came from', kind: 'lesson', blurb: 'Palantir invented it. The names, the reason, and how Foundry fell out of it.' },
          { slug: 'the-feedback-loop-is-the-job', title: 'The feedback loop is the job', kind: 'lesson', blurb: 'The single thing that separates an FDE from a consultant, and why it is usually the first thing companies drop.' },
          { slug: 'two-archetypes-applied-ai-and-platform', title: 'Two archetypes: Applied-AI FDE and platform FDE', kind: 'lesson', blurb: 'What 28 real postings split into, and which one this path prepares you for first.' },
          { slug: 'a-week-in-the-life-four-accounts', title: 'A week in the life, from four people who do it', kind: 'lesson', blurb: 'Palantir, OpenAI, Ramp, Cognition. Same title, very different weeks.' },
        ],
      },
      {
        id: 'the-market',
        name: 'The market, in India and globally',
        outcome: 'Know who hires, what they require, what it pays where that is public, and what is marketing.',
        nodes: [
          { slug: 'who-hires-fdes-and-what-they-require', title: 'Who hires FDEs and what they require', kind: 'lesson', blurb: 'The skills matrix from real postings: customer-facing and Python are near-universal; degrees mostly are not.' },
          { slug: 'the-indian-fde-market-what-is-real', title: 'The Indian FDE market: what is verifiable', kind: 'lesson', blurb: 'Sarvam, Razorpay, Databricks-India, the startups, the IT-services practices, and the claims that only appear on marketing sites.' },
          { slug: 'what-the-critics-get-right', title: 'What the critics get right', kind: 'lesson', blurb: '"Rebranded consultant", travel burnout, "you may code less". Read them before you commit nine months.' },
          { slug: 'pay-travel-and-the-experience-wall', title: 'Pay, travel, and the experience wall', kind: 'reference', blurb: 'Posted ranges only. Labs want 4–5+ years; where a zero-to-FDE learner can realistically land first.' },
        ],
      },
      {
        id: 'how-this-path-works',
        name: 'How this path works',
        outcome: 'Set up the evidence portfolio and the weekly rhythm you will keep for 36 weeks.',
        nodes: [
          { slug: 'why-nine-months-and-how-the-weeks-run', title: 'Why nine months, and how the weeks run', kind: 'lesson', blurb: 'The four stages, the weekly drill, the six bootcamps, the five capstones, and what to skip if you already code.' },
          { slug: 'the-evidence-portfolio', title: 'The evidence portfolio: every module leaves an artifact', kind: 'lesson', blurb: 'No course can manufacture production experience. This one is designed so the artifacts function as evidence anyway.' },
          { slug: 'setting-up-your-field-kit', title: 'Setting up your field kit', kind: 'lab', blurb: 'Laptop, accounts, one cloud free tier, a public repo, and the journal you will write in first person.' },
        ],
      },
    ],
  },
  {
    id: 'foundations',
    n: '01',
    name: 'Foundations, sequenced for the field',
    stage: 1,
    weeks: 'Weeks 2–12',
    summary: 'Python, SQL, the shell, Git, HTTP, containers, one cloud and enough networking to debug inside a customer network. Ordered by what an FDE uses daily, not by what a CS degree teaches first.',
    fieldNote: 'The FDE bar for these is debugging-shaped: window functions without Googling, tail and grep on a live log, a 401 versus a 403 versus a 502.',
    modules: [
      {
        id: 'python-for-the-field',
        name: 'Python for the field',
        outcome: 'Write a script that pulls paginated API data, handles auth, writes to a database, and survives a null or an encoding surprise.',
        nodes: [
          { slug: 'python-from-zero-the-first-week', title: 'Python from zero: the first week', kind: 'lesson' },
          { slug: 'data-types-and-the-nulls-that-bite', title: 'Data types, and the nulls that bite', kind: 'lesson' },
          { slug: 'functions-modules-and-a-project-layout', title: 'Functions, modules, and a project layout you can hand over', kind: 'lesson' },
          { slug: 'reading-and-writing-csv-json-and-excel', title: 'Reading and writing CSV, JSON and Excel without losing data', kind: 'lesson' },
          { slug: 'calling-a-paginated-api-with-auth', title: 'Calling a paginated API with auth, retries and a timeout', kind: 'lab' },
          { slug: 'virtual-environments-and-dependencies', title: 'Virtual environments and dependency files', kind: 'lesson' },
          { slug: 'errors-logging-and-not-swallowing-exceptions', title: 'Errors, logging, and never swallowing an exception', kind: 'lesson' },
          { slug: 'python-lab-the-nightly-export-script', title: 'Lab: the nightly export script that must not silently fail', kind: 'lab' },
        ],
      },
      {
        id: 'sql-without-googling',
        name: 'SQL you write without Googling',
        outcome: 'Answer "second-highest value per category" and "who churned last month" in SQL, from memory, against a schema you have never seen.',
        nodes: [
          { slug: 'tables-keys-and-the-relational-idea', title: 'Tables, keys, and the relational idea', kind: 'lesson' },
          { slug: 'select-where-group-by-having', title: 'SELECT, WHERE, GROUP BY, HAVING: the four you use every day', kind: 'lesson' },
          { slug: 'joins-and-why-your-row-count-tripled', title: 'Joins, and why your row count just tripled', kind: 'lesson' },
          { slug: 'window-functions-second-highest-per-category', title: 'Window functions: second-highest per category, running totals, gaps', kind: 'lesson' },
          { slug: 'ctes-and-reading-a-query-someone-else-wrote', title: 'CTEs, and reading a 200-line query someone else wrote', kind: 'lesson' },
          { slug: 'indexes-explain-and-the-slow-report', title: 'Indexes, EXPLAIN, and the report that takes forty minutes', kind: 'lesson' },
          { slug: 'reverse-engineering-a-legacy-schema', title: 'Lab: reverse-engineer a legacy schema into a data dictionary in a day', kind: 'lab' },
          { slug: 'sql-drill-bank', title: 'SQL drill bank: 30 questions in the shape interviewers ask', kind: 'reference' },
        ],
      },
      {
        id: 'shell-and-linux',
        name: 'The shell and Linux',
        outcome: 'Tail and grep a live log, find a runaway process, check what is listening on a port, read a systemd unit.',
        nodes: [
          { slug: 'the-terminal-is-where-the-truth-is', title: 'The terminal is where the truth is', kind: 'lesson' },
          { slug: 'files-permissions-and-the-user-you-are-not', title: 'Files, permissions, and the user you are not', kind: 'lesson' },
          { slug: 'grep-awk-tail-and-reading-a-log-under-pressure', title: 'grep, awk, tail -f: reading a log while someone watches', kind: 'lesson' },
          { slug: 'processes-ports-and-what-is-eating-the-cpu', title: 'Processes, ports, and what is eating the CPU', kind: 'lesson' },
          { slug: 'ssh-scp-and-working-on-a-box-you-do-not-own', title: 'ssh, scp, and working on a box you do not own', kind: 'lesson' },
          { slug: 'systemd-cron-and-the-job-that-runs-at-3am', title: 'systemd, cron, and the job that runs at 3am', kind: 'lesson' },
          { slug: 'shell-lab-diagnose-the-dead-service', title: 'Lab: diagnose the dead service from logs alone', kind: 'lab' },
        ],
      },
      {
        id: 'git-and-other-peoples-repos',
        name: "Git and other people's repos",
        outcome: "Branch, rebase, resolve a conflict, and open a clean pull request in a repository you did not create.",
        nodes: [
          { slug: 'git-the-mental-model', title: 'Git: the mental model that makes the commands obvious', kind: 'lesson' },
          { slug: 'branches-rebases-and-conflicts', title: 'Branches, rebases, and conflicts you resolve calmly', kind: 'lesson' },
          { slug: 'pull-requests-in-a-customers-repo', title: "Pull requests in a customer's repo: small, reviewable, reversible", kind: 'lesson' },
          { slug: 'git-lab-contribute-to-a-repo-you-have-never-seen', title: 'Lab: contribute a fix to a repo you have never seen', kind: 'lab' },
        ],
      },
      {
        id: 'http-apis-and-auth',
        name: 'HTTP, APIs and auth',
        outcome: 'Explain 401 vs 403 vs 502, walk through an OAuth 2.0 flow, and debug a webhook that never arrives.',
        nodes: [
          { slug: 'http-requests-responses-and-status-codes', title: 'HTTP: requests, responses, and what each status code is telling you', kind: 'lesson' },
          { slug: 'rest-json-and-designing-an-endpoint', title: 'REST, JSON, and designing an endpoint someone else will call', kind: 'lesson' },
          { slug: 'api-keys-oauth-and-the-token-that-expires', title: 'API keys, OAuth 2.0, and the token that expires at the worst time', kind: 'lesson' },
          { slug: 'webhooks-idempotency-and-retries', title: 'Webhooks, idempotency, and retries that do not double-charge', kind: 'lesson' },
          { slug: 'tls-certificates-and-the-corporate-proxy', title: 'TLS, certificates, and the corporate proxy that breaks everything', kind: 'lesson' },
          { slug: 'http-lab-build-and-consume-a-small-api', title: 'Lab: build a small API, then consume it from another machine', kind: 'lab' },
        ],
      },
      {
        id: 'containers-and-one-cloud',
        name: 'Containers and one cloud',
        outcome: 'Write a Dockerfile, run compose, stand up a VPC, an IAM role, a managed Postgres and a container service on one cloud, unaided.',
        nodes: [
          { slug: 'what-a-container-is-and-is-not', title: 'What a container is, and is not', kind: 'lesson' },
          { slug: 'dockerfiles-images-and-compose', title: 'Dockerfiles, images, and compose for a two-service app', kind: 'lesson' },
          { slug: 'one-cloud-accounts-iam-and-the-bill', title: 'One cloud: accounts, IAM, regions, and the bill', kind: 'lesson' },
          { slug: 'vpc-subnets-security-groups-in-plain-words', title: 'VPCs, subnets and security groups in plain words', kind: 'lesson' },
          { slug: 'managed-postgres-and-a-container-service', title: 'A managed Postgres and a container service', kind: 'lesson' },
          { slug: 'reading-a-helm-chart-before-you-write-one', title: 'Reading a Helm chart before you ever write one', kind: 'lesson' },
          { slug: 'cloud-lab-deploy-a-service-unaided', title: 'Lab: deploy a production-quality service yourself, unaided', kind: 'lab' },
        ],
      },
      {
        id: 'networking-inside-a-customer',
        name: "Networking inside a customer's network",
        outcome: 'Diagnose DNS, proxy, firewall and certificate problems from inside a network you do not control.',
        nodes: [
          { slug: 'dns-and-why-it-is-always-dns', title: 'DNS, and why it is always DNS', kind: 'lesson' },
          { slug: 'firewalls-proxies-and-allowlists', title: 'Firewalls, proxies and allowlists: what the customer will not tell you', kind: 'lesson' },
          { slug: 'networking-lab-the-service-that-works-on-your-laptop-only', title: 'Lab: the service that works on your laptop and nowhere else', kind: 'lab' },
        ],
      },
    ],
  },
  {
    id: 'craft',
    n: '02',
    name: 'Engineering craft under a deadline',
    stage: 2,
    weeks: 'Weeks 13–16',
    summary: 'Ship a service end to end, debug systems you have never seen, add reliability without ceremony, and learn the two FDE-specific skills nobody teaches: calibration and restraint.',
    fieldNote: 'You do all of this alone, in someone else\'s environment, with a demo on Thursday. The bar is the same as a product engineer\'s; the conditions are worse.',
    modules: [
      {
        id: 'ship-a-service-end-to-end',
        name: 'Ship a service end to end',
        outcome: 'Deliver a FastAPI or Node service with auth, tests, structured errors, retries, and a README someone else can run.',
        nodes: [
          { slug: 'anatomy-of-a-service-you-can-hand-over', title: 'Anatomy of a service you can hand over', kind: 'lesson' },
          { slug: 'tests-that-earn-their-keep', title: 'Tests that earn their keep on a two-week engagement', kind: 'lesson' },
          { slug: 'structured-errors-and-the-message-a-customer-reads', title: 'Structured errors, and the message the customer will actually read', kind: 'lesson' },
          { slug: 'typescript-enough-to-read-their-frontend', title: "TypeScript: enough to read and patch the customer's frontend", kind: 'lesson' },
          { slug: 'craft-lab-ticket-triage-service', title: 'Lab: the ticket-triage service, shipped with a README', kind: 'lab' },
        ],
      },
      {
        id: 'debugging-unfamiliar-systems',
        name: 'Debugging systems you have never seen',
        outcome: 'Given a slow endpoint you have never seen, walk monitoring → logs → profiling to a fix, narrating as you go.',
        nodes: [
          { slug: 'the-debugging-loop-observe-hypothesise-bisect', title: 'The debugging loop: observe, hypothesise, bisect', kind: 'lesson' },
          { slug: 'reading-a-codebase-in-an-afternoon', title: 'Reading a codebase in an afternoon', kind: 'lesson' },
          { slug: 'the-slow-endpoint-walkthrough', title: 'Walkthrough: the slow endpoint, from dashboard to diff', kind: 'lesson' },
          { slug: 'debugging-lab-the-vendor-changed-a-field-name', title: 'Lab: the vendor changed a field name overnight', kind: 'lab' },
        ],
      },
      {
        id: 'reliability-and-observability',
        name: 'Reliability and observability without ceremony',
        outcome: 'Add retries and idempotency to an integration, write a runbook, instrument enough telemetry to find a failure after launch.',
        nodes: [
          { slug: 'retries-idempotency-and-backoff', title: 'Retries, idempotency and backoff', kind: 'lesson' },
          { slug: 'logs-metrics-traces-what-to-emit', title: 'Logs, metrics, traces: what to emit so 3am you can find it', kind: 'lesson' },
          { slug: 'runbooks-and-the-ceo-demo-crisis', title: 'Runbooks, and staying calm during the CEO demo crisis', kind: 'lesson' },
          { slug: 'incident-write-up-template', title: 'The incident write-up: a template and a worked example', kind: 'reference' },
        ],
      },
      {
        id: 'calibration-and-restraint',
        name: 'Calibration and restraint',
        outcome: 'Decide, and defend, when a one-time SQL query beats a two-week configurable engine, and when not to build the thing at all.',
        nodes: [
          { slug: 'script-or-architecture-the-calibration-call', title: 'Script or architecture: the calibration call', kind: 'lesson' },
          { slug: 'restraint-when-ai-makes-building-cheap', title: 'Restraint, now that building is cheap', kind: 'lesson' },
          { slug: 'calibration-drill-ten-requests-ten-sizes', title: 'Drill: ten customer requests, size each one in two minutes', kind: 'drill' },
        ],
      },
    ],
  },
  {
    id: 'data',
    n: '03',
    name: 'Enterprise data and integration',
    stage: 2,
    weeks: 'Weeks 17–20',
    summary: 'Most enterprise problems are access, cleaning and joining, not analysis. ETL, messy exports, connectors to SharePoint and Salesforce and SAP and PDFs, domain modelling, SSO and permissions, and the residency rules in India and abroad.',
    fieldNote: 'No generic curriculum teaches "the customer\'s SharePoint is the source of truth and it is a mess". Every FDE account does.',
    modules: [
      {
        id: 'etl-and-messy-data',
        name: 'ETL and messy data',
        outcome: "Build a pipeline that replaces an analyst's 45-minute daily Excel routine across three systems, and survives the empty date column.",
        nodes: [
          { slug: 'extract-transform-load-the-honest-version', title: 'Extract, transform, load: the honest version', kind: 'lesson' },
          { slug: 'timezones-encodings-and-the-empty-date-column', title: 'Timezones, encodings, and the empty date column that cost 14 TB', kind: 'lesson' },
          { slug: 'bronze-silver-gold-medallion-layers', title: 'Bronze, silver, gold: medallion layers for a small team', kind: 'lesson' },
          { slug: 'replacing-the-excel-macro', title: 'Lab: replace the Excel macro nobody understands', kind: 'lab' },
        ],
      },
      {
        id: 'enterprise-connectors',
        name: 'Enterprise connectors',
        outcome: 'Integrate with a document store, a CRM, an ERP export, a legacy database and a folder of PDFs, each with its own way of lying.',
        nodes: [
          { slug: 'sharepoint-drive-and-document-stores', title: 'SharePoint, Drive, and document stores as a source of truth', kind: 'lesson' },
          { slug: 'salesforce-and-crm-objects', title: 'Salesforce and CRM objects: the fields that are always wrong', kind: 'lesson' },
          { slug: 'sap-erp-exports-and-the-flat-file', title: 'SAP and ERP exports: living with the flat file', kind: 'lesson' },
          { slug: 'pdfs-scans-and-ocr-in-indian-enterprises', title: 'PDFs, scans and OCR: the Indian enterprise reality', kind: 'lesson' },
          { slug: 'connectors-lab-three-sources-one-table', title: 'Lab: three sources, one clean table, one pipeline', kind: 'lab' },
        ],
      },
      {
        id: 'domain-modelling',
        name: 'Domain and ontology modelling',
        outcome: "Model a customer's business as entities, properties and links before touching an app, and explain it back to them.",
        nodes: [
          { slug: 'entities-properties-links-the-ontology-idea', title: 'Entities, properties, links: the ontology idea', kind: 'lesson' },
          { slug: 'modelling-a-hospital-a-bank-a-factory', title: 'Modelling a hospital, a bank, a factory', kind: 'lesson' },
          { slug: 'domain-lab-model-a-business-from-its-exports', title: 'Lab: model a business from its exports alone', kind: 'lab' },
        ],
      },
      {
        id: 'identity-permissions-residency',
        name: 'Identity, permissions and residency',
        outcome: 'Wire SSO and role-based access so an advisor sees only their book, and know what the DPDP Act, GDPR and HIPAA change about your design.',
        nodes: [
          { slug: 'sso-saml-oidc-and-the-customers-idp', title: "SSO, SAML, OIDC, and the customer's identity provider", kind: 'lesson' },
          { slug: 'rbac-row-level-security-and-who-sees-what', title: 'RBAC, row-level security, and who sees what', kind: 'lesson' },
          { slug: 'data-residency-dpdp-gdpr-hipaa', title: 'Data residency: DPDP Act, GDPR, HIPAA, and what each changes', kind: 'lesson' },
          { slug: 'multi-party-data-competitors-on-one-platform', title: 'Multi-party data: competitors on one platform', kind: 'lesson' },
          { slug: 'data-without-movement-apis-and-mcp-as-a-data-layer', title: 'Data without movement: APIs and MCP as the data layer', kind: 'lesson' },
        ],
      },
    ],
  },
  {
    id: 'ai',
    n: '04',
    name: 'AI application engineering, eval-first',
    stage: 2,
    weeks: 'Weeks 21–24',
    summary: 'Prompts, structured outputs, tools and agents, MCP, permissioned RAG, guardrails, cost and model choice. The load-bearing skill is the eval you build with the domain expert before you build anything else.',
    fieldNote: 'The distinguishing FDE competence is not "can build RAG". It is "can build the eval that proves the RAG is good enough for a regulator".',
    modules: [
      {
        id: 'evals-first',
        name: 'Evals first',
        outcome: 'Before building, create a labelled eval set with a domain expert, run a ten-example feasibility test, and choose a metric the customer accepts.',
        nodes: [
          { slug: 'why-the-eval-comes-before-the-build', title: 'Why the eval comes before the build', kind: 'lesson' },
          { slug: 'labelling-twenty-examples-with-a-domain-expert', title: 'Labelling twenty examples with a domain expert', kind: 'lesson' },
          { slug: 'the-ten-example-feasibility-test', title: 'The ten-example feasibility test', kind: 'lesson' },
          { slug: 'metrics-the-customer-will-accept', title: 'Metrics the customer will accept, and the ones they will not', kind: 'lesson' },
          { slug: 'evals-lab-build-the-harness-for-a-claims-triage-bot', title: 'Lab: build the eval harness for a claims-triage assistant', kind: 'lab' },
        ],
      },
      {
        id: 'prompts-and-structure',
        name: 'Prompts, structure and tools',
        outcome: 'Parameterise instructions instead of hand-writing four hundred, get JSON you can validate, and give an agent the tools an expert would use.',
        nodes: [
          { slug: 'how-a-language-model-actually-answers', title: 'How a language model actually answers, in the words you need', kind: 'lesson' },
          { slug: 'system-prompts-and-parameterised-instructions', title: 'System prompts and parameterised instructions', kind: 'lesson' },
          { slug: 'structured-outputs-you-can-validate', title: 'Structured outputs you can validate', kind: 'lesson' },
          { slug: 'tool-calling-and-the-tools-an-expert-would-use', title: 'Tool calling, and the tools an expert would use', kind: 'lesson' },
          { slug: 'agents-loops-stop-conditions-and-fallbacks', title: 'Agents: loops, stop conditions, and safe fallbacks', kind: 'lesson' },
          { slug: 'mcp-servers-and-when-a-plain-function-is-simpler', title: 'MCP servers, and when a plain function is simpler', kind: 'lesson' },
          { slug: 'provider-sdks-anthropic-and-openai-side-by-side', title: 'Provider SDKs: Anthropic and OpenAI side by side', kind: 'reference' },
        ],
      },
      {
        id: 'retrieval-with-permissions',
        name: 'Retrieval that respects permissions',
        outcome: 'Build hybrid retrieval over enterprise documents where every result is one the user was allowed to see.',
        nodes: [
          { slug: 'rag-in-one-page-and-where-it-breaks', title: 'RAG in one page, and where it breaks', kind: 'lesson' },
          { slug: 'chunking-embedding-and-hybrid-search', title: 'Chunking, embeddings and hybrid search', kind: 'lesson' },
          { slug: 'permission-aware-retrieval', title: 'Permission-aware retrieval: filter before you rank', kind: 'lesson' },
          { slug: 'rag-lab-permissioned-search-over-a-policy-corpus', title: 'Lab: permissioned search over a policy corpus', kind: 'lab' },
        ],
      },
      {
        id: 'guardrails-cost-and-choice',
        name: 'Guardrails, cost and model choice',
        outcome: 'Keep hard business rules in code, never in the model; pick a model and context strategy for call-centre volume; know when fine-tuning earns its cost.',
        nodes: [
          { slug: 'deterministic-rules-probabilistic-model', title: 'Deterministic rules, probabilistic model: where the line goes', kind: 'lesson' },
          { slug: 'guardrails-that-do-not-break-the-demo', title: 'Guardrails that do not break the demo', kind: 'lesson' },
          { slug: 'cost-latency-and-the-call-centre-budget', title: 'Cost, latency, and the call-centre budget', kind: 'lesson' },
          { slug: 'rag-or-fine-tune-the-decision-with-numbers', title: 'RAG or fine-tune: the decision, with numbers', kind: 'lesson' },
          { slug: 'indic-languages-voice-and-whatsapp-surfaces', title: 'Indic languages, voice, and WhatsApp as the interface', kind: 'lesson' },
        ],
      },
    ],
  },
  {
    id: 'deploy',
    n: '05',
    name: "Deploying into someone else's environment",
    stage: 3,
    weeks: 'Weeks 25–27',
    summary: 'A VPC that is not yours, a Kubernetes cluster you reach through Helm, an on-prem box, an air-gapped enclave, a security questionnaire and a procurement cycle. The tier almost no course covers.',
    fieldNote: "Generic engineers deploy to their own company's cloud. FDEs deploy to a stranger's, sometimes with no internet.",
    modules: [
      {
        id: 'vpc-byoc-and-customer-kubernetes',
        name: 'VPC, BYOC and customer Kubernetes',
        outcome: "Deploy the same artifact into a customer-managed VPC, then into their Kubernetes cluster via Helm with their IAM and their registry.",
        nodes: [
          { slug: 'the-spectrum-from-saas-to-air-gapped', title: 'The spectrum: SaaS, VPC, BYOC, on-prem, air-gapped', kind: 'lesson' },
          { slug: 'deploying-into-a-customer-vpc', title: 'Deploying into a customer VPC', kind: 'lesson' },
          { slug: 'helm-into-a-cluster-you-do-not-administer', title: 'Helm into a cluster you do not administer', kind: 'lesson' },
          { slug: 'secrets-service-accounts-and-their-registry', title: 'Secrets, service accounts, and their registry', kind: 'lesson' },
          { slug: 'deploy-lab-same-artifact-three-environments', title: 'Lab: the same artifact, three environments', kind: 'lab' },
        ],
      },
      {
        id: 'on-prem-and-air-gapped',
        name: 'On-prem and air-gapped',
        outcome: 'Pre-stage every dependency, signed and frozen, into an enclave, and run the tool-execution layer inside the perimeter.',
        nodes: [
          { slug: 'what-air-gapped-actually-requires', title: 'What an air-gapped deployment actually requires', kind: 'lesson' },
          { slug: 'frozen-dependency-bundles-and-offline-installs', title: 'Frozen dependency bundles and offline installs', kind: 'lesson' },
          { slug: 'self-hosted-execution-inside-the-perimeter', title: 'Self-hosted execution inside the perimeter, model outside', kind: 'lesson' },
          { slug: 'air-gap-lab-install-on-a-vm-with-no-internet', title: 'Lab: install on a VM with no internet', kind: 'lab' },
        ],
      },
      {
        id: 'compliance-security-procurement',
        name: 'Compliance, security review and procurement',
        outcome: 'Survive a security questionnaire, explain what SOC 2, HIPAA, FedRAMP, RBI and DPDP change about architecture, and understand why the pilot takes four months after the build takes six weeks.',
        nodes: [
          { slug: 'soc2-hipaa-fedramp-rbi-dpdp-what-each-changes', title: 'SOC 2, HIPAA, FedRAMP, RBI, DPDP: what each changes for you', kind: 'lesson' },
          { slug: 'the-security-questionnaire-walkthrough', title: 'The security questionnaire: a walkthrough with answers', kind: 'lesson' },
          { slug: 'procurement-legal-and-the-four-month-pilot', title: 'Procurement, legal, and the four-month pilot', kind: 'lesson' },
          { slug: 'continuous-delivery-into-many-customer-sites', title: 'Continuous delivery into many customer sites', kind: 'lesson' },
          { slug: 'compliance-lab-mock-security-review', title: 'Lab: pass a mock security review', kind: 'lab' },
        ],
      },
    ],
  },
  {
    id: 'field',
    n: '06',
    name: 'The customer: discovery to adoption',
    stage: 3,
    weeks: 'Weeks 28–31',
    summary: 'Discovery, decomposition, scoping, statements of work, bootcamps, demos, stakeholders, politics, saying no, executive communication and the six-month trust gap. Practised against simulated customers, reviewed against rubrics.',
    fieldNote: 'Every FDE interview tests this tier. No engineering degree teaches it. The difference from consulting: you ship code, not slides.',
    modules: [
      {
        id: 'discovery-and-decomposition',
        name: 'Discovery and decomposition',
        outcome: 'Map the actual workflow rather than the documented one, and take a vague problem to a walking-skeleton plan in under an hour.',
        nodes: [
          { slug: 'discovery-how-do-you-do-it-today', title: 'Discovery: "how do you do it today?"', kind: 'lesson' },
          { slug: 'the-decomposition-method', title: 'The decomposition method: clarify, stakeholders, inputs, break down, skeleton', kind: 'lesson' },
          { slug: 'the-first-two-weeks-on-site-script', title: 'The first two weeks on site: a script', kind: 'lesson' },
          { slug: 'discovery-lab-interview-the-simulated-customer', title: 'Lab: interview the simulated customer', kind: 'lab' },
        ],
      },
      {
        id: 'scoping-sows-and-bootcamps',
        name: 'Scoping, SOWs and bootcamps',
        outcome: 'Write success criteria, a statement of work, an ROI one-pager and a UAT plan, then run a five-day bootcamp from customer data to a working demo.',
        nodes: [
          { slug: 'success-criteria-before-scope', title: 'Success criteria before scope', kind: 'lesson' },
          { slug: 'writing-a-statement-of-work', title: 'Writing a statement of work that protects both sides', kind: 'lesson' },
          { slug: 'roi-one-pager-and-uat-plan', title: 'The ROI one-pager and the UAT plan', kind: 'lesson' },
          { slug: 'the-five-day-bootcamp-format', title: 'The five-day bootcamp format', kind: 'lesson' },
          { slug: 'demoing-to-the-people-who-will-use-it', title: 'Demoing to the people who will use it', kind: 'lesson' },
        ],
      },
      {
        id: 'stakeholders-and-saying-no',
        name: 'Stakeholders, politics, and saying no',
        outcome: 'Find the champion in week one, manage IT and the business owner separately, and convert a three-month custom demand into a configuration change they prefer.',
        nodes: [
          { slug: 'finding-the-champion-and-the-blocker', title: 'Finding the champion and the blocker', kind: 'lesson' },
          { slug: 'it-security-and-the-business-owner-three-conversations', title: 'IT, security, and the business owner: three conversations', kind: 'lesson' },
          { slug: 'saying-no-with-an-alternative', title: 'Saying no with an alternative', kind: 'lesson' },
          { slug: 'owning-outcomes-without-authority', title: 'Owning outcomes without authority', kind: 'lesson' },
        ],
      },
      {
        id: 'communication-and-adoption',
        name: 'Communication and adoption',
        outcome: 'Explain the same problem as business impact to a CEO and as detail to an engineer, in the register the room uses, and turn a working system into a used one.',
        nodes: [
          { slug: 'executive-communication-the-pyramid', title: 'Executive communication: the pyramid, then the detail', kind: 'lesson' },
          { slug: 'registers-english-hinglish-and-the-boardroom', title: 'Registers: English, Hinglish, and the boardroom', kind: 'lesson' },
          { slug: 'the-six-month-trust-gap', title: 'The six-month trust gap: pilots, training, and adoption', kind: 'lesson' },
          { slug: 'handover-that-leaves-capability-behind', title: 'Handover that leaves capability behind', kind: 'lesson' },
        ],
      },
    ],
  },
  {
    id: 'product',
    n: '07',
    name: 'From one customer to product',
    stage: 3,
    weeks: 'Week 32',
    summary: 'The loop that makes the job legitimate: write down what you learned, decide what generalises, feed it back, and make yourself unnecessary for the same problem next time.',
    fieldNote: 'Shipping without extracting the pattern makes you a very expensive contractor. Extracting patterns without shipping makes you an analyst.',
    modules: [
      {
        id: 'the-feedback-loop-in-practice',
        name: 'The feedback loop in practice',
        outcome: 'Keep a weekly customer-learning document, write a generalise-vs-one-off memo per project, and hit reuse targets engagement over engagement.',
        nodes: [
          { slug: 'what-i-learned-from-customers-this-week', title: 'The "what I learned from customers" document', kind: 'lesson' },
          { slug: 'generalise-or-one-off-the-memo', title: 'Generalise or one-off: the memo', kind: 'lesson' },
          { slug: 'the-custom-to-self-serve-funnel', title: 'The custom-to-self-serve funnel', kind: 'lesson' },
          { slug: 'feeding-research-not-just-product', title: 'Feeding research, not just product', kind: 'lesson' },
          { slug: 'product-lab-write-the-memo-for-your-capstone', title: 'Lab: write the memo for your own capstone', kind: 'lab' },
        ],
      },
    ],
  },
  {
    id: 'career',
    n: '08',
    name: 'Getting hired, in India and globally',
    stage: 4,
    weeks: 'Weeks 33–36',
    summary: 'The loops company by company, the decomposition round, the take-home with a recorded walkthrough, the portfolio, the "I not we" rule, the India routes, the visa reality, and your first 90 days.',
    fieldNote: 'Labs want four to five years. The realistic first target from zero is an associate or startup FDE seat, or a solutions-engineer seat you turn into one.',
    modules: [
      {
        id: 'the-loops',
        name: 'The interview loops',
        outcome: 'Know what each loop tests, what candidates report, and where people are cut.',
        nodes: [
          { slug: 'palantir-fdse-loop-decomposition-and-learning', title: 'The Palantir FDSE loop: decomposition and learning rounds', kind: 'lesson' },
          { slug: 'openai-anthropic-databricks-loops', title: 'OpenAI, Anthropic and Databricks: take-home, design, values', kind: 'lesson' },
          { slug: 'startup-loops-and-the-airline-cto-case', title: 'Startup loops, and the "you are the CTO of an airline" case', kind: 'lesson' },
          { slug: 'what-interviewers-say-they-look-for', title: 'What interviewers say they look for', kind: 'lesson' },
        ],
      },
      {
        id: 'proof-of-work',
        name: 'Proof of work',
        outcome: 'Present one deployed, customer-shaped system with evals and rollback, written up in first person, with a recorded walkthrough.',
        nodes: [
          { slug: 'the-take-home-with-a-recorded-walkthrough', title: 'The take-home with a recorded walkthrough', kind: 'lesson' },
          { slug: 'the-first-person-case-study', title: 'The first-person case study: "I", not "we"', kind: 'lesson' },
          { slug: 'the-portfolio-that-shows-outcomes', title: 'The portfolio that shows outcomes, not features', kind: 'lesson' },
          { slug: 'resume-and-linkedin-for-an-fde-seat', title: 'Résumé and LinkedIn for an FDE seat', kind: 'lesson' },
        ],
      },
      {
        id: 'india-routes-and-the-first-90-days',
        name: 'India routes, offers, and the first 90 days',
        outcome: 'Target the seats that exist, negotiate from posted data, and run a 30/60/90 that ends with a reusable asset.',
        nodes: [
          { slug: 'india-routes-platform-vendors-startups-remote', title: 'India routes: platform vendors, startups, remote with overlap', kind: 'lesson' },
          { slug: 'visa-relocation-and-the-offer-that-got-pulled', title: 'Visa, relocation, and the offer that got pulled', kind: 'lesson' },
          { slug: 'negotiating-from-posted-data', title: 'Negotiating from posted data', kind: 'lesson' },
          { slug: 'your-first-90-days-as-an-fde', title: 'Your first 90 days as an FDE', kind: 'lesson' },
        ],
      },
    ],
  },
  {
    id: 'practice',
    n: '09',
    name: 'Field practice',
    stage: 2,
    weeks: 'Weekly from week 8',
    summary: 'The cross-cutting phase. A decomposition drill every week, six simulated-customer bootcamps, and five eval-first capstones rebuilt from public FDE deployments. This is where the evidence portfolio comes from.',
    fieldNote: 'No existing resource supplies a customer to practise against. These are the customers.',
    modules: [
      {
        id: 'decomposition-drills',
        name: 'Decomposition drill bank',
        outcome: 'Take an ambiguous enterprise problem to a scoped, staged plan in 45 minutes, against a rubric, every week.',
        nodes: [
          { slug: 'how-to-run-a-decomposition-drill', title: 'How to run a decomposition drill, and the rubric', kind: 'reference' },
          { slug: 'drill-01-the-bank-branch-onboarding-backlog', title: 'Drill 01: the bank branch onboarding backlog', kind: 'drill' },
          { slug: 'drill-02-the-hospital-discharge-delays', title: 'Drill 02: the hospital discharge delays', kind: 'drill' },
          { slug: 'drill-03-the-textile-exporter-tariff-shock', title: 'Drill 03: the textile exporter and the tariff shock', kind: 'drill' },
          { slug: 'drill-04-the-payments-merchant-dispute-queue', title: 'Drill 04: the payments merchant dispute queue', kind: 'drill' },
          { slug: 'drill-05-the-law-firm-document-review', title: 'Drill 05: the law firm document review', kind: 'drill' },
          { slug: 'drill-06-the-state-scheme-grievance-portal', title: 'Drill 06: the state scheme grievance portal', kind: 'drill' },
          { slug: 'drill-07-the-us-clinic-prior-authorisations', title: 'Drill 07: the US clinic prior authorisations', kind: 'drill' },
          { slug: 'drill-08-the-airline-operations-reschedule', title: 'Drill 08: the airline operations reschedule', kind: 'drill' },
          { slug: 'drill-09-the-semiconductor-test-failures', title: 'Drill 09: the semiconductor overnight test failures', kind: 'drill' },
          { slug: 'drill-10-the-insurer-claims-triage', title: 'Drill 10: the insurer claims triage', kind: 'drill' },
          { slug: 'drill-11-the-logistics-fleet-exceptions', title: 'Drill 11: the logistics fleet exceptions', kind: 'drill' },
          { slug: 'drill-12-the-defence-supplier-air-gapped-ask', title: 'Drill 12: the defence supplier air-gapped ask', kind: 'drill' },
        ],
      },
      {
        id: 'simulated-customers',
        name: 'Simulated-customer bootcamps',
        outcome: 'Run a one-to-five-day bootcamp from messy exports and a stakeholder cast to a working demo and a decision memo, six times.',
        nodes: [
          { slug: 'how-the-simulated-customers-work', title: 'How the simulated customers work', kind: 'reference' },
          { slug: 'bootcamp-01-meridian-cooperative-bank', title: 'Bootcamp 01: Meridian Co-operative Bank (KYC backlog)', kind: 'bootcamp' },
          { slug: 'bootcamp-02-arogya-hospital-group', title: 'Bootcamp 02: Arogya Hospital Group (bed flow)', kind: 'bootcamp' },
          { slug: 'bootcamp-03-suryatex-manufacturing', title: 'Bootcamp 03: SuryaTex Manufacturing (quality and supply)', kind: 'bootcamp' },
          { slug: 'bootcamp-04-northlake-wealth-us', title: 'Bootcamp 04: Northlake Wealth, US (advisor research)', kind: 'bootcamp' },
          { slug: 'bootcamp-05-halden-logistics-eu', title: 'Bootcamp 05: Halden Logistics, EU (GDPR and exceptions)', kind: 'bootcamp' },
          { slug: 'bootcamp-06-district-administration', title: 'Bootcamp 06: a district administration (grievances, on-prem)', kind: 'bootcamp' },
        ],
      },
      {
        id: 'capstones',
        name: 'Eval-first capstones',
        outcome: 'Ship five customer-shaped systems, each with a domain-expert eval before the build and an adoption plan after, rebuilt from public FDE deployments.',
        nodes: [
          { slug: 'how-capstones-are-graded', title: 'How capstones are graded', kind: 'reference' },
          { slug: 'capstone-01-permissioned-research-assistant', title: 'Capstone 01: the permissioned research assistant (after Morgan Stanley)', kind: 'capstone' },
          { slug: 'capstone-02-ci-failure-triage-agent', title: 'Capstone 02: the CI failure triage agent (after the semiconductor case)', kind: 'capstone' },
          { slug: 'capstone-03-supply-chain-agent-with-rules-in-code', title: 'Capstone 03: the supply-chain agent with rules in code', kind: 'capstone' },
          { slug: 'capstone-04-policy-driven-support-agent', title: 'Capstone 04: the policy-driven support agent (after Klarna)', kind: 'capstone' },
          { slug: 'capstone-05-hospital-operations-ontology', title: 'Capstone 05: the hospital operations ontology (after the NHS platform)', kind: 'capstone' },
        ],
      },
    ],
  },
];

/** Week-by-week plan. Each row points at phases; drills run weekly from week 8. */
export const fdeSchedule: Array<{ weeks: string; focus: string; phases: string[]; practice?: string }> = [
  { weeks: '1', focus: 'Orientation, field kit, first journal entry', phases: ['orientation'] },
  { weeks: '2–5', focus: 'Python for the field, SQL you write without Googling', phases: ['foundations'] },
  { weeks: '6–8', focus: 'Shell and Linux, Git in other people\'s repos, HTTP and auth', phases: ['foundations'], practice: 'First decomposition drill in week 8' },
  { weeks: '9–12', focus: 'Containers, one cloud, networking; deploy a service unaided', phases: ['foundations'], practice: 'Weekly drill' },
  { weeks: '13–16', focus: 'Engineering craft: ship, debug, make reliable, calibrate', phases: ['craft'], practice: 'Weekly drill · Bootcamp 01' },
  { weeks: '17–20', focus: 'Enterprise data, connectors, domain modelling, identity and residency', phases: ['data'], practice: 'Weekly drill · Bootcamp 02' },
  { weeks: '21–24', focus: 'AI application engineering, eval first', phases: ['ai'], practice: 'Weekly drill · Capstones 01 and 04' },
  { weeks: '25–27', focus: "Deploying into someone else's environment", phases: ['deploy'], practice: 'Weekly drill · Bootcamp 03 · Capstone 02' },
  { weeks: '28–31', focus: 'The customer: discovery to adoption', phases: ['field'], practice: 'Bootcamps 04, 05 and 06 · Capstone 03' },
  { weeks: '32', focus: 'From one customer to product', phases: ['product'], practice: 'Capstone 05 · memos for every capstone' },
  { weeks: '33–36', focus: 'Getting hired: loops, take-home, portfolio, routes', phases: ['career'], practice: 'Mock loops from the drill bank' },
];

export function getFdePhase(id: string): FdePhase | undefined {
  return fdePhases.find((p) => p.id === id);
}

export function fdeNodeCount(): number {
  return fdePhases.reduce((n, p) => n + p.modules.reduce((m, mod) => m + mod.nodes.length, 0), 0);
}

export const fdeKindLabel: Record<FdeKind, string> = {
  lesson: 'Lesson',
  lab: 'Lab',
  drill: 'Drill',
  bootcamp: 'Bootcamp',
  capstone: 'Capstone',
  reference: 'Reference',
};
