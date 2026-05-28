import type { ImageSourcePropType } from 'react-native';

import type { ArtifactImageKey, ArtifactKey, Category } from '../types';

export type ArtifactLibraryItem = {
  key: ArtifactImageKey;
  category: Category;
  fallbackArtifact: ArtifactKey;
  label: string;
  promptSubject: string;
  keywords: string[];
};

export const artifactLibrary: ArtifactLibraryItem[] = [
  {
    key: 'folded-envelope',
    category: 'The Unsaid Wing',
    fallbackArtifact: 'envelope',
    label: 'Folded Envelope',
    promptSubject: 'a sealed envelope with a tiny terracotta wax seal',
    keywords: ['call', 'text', 'message', 'dm', 'apology', 'reply', 'email', 'letter'],
  },
  {
    key: 'travel-suitcase',
    category: 'The Unmade Wing',
    fallbackArtifact: 'suitcase',
    label: 'Travel Suitcase',
    promptSubject: 'a small sage suitcase with a brass center band',
    keywords: ['trip', 'flight', 'travel', 'train', 'bus', 'hotel', 'passport', 'leave'],
  },
  {
    key: 'moon-jar',
    category: 'The Unmade Wing',
    fallbackArtifact: 'moonJar',
    label: 'Moon Jar',
    promptSubject: 'a small glass jar holding a warm yellow crescent moon',
    keywords: ['sleep', 'night', 'rest', 'early', 'quiet', 'dream', 'bed'],
  },
  {
    key: 'paper-plane',
    category: 'The Unmade Wing',
    fallbackArtifact: 'paperPlane',
    label: 'Paper Plane',
    promptSubject: 'a folded paper plane with soft cream paper and dark ink folds',
    keywords: ['write', 'draft', 'chapter', 'note', 'story', 'send', 'poem'],
  },
  {
    key: 'teacup',
    category: 'The Unmade Wing',
    fallbackArtifact: 'teacup',
    label: 'Teacup',
    promptSubject: 'a small brass teacup with two simple steam lines',
    keywords: ['start', 'morning', 'routine', 'pause', 'tea', 'coffee', 'habit'],
  },
  {
    key: 'postcard',
    category: 'The Unsaid Wing',
    fallbackArtifact: 'envelope',
    label: 'Postcard',
    promptSubject: 'a faded postcard with a tiny blank stamp corner',
    keywords: ['visit', 'miss', 'wish', 'friend', 'photo', 'memory', 'hello'],
  },
  {
    key: 'brass-key',
    category: 'The Unmade Wing',
    fallbackArtifact: 'moonJar',
    label: 'Brass Key',
    promptSubject: 'a small old brass key on a cream tag',
    keywords: ['move', 'door', 'home', 'room', 'unlock', 'choice', 'change'],
  },
  {
    key: 'ticket-stub',
    category: 'The Unmade Wing',
    fallbackArtifact: 'suitcase',
    label: 'Ticket Stub',
    promptSubject: 'a torn ticket stub with soft ochre paper and rounded corners',
    keywords: ['movie', 'show', 'concert', 'event', 'museum', 'date', 'ticket'],
  },
  {
    key: 'closed-book',
    category: 'The Unmade Wing',
    fallbackArtifact: 'teacup',
    label: 'Closed Book',
    promptSubject: 'a closed moss green book with a narrow ribbon bookmark',
    keywords: ['read', 'learn', 'study', 'course', 'book', 'lesson', 'class'],
  },
  {
    key: 'paint-tube',
    category: 'The Unmade Wing',
    fallbackArtifact: 'paperPlane',
    label: 'Paint Tube',
    promptSubject: 'a gently squeezed paint tube with a terracotta color dot',
    keywords: ['paint', 'draw', 'sketch', 'art', 'design', 'illustrate', 'canvas'],
  },
  {
    key: 'tiny-camera',
    category: 'The Unmade Wing',
    fallbackArtifact: 'paperPlane',
    label: 'Tiny Camera',
    promptSubject: 'a tiny vintage camera with muted sage body and brass lens',
    keywords: ['photo', 'film', 'record', 'video', 'capture', 'shoot', 'vlog'],
  },
  {
    key: 'seed-packet',
    category: 'The Unmade Wing',
    fallbackArtifact: 'teacup',
    label: 'Seed Packet',
    promptSubject: 'a small seed packet with three simple green sprouts',
    keywords: ['plant', 'grow', 'garden', 'health', 'exercise', 'walk', 'begin'],
  },
  {
    key: 'map-pin',
    category: 'The Unmade Wing',
    fallbackArtifact: 'suitcase',
    label: 'Map Pin',
    promptSubject: 'a round map pin resting on a folded cream map',
    keywords: ['place', 'walk', 'park', 'shop', 'restaurant', 'city', 'explore'],
  },
  {
    key: 'quiet-clock',
    category: 'The Unmade Wing',
    fallbackArtifact: 'moonJar',
    label: 'Quiet Clock',
    promptSubject: 'a small quiet clock with brass bells and soft cream face',
    keywords: ['time', 'deadline', 'late', 'wait', 'delay', 'tomorrow', 'schedule'],
  },
  {
    key: 'recipe-card',
    category: 'The Unmade Wing',
    fallbackArtifact: 'paperPlane',
    label: 'Recipe Card',
    promptSubject: 'a cream recipe card with a tiny spoon and terracotta dot',
    keywords: ['cook', 'bake', 'recipe', 'dinner', 'meal', 'kitchen', 'cake'],
  },
];

const artifactImageSources: Partial<Record<ArtifactImageKey, ImageSourcePropType>> = {
  // Add your finished PNGs here as you make them:
  // 'folded-envelope': require('../../assets/artifacts/folded-envelope.png'),
};

export function getArtifactImageSource(
  key: ArtifactImageKey,
): ImageSourcePropType | undefined {
  return artifactImageSources[key];
}

export function getArtifactLibraryItem(key: ArtifactImageKey): ArtifactLibraryItem {
  return artifactLibrary.find((item) => item.key === key) ?? artifactLibrary[0];
}

export function hasSavedArtifactImage(key: ArtifactImageKey): boolean {
  return Boolean(getArtifactImageSource(key));
}

export function isArtifactImageKey(value: unknown): value is ArtifactImageKey {
  return typeof value === 'string' && artifactLibrary.some((item) => item.key === value);
}

export function selectArtifactForText(
  original: string,
  category: Category,
): ArtifactLibraryItem {
  const lower = original.toLowerCase();
  const categoryItems = artifactLibrary.filter((item) => item.category === category);
  const candidates = categoryItems.length > 0 ? categoryItems : artifactLibrary;

  return candidates.reduce((best, item) => {
    const score = item.keywords.reduce(
      (total, keyword) => total + (lower.includes(keyword) ? 1 : 0),
      0,
    );

    return score > best.score ? { item, score } : best;
  }, { item: candidates[0], score: -1 }).item;
}
