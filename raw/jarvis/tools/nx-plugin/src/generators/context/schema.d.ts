export interface ContextGeneratorSchema {
  name: string;
  directory?: string;
  title?: string;
  bffPort?: number;
  webPort?: number;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  skipCi?: boolean;
}
