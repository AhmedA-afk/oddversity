import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { tracks, roleTracks } from '../data/curriculum';
import { terms } from '../data/glossary';
import { quickGuides } from '../data/quick-guides';
import { quizTracks } from '../data/quizzes';
import { fdePhases, fdeRole } from '../data/fde';

const SITE = 'https://oddversity.com';

// Generated rather than hand-written, so it cannot drift from the site.
export const GET: APIRoute = async () => {
  const lessons = await getCollection('lessons');
  const guides = (await getCollection('guides')).sort((a, b) => a.data.title.localeCompare(b.data.title));
  const posts = await getCollection('blog');
  const questions = (await getCollection('questions')).sort((a, b) => a.data.order - b.data.order);
  const scenarios = await getCollection('scenarios');

  const countFor = (id: string) => lessons.filter((l) => l.id.startsWith(`${id}/`)).length;

  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push('# Oddversity');
  push();
  push(
    'Oddversity is a free, hands-on curriculum for building with AI, written for practitioners ' +
      'who want a structured path from model fundamentals to production agents. Every page is open: ' +
      'no paywall, no account, no gated lessons.',
  );
  push();
  push(`It currently contains ${lessons.length} lessons across ${tracks.length} technical tracks, ` +
    `${guides.length} end-to-end guides, ${roleTracks.length} role paths, ` +
    `${questions.length} interview topics, ${quizTracks.length} quizzes, ${scenarios.length} scenario walkthroughs ` +
    `and ${Object.keys(quickGuides).length} quick guides that condense a whole track to one page.`);
  push();

  push('## Editorial policy');
  push();
  push('- Statistics are used only where a named source exists. Invented or unattributed figures are not published.');
  push('- Every technique is documented with its failure modes, not only its happy path.');
  push('- Where providers or tools differ, the difference is stated rather than smoothed over.');
  push('- Where evidence is thin or contested, the page says so instead of rounding to a confident claim.');
  push('- Content is Markdown in a public repository, so any claim can be traced through its edit history.');
  push();

  push('## Start here');
  push();
  push(`- [Home](${SITE}/): what Oddversity is and the three ways in`);
  push(`- [Curriculum](${SITE}/learn): every track, grouped and ordered by dependency`);
  push(`- [Guides](${SITE}/guides): one task taken end to end, with runnable code`);
  push(`- [Reference](${SITE}/reference): quick guides, cheatsheets, comparisons, worked examples and debugging clinics`);
  push(`- [Glossary](${SITE}/reference/glossary): ${terms.length} terms defined plainly`);
  push(`- [Interview questions](${SITE}/interview): worked answers linked back into the curriculum`);
  push(`- [Practice](${SITE}/practice): quizzes with per-answer explanations`);
  push(`- [Scenarios](${SITE}/scenarios): realistic build decisions walked through`);
  push(`- [Blog](${SITE}/blog): notes on building with AI ([RSS](${SITE}/rss.xml))`);
  push(`- [About](${SITE}/about): what this is and what it deliberately is not`);
  push();

  const fde = await getCollection('fde');
  push('## Forward Deployed Engineer path');
  push();
  push(`- [${fdeRole.name}](${SITE}/roles/${fdeRole.id}): an independent zero-to-FDE path — ` +
    `${fdeRole.length.months} months, ${fde.length} pages live of a planned ` +
    `${fdePhases.reduce((n, p) => n + p.modules.reduce((m, mod) => m + mod.nodes.length, 0), 0)}, ` +
    'with weekly decomposition drills, simulated-customer bootcamps and eval-first capstones.');
  for (const p of fdePhases) {
    const live = fde.filter((e) => e.data.phase === p.id).length;
    push(`  - [${p.n} ${p.name}](${SITE}/roles/${fdeRole.id}/${p.id}): ${p.summary} (${live} live)`);
  }
  push();

  push('## Technical tracks');
  push();
  for (const track of tracks) {
    const guide = quickGuides[track.id];
    const quick = guide ? ` · condensed: ${SITE}/learn/${track.id}/quick-guide` : '';
    push(`- [${track.name}](${SITE}/learn/${track.id}) — ${track.summary} (${countFor(track.id)} lessons)${quick}`);
  }
  push();

  push('## Quick guides');
  push();
  push('Each condenses one whole track to a single page: what every module establishes, the three lessons that carry the most weight, and what the track deliberately does not cover.');
  push();
  for (const track of tracks) {
    const guide = quickGuides[track.id];
    if (guide) push(`- [${track.name} in ${guide.minutes} minutes](${SITE}/learn/${track.id}/quick-guide) — ${guide.opening}`);
  }
  push();

  push('## Role paths');
  push();
  for (const role of roleTracks) {
    push(`- [${role.name}](${SITE}/roles/${role.id}) — ${role.blurb}`);
  }
  push();

  push('## Guides');
  push();
  for (const guide of guides) {
    push(`- [${guide.data.title}](${SITE}/guides/${guide.id}) — answers: "${guide.data.question}" (${guide.data.level}, ${guide.data.duration})`);
  }
  push();

  push('## Interview topics');
  push();
  for (const topic of questions) {
    push(`- [${topic.data.title}](${SITE}/interview/${topic.id}) — ${topic.data.description}`);
  }
  push();

  push('## Scenarios');
  push();
  for (const s of scenarios) {
    push(`- [${s.data.title}](${SITE}/scenarios/${s.id}) — ${s.data.description}`);
  }
  push();

  push('## Recent writing');
  push();
  for (const post of [...posts].sort((a, b) => Date.parse(b.data.published) - Date.parse(a.data.published)).slice(0, 10)) {
    push(`- [${post.data.title}](${SITE}/blog/${post.id}) — ${post.data.description} (${post.data.published})`);
  }
  push();

  push('## Full lesson index');
  push();
  push(`Every lesson URL follows ${SITE}/learn/<track>/<slug>. The complete list is in the sitemap: ${SITE}/sitemap-index.xml`);
  push();

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
