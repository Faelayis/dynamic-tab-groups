declare module "conventional-changelog-conventionalcommits" {
  export interface CommitType {
    type: string;
    section?: string;
    hidden?: boolean;
    scope?: string;
  }

  export interface ChangelogCommit {
    hash?: string;
    [key: string]: unknown;
  }

  export type ChangelogTransform = (
    commit: ChangelogCommit,
    context: unknown,
  ) => ChangelogCommit | null | undefined;

  export interface WriterOptions {
    commitPartial: string;
    transform: ChangelogTransform;
    [key: string]: unknown;
  }

  export interface Preset {
    commits: unknown;
    parser: unknown;
    whatBump: unknown;
    writer: WriterOptions;
  }

  export interface PresetConfig {
    types?: readonly CommitType[];
    [key: string]: unknown;
  }

  export const DEFAULT_COMMIT_TYPES: readonly CommitType[];

  export default function createPreset(config?: PresetConfig): Promise<Preset>;
}
