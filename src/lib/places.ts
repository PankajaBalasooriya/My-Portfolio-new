import { getCollection, type CollectionEntry } from 'astro:content';

export type PlaceEntry = CollectionEntry<'places'>;
export type PlaceVisit = PlaceEntry['data']['visits'][number];
export type PlacePurpose = PlaceVisit['purpose'];

const includeDrafts = import.meta.env.DEV;

const dayFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const toUtcDate = (value: string) => new Date(`${value}T00:00:00Z`);

export function latestVisit(place: PlaceEntry): PlaceVisit {
  return [...place.data.visits].sort((a, b) => b.start.localeCompare(a.start))[0]!;
}

export function earliestVisit(place: PlaceEntry): PlaceVisit {
  return [...place.data.visits].sort((a, b) => a.start.localeCompare(b.start))[0]!;
}

export function formatVisitDate(visit: PlaceVisit): string {
  if (!visit.end || visit.end === visit.start) return dayFormatter.format(toUtcDate(visit.start));

  const start = toUtcDate(visit.start);
  const end = toUtcDate(visit.end);
  if (visit.start.slice(0, 7) === visit.end.slice(0, 7)) {
    return `${start.getUTCDate()}–${dayFormatter.format(end)}`;
  }

  return `${dayFormatter.format(start)} – ${dayFormatter.format(end)}`;
}

export function formatVisitMonth(visit: PlaceVisit): string {
  const start = monthFormatter.format(toUtcDate(visit.start));
  if (!visit.end || visit.end.slice(0, 7) === visit.start.slice(0, 7)) return start;
  return `${start} – ${monthFormatter.format(toUtcDate(visit.end))}`;
}

export function placePurposes(place: PlaceEntry): PlacePurpose[] {
  return [...new Set(place.data.visits.map((visit) => visit.purpose))];
}

export function isUpcomingPlace(place: PlaceEntry): boolean {
  return place.data.visits.every((visit) => visit.status === 'upcoming');
}

/** Production places, newest visit first. Drafts remain available in local dev. */
export async function getPlaces(): Promise<PlaceEntry[]> {
  const places = await getCollection('places', ({ data }) => includeDrafts || !data.draft);
  return places.sort((a, b) => latestVisit(b).start.localeCompare(latestVisit(a).start));
}

export function getPlacesStats(places: PlaceEntry[]) {
  const visitedPlaces = places.filter((place) =>
    place.data.visits.some((visit) => visit.status === 'visited'),
  );
  const countries = new Set(visitedPlaces.map((place) => place.data.countryCode));
  const workVisits = visitedPlaces.flatMap((place) => place.data.visits).filter(
    (visit) => visit.status === 'visited' && visit.purpose !== 'travel',
  );

  return {
    places: visitedPlaces.length,
    countries: countries.size,
    workVisits: workVisits.length,
  };
}

export function groupPlacesByYear(places: PlaceEntry[]) {
  const groups = new Map<string, PlaceEntry[]>();
  for (const place of places) {
    const year = latestVisit(place).start.slice(0, 4);
    const group = groups.get(year);
    if (group) group.push(place);
    else groups.set(year, [place]);
  }
  return [...groups.entries()].map(([year, entries]) => ({ year, entries }));
}
