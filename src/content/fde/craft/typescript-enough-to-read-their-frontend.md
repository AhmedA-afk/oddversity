---
title: "TypeScript: enough to read and patch the customer's frontend"
phase: craft
module: ship-a-service-end-to-end
kind: lesson
summary: You are a Python engineer and on Wednesday the customer asks you to add one field to their React screen. This is the minimum TypeScript and React you need to find that code, change it, run it, and not break anything else.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Read a TypeScript function signature, a type alias and a compiler error without guessing.
  - Locate the component behind a visible string in an unfamiliar React app in under ten minutes.
  - "Make and verify five common patches: add a field, fix a date render, surface an API error, add a loading state, change an API base URL."
  - Get a customer's frontend running behind a corporate npm registry.
artifact: "A patched fork of a small open-source React app: one added field, one error state wired to a structured API error, and a short note in your journal on how you located the code."
sources:
  - "https://job-boards.greenhouse.io/anthropic/jobs/5302966008"
  - "https://www.welcometothejungle.com/en/companies/cohere/jobs/forward-deployed-engineer_fr_jfjwbzcr"
  - "https://c3.ai/job-description/8581326002?gh_jid=8581326002"
---

Across the twenty-eight forward deployed postings analysed for this path, TypeScript or JavaScript is named in ten. Anthropic's posting asks for Python plus, ideally, TypeScript or Java. Cohere's asks you to own a use case end to end "including frontend work when needed". C3.ai lists React, Redux, Vue or Angular as a nice-to-have alongside JavaScript and Python. Vercel is the only one that wants a real frontend specialist.

That distribution tells you exactly how much to learn. You are not being hired to build their frontend. You are being hired so that when the workflow you are deploying needs one more column on a screen, the answer is "give me an hour" and not "that will need their web team, who are booked until November".

This page is that hour's worth of TypeScript.

## What you actually need

Six capabilities, in order of how often you will use them:

1. Read a type and a function signature.
2. Find the component that renders a thing you can see.
3. Change what is displayed.
4. Handle a loading state and an error state.
5. Change where the app calls your API.
6. Get the thing running locally inside their network.

Everything else is optional.

## Python to TypeScript, translated

| Python | TypeScript | Note |
|---|---|---|
| `def f(x: int) -> str:` | `function f(x: number): string {` | One number type. No int/float split. |
| `x: str \| None` | `x: string \| null` | And `x?: string` means the key may be absent entirely |
| `@dataclass` / Pydantic model | `interface Ticket { ... }` or `type Ticket = { ... }` | Types are erased at runtime. Nothing validates them. |
| `list[str]` | `string[]` | |
| `dict[str, int]` | `Record<string, number>` | |
| `Enum` | union of literals: `"p1" \| "p2"` | Idiomatic and cheaper than an enum |
| `async def` / `await` | `async function` / `await` | Same mental model |
| `Coroutine` | `Promise<T>` | `Promise<Ticket[]>` is "eventually an array of tickets" |
| `Any` | `any` (avoid) or `unknown` (safe) | `unknown` forces a check before use |
| `cast(...)` | `value as Ticket` | A lie you are telling the compiler. Grep for it. |
| `None` | `null` and `undefined` | Two of them, and they are different |

The `null` versus `undefined` split is the one that catches Python engineers. `undefined` means "this key was never set". `null` means "this key was set to nothing". An API returning `null` for a missing name and a React state initialised to `undefined` will both render as blank and behave differently in `if` checks. When patching, prefer `if (x == null)` with two equals, which is the one place in JavaScript where loose equality is idiomatic: it catches both.

## Reading a type

```ts
interface Ticket {
  id: string;
  subject: string;
  priority: "p1" | "p2" | "p3" | "p4";
  assignee?: string;          // may be absent
  closedAt: string | null;    // present, may be null
  tags: string[];
}

async function fetchTickets(queue: string): Promise<Ticket[]> { /* ... */ }
```

Read it aloud: "a Ticket has an id and a subject which are strings, a priority which is one of four exact strings, an assignee which may not be there, a closedAt which is either a string or null, and tags which is an array of strings. fetchTickets takes a queue string and eventually gives back an array of Tickets."

The critical thing a Python engineer must internalise: **none of this is enforced at runtime**. TypeScript types vanish when the code is compiled. If your API returns `priority: "P1"` in capitals, the type says it cannot happen and the app will happily render `P1` and break the switch statement three components down. Types describe intent, not reality. Reality is what your service sends.

## Reading a compiler error

The error you will see most:

```
Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
```

Translation: something might be null and you used it as if it definitely was not. The fix is a check, not a cast:

```ts
// wrong: silences the compiler, crashes at runtime
const label = ticket.closedAt as string;

// right
const label = ticket.closedAt ? formatDate(ticket.closedAt) : "Open";
```

The second most common:

```
Property 'slaBreached' does not exist on type 'Ticket'.
```

You added a field to your API response and did not add it to the interface. Add it to the interface.

## React, for someone who writes Python

A React component is a function that returns markup. Props are keyword arguments. That is ninety per cent of it.

```tsx
type TicketRowProps = {
  ticket: Ticket;
  onSelect: (id: string) => void;
};

export function TicketRow({ ticket, onSelect }: TicketRowProps) {
  return (
    <tr onClick={() => onSelect(ticket.id)}>
      <td>{ticket.id}</td>
      <td>{ticket.subject}</td>
      <td>{ticket.priority.toUpperCase()}</td>
    </tr>
  );
}
```

Three rules that explain most of what confuses newcomers:

- **The function runs again every time state changes.** It is not a constructor. Do not put a network call directly in the body; it will fire on every render.
- **State is a value plus a setter.** `const [tickets, setTickets] = useState<Ticket[]>([])`. Calling the setter schedules another render.
- **Side effects go in `useEffect`, with a dependency array.** An empty array means "once on mount". Getting the dependency array wrong is the source of the infinite-loop bug you will eventually hit.

A component that loads data and handles all three states looks like this, and it is the pattern you will copy more than any other:

```tsx
export function TicketList({ queue }: { queue: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${import.meta.env.VITE_API_BASE}/tickets?queue=${queue}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");
        return body.tickets as Ticket[];
      })
      .then((rows) => { if (!cancelled) setTickets(rows); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [queue]);

  if (loading) return <p>Loading tickets…</p>;
  if (error) return <p role="alert">{error}</p>;
  return <table><tbody>{tickets.map((t) => <TicketRow key={t.id} ticket={t} onSelect={() => {}} />)}</tbody></table>;
}
```

Note the two things that are field lessons rather than React lessons. The `cancelled` flag stops a slow response from writing into a component the user has already navigated away from, which is the source of intermittent "it showed the wrong queue's data" reports. And the error path reads `body.error.message`, which is exactly the structured error payload from [Structured errors, and the message the customer will actually read](/roles/forward-deployed-engineer/craft/structured-errors-and-the-message-a-customer-reads). Design the payload and the frontend patch together and the whole loop is fifteen minutes.

## Finding the code in ten minutes

You have their repo and a screenshot. Do this:

1. **Grep the visible string.** `grep -rn "Pending approval" src/` finds the component or the translation file. If it hits a translations file, grep the key.
2. **If the string is dynamic**, grep a stable neighbour: a column header, a button label, a CSS class from the browser inspector.
3. **Grep the API path.** `grep -rn "/tickets" src/` finds every place that talks to your service. This is usually a smaller and more useful map than the component tree.
4. **Find the API client.** Almost every app has one file wrapping `fetch` or axios with the base URL and auth header. Find it early; you will change it.
5. **Read the router.** `App.tsx` or a `routes` file maps URLs to pages. Now you have screen to file.

Do not read the codebase depth-first. Read it along the path from the thing you can see to the thing you must change. The full technique is in [Reading a codebase in an afternoon](/roles/forward-deployed-engineer/craft/reading-a-codebase-in-an-afternoon).

## Getting it running inside their network

This is where most of an FDE's frontend time actually goes.

- **Which package manager?** `package-lock.json` means npm, `pnpm-lock.yaml` means pnpm, `yarn.lock` means yarn. Use the one matching the lockfile. Mixing them regenerates the lockfile and creates a diff nobody wants to review.
- **Which Node version?** Check `.nvmrc` or the `engines` field. A build that fails with a cryptic error is a wrong major version about half the time.
- **Corporate registry.** Inside a bank or a large enterprise, `registry.npmjs.org` is often blocked and an internal Artifactory or Nexus mirror is mandated. That lives in a project or user `.npmrc`. If `npm ci` hangs, this is the reason. Ask for the registry URL and the credentials in the same message where you ask for repo access, on day one.
- **Environment variables are build-time and prefixed.** Vite exposes only variables starting with `VITE_`; Next.js exposes only `NEXT_PUBLIC_`. A variable without the prefix is silently undefined in the browser, which looks exactly like a bug in your code.
- **CORS and the dev proxy.** In development the app usually proxies API calls through the dev server, configured in `vite.config.ts` or `next.config.js`. In production it does not. A patch that works locally and 404s in their environment is nearly always this.
- **Never commit a lockfile change you did not intend.** `npm install` updates it; `npm ci` does not. Use `npm ci`.

## What not to do in someone else's frontend

- Do not run the formatter across files you did not change. A 4,000-line diff makes your one-line fix unreviewable and it will not get merged before the demo.
- Do not upgrade dependencies to fix a build error. Match your Node version to theirs instead.
- Do not introduce a state library, a component library or a new pattern. You will be gone; their team will maintain it.
- Do not add `any` to make the compiler quiet. Use `unknown` and a check, or fix the type. `any` is how a small patch becomes a runtime crash in a demo.
- Do not touch their build configuration without telling their web lead in writing.

## What an interviewer can test

Nobody will ask you to build a frontend. They may hand you a small React app and ask you to add a feature while narrating, which is a close cousin of Palantir's Learning round: absorb an unfamiliar module and extend it inside sixty minutes. What is being watched is whether you navigate by evidence, whether you check the type of what the API actually returns rather than trusting the interface, and whether you keep the diff small.

## Do this now

Fork any small open-source React and TypeScript app with a list view. Then, timing yourself:

1. Get it running. Note every step that was not in its README.
2. Add one field to the list, sourced from a field that already exists in the data.
3. Add a loading state and an error state that reads a `body.error.message` shape.
4. Write four sentences in your journal on how you found the file. That paragraph is the skill; the diff is just evidence of it.
