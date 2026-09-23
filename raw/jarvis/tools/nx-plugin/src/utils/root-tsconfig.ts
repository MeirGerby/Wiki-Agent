import { updateJson, type Tree } from '@nx/devkit';

type RootTsconfig = { references?: Array<{ path: string }> };

export function addRootTsconfigReference(
  tree: Tree,
  projectRoot: string,
): void {
  if (!tree.exists('tsconfig.json')) {
    return;
  }

  const path = `./${projectRoot}`;

  updateJson(tree, 'tsconfig.json', (json: RootTsconfig) => {
    const references = json.references ?? [];

    if (references.some((reference) => reference.path === path)) {
      return json;
    }

    json.references = [...references, { path }].sort((a, b) =>
      a.path.localeCompare(b.path),
    );

    return json;
  });
}
