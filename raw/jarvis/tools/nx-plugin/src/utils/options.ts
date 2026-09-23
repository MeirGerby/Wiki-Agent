import {
  joinPathFragments,
  names,
  offsetFromRoot,
  type Tree,
} from '@nx/devkit';

export const SCOPE = '@jarvis';

export type ContextNames = {
  name: string;
  className: string;
  constantName: string;
  scope: string;
  root: string;
  webProject: string;
  bffProject: string;
  contractProject: string;
  webRoot: string;
  bffRoot: string;
  contractRoot: string;
};

export function contextNames(
  rawName: string,
  directory?: string,
): ContextNames {
  const name = names(rawName).fileName;
  const root = directory ? normalizeDirectory(directory) : `apps/${name}`;

  return {
    name,
    className: names(rawName).className,
    constantName: names(rawName).constantName,
    scope: SCOPE,
    root,
    webProject: `${SCOPE}/${name}-web`,
    bffProject: `${SCOPE}/${name}-bff`,
    contractProject: `${SCOPE}/${name}-contract`,
    webRoot: joinPathFragments(root, 'web'),
    bffRoot: joinPathFragments(root, 'bff'),
    contractRoot: joinPathFragments(root, 'contract'),
  };
}

export function normalizeDirectory(directory: string): string {
  return directory.replace(/^\.\//, '').replace(/\/+$/, '');
}

export function templateVariables(context: ContextNames, projectRoot: string) {
  return {
    ...context,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
    contractImportPath: context.contractProject,
    bffImportPath: context.bffProject,
    relativeToContract: relativePath(projectRoot, context.contractRoot),
    tmpl: '',
    dot: '.',
  };
}

export function relativePath(from: string, to: string): string {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);

  let shared = 0;
  while (
    shared < fromParts.length &&
    shared < toParts.length &&
    fromParts[shared] === toParts[shared]
  ) {
    shared += 1;
  }

  const up = fromParts.slice(shared).map(() => '..');
  const down = toParts.slice(shared);
  const parts = [...up, ...down];

  return parts.length === 0 ? '.' : parts.join('/');
}

export function projectExists(tree: Tree, projectRoot: string): boolean {
  return tree.exists(joinPathFragments(projectRoot, 'package.json'));
}
