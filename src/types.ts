export type Category =
  | 'The Unsaid Wing'
  | 'The Unmade Wing';

export type ArtifactKey =
  | 'envelope'
  | 'suitcase'
  | 'moonJar'
  | 'paperPlane'
  | 'teacup';

export type ArtifactImageKey =
  | 'folded-envelope'
  | 'travel-suitcase'
  | 'moon-jar'
  | 'paper-plane'
  | 'teacup'
  | 'postcard'
  | 'brass-key'
  | 'ticket-stub'
  | 'closed-book'
  | 'paint-tube'
  | 'tiny-camera'
  | 'seed-packet'
  | 'map-pin'
  | 'quiet-clock'
  | 'recipe-card';

export type ArtifactMode = 'template' | 'saved' | 'generated';

export type CategoryTint = {
  bg: string;
  dot: string;
  ink: string;
};

export type Almost = {
  id: string;
  original: string;
  title: string;
  label: string;
  category: Category;
  artifact: ArtifactKey;
  artifactImageKey: ArtifactImageKey;
  artifactMode: ArtifactMode;
  artifactPrompt: string;
  artifactImageUri?: string;
  date: string;
};

export type CuratorResult = Pick<
  Almost,
  'title' | 'label' | 'category' | 'artifact' | 'artifactImageKey' | 'artifactPrompt'
> & {
  artifactMode?: ArtifactMode;
  artifactImageUri?: string;
};
