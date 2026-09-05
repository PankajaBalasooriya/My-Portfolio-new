/**
 * Typed queries over the content collections.
 *
 * Every route goes through these rather than calling getCollection() directly,
 * so draft filtering and sort order are defined once.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

/** Drafts are visible in `astro dev` and never in a production build. */
const includeDrafts = import.meta.env.DEV;

export async function getPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeaturedProjects(): Promise<CollectionEntry<'projects'>[]> {
  return (await getProjects()).filter((p) => p.data.featured);
}

/** Confidence of the result, most settled first. */
const STATUS_RANK: Record<string, number> = {
  published: 0,
  accepted: 1,
  'conditionally-accepted': 2,
  'under-review': 3,
};

/** Newest year first, then settled work above submissions, then by title. */
export async function getResearch(): Promise<CollectionEntry<'research'>[]> {
  const research = await getCollection('research');
  return research.sort(
    (a, b) =>
      b.data.year - a.data.year ||
      (STATUS_RANK[a.data.status] ?? 9) - (STATUS_RANK[b.data.status] ?? 9) ||
      a.data.title.localeCompare(b.data.title),
  );
}

/** Publications bucketed by year, newest year first. */
export async function getResearchByYear(): Promise<
  { year: number; items: CollectionEntry<'research'>[] }[]
> {
  const grouped = new Map<number, CollectionEntry<'research'>[]>();
  for (const entry of await getResearch()) {
    const bucket = grouped.get(entry.data.year);
    if (bucket) bucket.push(entry);
    else grouped.set(entry.data.year, [entry]);
  }
  return [...grouped.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

/** Most recent first. `end: undefined` means current, so it sorts to the top. */
function byRecency<T extends { data: { start: string; end?: string } }>(a: T, b: T): number {
  const aEnd = a.data.end ?? '9999';
  const bEnd = b.data.end ?? '9999';
  return bEnd.localeCompare(aEnd) || b.data.start.localeCompare(a.data.start);
}

export async function getExperience(): Promise<CollectionEntry<'experience'>[]> {
  const entries = await getCollection('experience');
  return entries.sort((a, b) => {
    const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || byRecency(a, b);
  });
}

export async function getEducation(): Promise<CollectionEntry<'education'>[]> {
  const entries = await getCollection('education');
  return entries.sort((a, b) => {
    const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || byRecency(a, b);
  });
}

export async function getVolunteering(): Promise<CollectionEntry<'volunteering'>[]> {
  return (await getCollection('volunteering')).sort(byRecency);
}

export async function getAwards(): Promise<CollectionEntry<'awards'>[]> {
  const awards = await getCollection('awards');
  return awards.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/** Courses and certifications, most recent first. */
export async function getCertificates(): Promise<CollectionEntry<'certificates'>[]> {
  const entries = await getCollection('certificates');
  return entries.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

/** Tool groups for the About page, in authored order. */
export async function getStack(): Promise<CollectionEntry<'stack'>[]> {
  const groups = await getCollection('stack');
  return groups.sort((a, b) => a.data.order - b.data.order);
}

/** Education split into higher education and school, each most recent first. */
export async function getEducationByKind(): Promise<{
  university: CollectionEntry<'education'>[];
  school: CollectionEntry<'education'>[];
}> {
  const entries = await getEducation();
  return {
    university: entries.filter((e) => e.data.kind === 'university'),
    school: entries.filter((e) => e.data.kind === 'school'),
  };
}

/** Every published post tag, with counts, alphabetical. */
export async function getPostTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

/** Every project tag, alphabetical — drives the /projects filter. */
export async function getProjectTags(): Promise<string[]> {
  const tags = new Set<string>();
  for (const project of await getProjects()) {
    for (const tag of project.data.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
