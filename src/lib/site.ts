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

/** Placeholder handles — replace at content time. */
export const socials = [
  { label: 'GitHub', href: 'https://github.com/pankajabalasooriya' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pankajabalasooriya' },
  { label: 'Scholar', href: 'https://scholar.google.com/' },
  { label: 'Email', href: `mailto:${site.author.email}` },
] as const;
