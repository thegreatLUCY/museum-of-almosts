import {
  artifactLibrary,
  getArtifactLibraryItem,
  hasSavedArtifactImage,
  isArtifactImageKey,
  selectArtifactForText,
} from '../data/artifactLibrary';
import type { Almost, ArtifactMode, Category, CuratorResult } from '../types';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const validCategories: Category[] = [
  'The Unsaid Wing',
  'The Unmade Wing',
];

const artifactStylePrompt =
  'Museum of Almosts style: isolated keepsake icon, thick dark brown rounded outline, flat muted vintage colors, no text, no UI, warm cream background, soft sage circular halo, centered simple object, gentle handmade museum label feeling.';

const curatorApiUrl =
  typeof process === 'undefined'
    ? undefined
    : process.env?.EXPO_PUBLIC_CURATOR_API_URL;

export async function curateAlmost(original: string): Promise<Almost> {
  const trimmed = original.trim();

  if (curatorApiUrl) {
    const remoteResult = await curateWithApi(trimmed);

    if (remoteResult) {
      return makeAlmost(trimmed, remoteResult);
    }
  }

  await wait(420);
  return makeAlmost(trimmed, localCurateAlmost(trimmed));
}

async function curateWithApi(original: string): Promise<CuratorResult | null> {
  try {
    const response = await fetch(curatorApiUrl as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original,
        style: artifactStylePrompt,
        artifactChoices: artifactLibrary.map((item) => ({
          key: item.key,
          category: item.category,
          label: item.label,
          keywords: item.keywords,
        })),
      }),
    });

    if (!response.ok) {
      return null;
    }

    return normalizeCuratorResult(await response.json());
  } catch {
    return null;
  }
}

function localCurateAlmost(original: string): CuratorResult {
  const lower = original.toLowerCase();

  if (
    /call|text|message|dm|apolog|reply|email|send|tell|told|say|said|ask|asked|invite|confess|love/.test(
      lower,
    )
  ) {
    return {
      title: 'The Words Left Unsaid',
      label: 'You almost said it, then left the words unsaid.',
      category: 'The Unsaid Wing',
      ...artifactDetails(original, 'The Unsaid Wing'),
    };
  }

  if (
    /trip|flight|walk|visit|drive|train|bus|book|leave|go to|move|door|home|choice|choose|sleep|quit|stay|time|deadline|tomorrow/.test(
      lower,
    )
  ) {
    return {
      title: 'A Version Of The Day Unmade',
      label:
        'A possible version of the day appeared, then stayed on the other side of doing.',
      category: 'The Unmade Wing',
      ...artifactDetails(original, 'The Unmade Wing'),
    };
  }

  if (
    /cook|make|write|wrote|draw|paint|draft|chapter|build|record|bake|read|learn|study|start|begin|plant|grow|exercise|habit/.test(
      lower,
    )
  ) {
    return {
      title: 'The Thing Before It Became Real',
      label:
        'The beginning was there: small, real, and not quite ready to become visible.',
      category: 'The Unmade Wing',
      ...artifactDetails(original, 'The Unmade Wing'),
    };
  }

  return {
    title: 'The Almost That Stayed',
    label: 'It almost happened, then stayed as a thought.',
    category: 'The Unmade Wing',
    ...artifactDetails(original, 'The Unmade Wing'),
  };
}

function normalizeCuratorResult(value: unknown): CuratorResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const category = normalizeCategory(value.category);
  const artifactImageKey = normalizeArtifactImageKey(value);

  if (
    typeof value.title !== 'string' ||
    typeof value.label !== 'string' ||
    !category ||
    !artifactImageKey
  ) {
    return null;
  }

  const libraryItem = getArtifactLibraryItem(artifactImageKey);

  return {
    title: value.title,
    label: value.label,
    category,
    artifact: libraryItem.fallbackArtifact,
    artifactImageKey: libraryItem.key,
    artifactMode: normalizeArtifactMode(value.artifactMode),
    artifactPrompt:
      typeof value.artifactPrompt === 'string'
        ? `${value.artifactPrompt}. ${artifactStylePrompt}`
        : promptFor(libraryItem.promptSubject),
    artifactImageUri:
      typeof value.artifactImageUri === 'string' ? value.artifactImageUri : undefined,
  };
}

function makeAlmost(original: string, details: CuratorResult): Almost {
  const artifactMode = details.artifactImageUri
    ? 'generated'
    : hasSavedArtifactImage(details.artifactImageKey)
      ? 'saved'
      : details.artifactMode ?? 'template';

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    original,
    date: 'Today',
    ...details,
    artifactMode,
  };
}

function promptFor(subject: string): string {
  return `${subject}, ${artifactStylePrompt}`;
}

function artifactDetails(original: string, category: Category) {
  const artifact = selectArtifactForText(original, category);

  return {
    artifact: artifact.fallbackArtifact,
    artifactImageKey: artifact.key,
    artifactPrompt: promptFor(artifact.promptSubject),
  };
}

function normalizeCategory(value: unknown): Category | null {
  return typeof value === 'string' && validCategories.includes(value as Category)
    ? (value as Category)
    : null;
}

function normalizeArtifactImageKey(value: Record<string, unknown>) {
  if (isArtifactImageKey(value.artifactImageKey)) {
    return value.artifactImageKey;
  }

  if (isArtifactImageKey(value.artifact)) {
    return value.artifact;
  }

  return null;
}

function normalizeArtifactMode(value: unknown): ArtifactMode | undefined {
  return value === 'generated' || value === 'saved' || value === 'template'
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
