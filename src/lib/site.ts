/** Single source of truth for site-wide identity, nav, and social links. */

export const site = {
  name: 'Pankaja Balasooriya',
  shortName: 'Pankaja Balasooriya',
  title: 'Pankaja Balasooriya',
  description:
    'Electronic & Telecommunication Engineering undergraduate working across robotics, embedded hardware, machine learning, and human-computer interaction research.',
  tagline:
    'I build intelligent systems end to end — from custom electronics and firmware to the software and learning algorithms that drive them.',
  /**
   * The hero splits the tagline at its em dash: the clause before it is short
   * enough to set as a display heading, the rest carries the detail. `tagline`
   * above stays the single full sentence, used for meta and OG descriptions.
   */
  hero: {
    headline: 'I build intelligent systems end to end',
    sub: 'From custom electronics and firmware to the software and learning algorithms that drive them.',
  },
  /**
   * The hero's role line, rendered as "<study> · <affiliation>".
   * Keep each part short — it sits on one or two lines under the tagline.
   */
  role: {
    study: 'Final-year Electronic & Telecommunication Engineering, University of Moratuwa',
    affiliation: 'Research intern, Exertion Games Lab',
  },
  /** Used for schema.org jobTitle. */
  jobTitle: 'Research Intern',
  /**
   * Verified against the live sites: mrt.ac.lk and exertiongameslab.org both
   * resolve and their titles match. uom.lk does not resolve — do not use it.
   */
  organizations: {
    university: { name: 'University of Moratuwa', url: 'https://www.mrt.ac.lk' },
    lab: { name: 'Exertion Games Lab', url: 'https://exertiongameslab.org' },
  },
  /** schema.org knowsAbout — broad research and engineering areas. */
  knowsAbout: [
    'Robotics',
    'Embedded systems',
    'PCB design',
    'Machine learning',
    'Multi-agent reinforcement learning',
    'Human-computer interaction',
  ],
  locale: 'en',
  ogLocale: 'en_US',
  author: {
    name: 'Pankaja Balasooriya',
    email: 'pankajabalasooriya566@gmail.com',
  },
} as const;

export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Research', href: '/research' },
  { label: 'Projects', href: '/projects' },
  { label: 'Writing', href: '/blog' },
  { label: 'CV', href: '/cv' },
] as const;

/** Checked against the ORCID public API: the record's name matches. */
export const ORCID = '0009-0009-4550-2470';

/**
 * `verified: true` means the URL has been confirmed to resolve to this person.
 * Only verified profiles are published as schema.org `sameAs`, because a wrong
 * sameAs asserts an identity link that is not true. Flip the flag once the
 * real profile URL is in place.
 */
export const socials = [
  { label: 'GitHub', href: 'https://github.com/PankajaBalasooriya', verified: true },
  // Supplied by the site owner. LinkedIn answers automated requests with 999,
  // so it cannot be machine-checked the way the others were.
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pankajabalasooriya', verified: true },
  {
    label: 'Scholar',
    href: 'https://scholar.google.com/citations?user=gKDoXuAAAAAJ&hl=en',
    verified: true,
  },
  { label: 'ORCID', href: `https://orcid.org/${ORCID}`, verified: true },
  { label: 'Email', href: `mailto:${site.author.email}`, verified: true },
] as const;

/** Profiles safe to publish as schema.org `sameAs`. */
export const verifiedProfiles = socials
  .filter((s) => s.verified && s.href.startsWith('https://'))
  .map((s) => s.href);
