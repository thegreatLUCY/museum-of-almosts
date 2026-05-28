import type { Almost, Category, CategoryTint } from '../types';

export const categories: Category[] = [
  'The Unsaid Wing',
  'The Unmade Wing',
];

export const categoryTint: Record<Category, CategoryTint> = {
  'The Unsaid Wing': { bg: '#f3e3d6', dot: '#9e5f45', ink: '#7a4733' },
  'The Unmade Wing': { bg: '#e8dcc8', dot: '#a47c3b', ink: '#6e542d' },
};

export const starterAlmosts: Almost[] = [
  {
    id: '1',
    original: 'I almost called my mom',
    title: 'A Call Suspended In Air',
    label:
      'You thought about reaching out, then carried the thought with you a little longer.',
    category: 'The Unsaid Wing',
    artifact: 'envelope',
    artifactImageKey: 'folded-envelope',
    artifactMode: 'template',
    artifactPrompt:
      'A sealed envelope keepsake in the Museum of Almosts style: thick dark brown outline, flat muted parchment colors, soft sage circular halo, warm cream background, simple wistful object.',
    date: 'Apr 17',
  },
  {
    id: '2',
    original: 'I almost booked the flight',
    title: 'The Ticket That Stayed A Thought',
    label:
      'A trip that lived for a moment as a tab, a price, and a maybe.',
    category: 'The Unmade Wing',
    artifact: 'suitcase',
    artifactImageKey: 'travel-suitcase',
    artifactMode: 'template',
    artifactPrompt:
      'A small suitcase keepsake in the Museum of Almosts style: thick dark brown outline, muted sage body, brass center band, soft sage circular halo, warm cream background, simple wistful object.',
    date: 'Apr 19',
  },
  {
    id: '3',
    original: 'I almost slept early',
    title: 'The Moon Kept Waiting',
    label:
      'Rest was close enough to notice, then the night quietly changed its mind.',
    category: 'The Unmade Wing',
    artifact: 'moonJar',
    artifactImageKey: 'moon-jar',
    artifactMode: 'template',
    artifactPrompt:
      'A moon captured in a small glass jar in the Museum of Almosts style: thick dark brown outline, muted glass blue, warm moon yellow, soft sage circular halo, warm cream background, simple wistful object.',
    date: 'Apr 22',
  },
];
