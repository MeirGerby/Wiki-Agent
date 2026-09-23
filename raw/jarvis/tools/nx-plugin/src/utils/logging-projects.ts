import type { Tree } from '@nx/devkit';

const LOGGING_INDEX = 'libs/logging/src/index.ts';
const DECLARATION = /export const Project = \[([\s\S]*?)\] as const;/;

export function registerLoggingProject(tree: Tree, project: string): boolean {
  if (!tree.exists(LOGGING_INDEX)) {
    return false;
  }

  const source = tree.read(LOGGING_INDEX, 'utf-8');
  if (!source) {
    return false;
  }

  const match = DECLARATION.exec(source);
  if (!match) {
    return false;
  }

  const existing = [...match[1].matchAll(/'([^']+)'/g)].map(
    (entry) => entry[1],
  );
  if (existing.includes(project)) {
    return false;
  }

  const entries = [...existing, project].map((name) => `'${name}'`).join(', ');
  tree.write(
    LOGGING_INDEX,
    source.replace(
      DECLARATION,
      `export const Project = [${entries}] as const;`,
    ),
  );

  return true;
}
