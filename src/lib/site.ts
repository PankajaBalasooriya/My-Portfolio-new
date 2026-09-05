/** Single source of truth for site-wide identity, nav, and social links. */

export const site = {
  name: 'Pankaja Balasooriya',
  shortName: 'Pankaja Balasooriya',
  title: 'Pankaja Balasooriya',
  description:
    'Electronic & Telecommunication Engineering undergraduate working across robotics, embedded hardware, machine learning, and human-computer interaction research.',
  tagline:
    'I build intelligent systems end to end — from custom electronics and firmware to the software and learning algorithms that drive them.',
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
