import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { tracks } from '../data/curriculum';
import { quizTracks } from '../data/quizzes';
import { quickGuides } from '../data/quick-guides';
import { fdePhases, fdeRole, fdeKindLabel } from '../data/fde';

// Static search index consumed by the ⌘K dialog. Kept deliberately small:
// title + kind + a short summary is enough to rank well over ~700 pages, and
// the whole file gzips to well under 50KB, so it loads on first search only.
export const GET: APIRoute = async () => {
  const trackName = new Map(tracks.map((t) => [t.id, t.name]));
  const rows: Array<{ t: string; u: string; k: string; c: string; s: string }> = [];

  const lessons = await getCollection('lessons');
  for (const entry of lessons) {
    const [track, ...rest] = entry.id.split('/');
    rows.push({
      t: entry.data.title,
      u: `/learn/${track}/${rest.join('/')}`,
      k: 'Lesson',
      c: trackName.get(track) ?? track,
      s: (entry.data.summary ?? '').slice(0, 130),
    });
  }

  const fde = await getCollection('fde');
  const fdePhaseName = new Map(fdePhases.map((p) => [p.id, p.name]));
  for (const entry of fde) {
    rows.push({
      t: entry.data.title,
      u: `/roles/${fdeRole.id}/${entry.id}`,
      k: `FDE ${fdeKindLabel[entry.data.kind].toLowerCase()}`,
      c: fdePhaseName.get(entry.data.phase) ?? 'Forward Deployed Engineer',
      s: entry.data.summary.slice(0, 130),
    });
  }
  rows.push({ t: fdeRole.name, u: `/roles/${fdeRole.id}`, k: 'Role path', c: 'Roles', s: fdeRole.blurb.slice(0, 130) });
  for (const p of fdePhases) {
    rows.push({ t: `FDE · ${p.name}`, u: `/roles/${fdeRole.id}/${p.id}`, k: 'FDE phase', c: fdeRole.name, s: p.summary.slice(0, 130) });
  }

  const guides = await getCollection('guides');
  for (const g of guides) {
    rows.push({ t: g.data.title, u: `/guides/${g.id}`, k: 'Guide', c: 'Guides', s: g.data.description.slice(0, 130) });
  }

  const posts = await getCollection('blog');
  for (const b of posts) {
    rows.push({ t: b.data.title, u: `/blog/${b.id}`, k: 'Article', c: 'Blog', s: b.data.description.slice(0, 130) });
  }

  const questions = await getCollection('questions');
  for (const q of questions) {
    rows.push({ t: q.data.title, u: `/interview/${q.id}`, k: 'Interview', c: 'Interview prep', s: q.data.description.slice(0, 130) });
  }

  const scenarios = await getCollection('scenarios');
  for (const s of scenarios) {
    rows.push({ t: s.data.title, u: `/scenarios/${s.id}`, k: 'Scenario', c: 'Scenarios', s: s.data.description.slice(0, 130) });
  }

  for (const q of quizTracks) {
    rows.push({ t: `${q.name} quiz`, u: `/practice/${q.id}`, k: 'Quiz', c: 'Practice', s: q.summary.slice(0, 130) });
  }

  for (const t of tracks) {
    rows.push({ t: t.name, u: `/learn/${t.id}`, k: 'Track', c: t.group, s: t.summary.slice(0, 130) });
    const guide = quickGuides[t.id];
    if (guide) {
      rows.push({
        t: `${t.name} in ${guide.minutes} minutes`,
        u: `/learn/${t.id}/quick-guide`,
        k: 'Quick guide',
        c: t.name,
        s: guide.opening.slice(0, 130),
      });
    }
  }

  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
};
