import comments from '@eslint-community/eslint-plugin-eslint-comments';
import markdown from '@eslint/markdown';
import nx from '@nx/eslint-plugin';
import { readdirSync } from 'node:fs';
import { createJiti } from 'jiti';

import docs from './tools/eslint/docs/index.mjs';

const jiti = createJiti(import.meta.url);
const antiSlop = (await jiti.import('./tools/eslint/anti-slop/index.ts'))
  .default;

const contexts = readdirSync(new URL('./apps', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const depConstraints = [
  {
    sourceTag: '*',
    onlyDependOnLibsWithTags: ['/^type:/'],
  },
  ...contexts.map((context) => ({
    sourceTag: `scope:${context}`,
    onlyDependOnLibsWithTags: [`scope:${context}`, 'scope:shared'],
  })),
  {
    sourceTag: 'scope:shared',
    onlyDependOnLibsWithTags: ['scope:shared'],
  },
  {
    sourceTag: 'scope:tooling',
    onlyDependOnLibsWithTags: ['scope:tooling'],
  },
  {
    sourceTag: 'type:web',
    onlyDependOnLibsWithTags: ['type:contract', 'type:ui', 'type:util'],
  },
  {
    sourceTag: 'type:bff',
    onlyDependOnLibsWithTags: ['type:contract', 'type:data', 'type:util'],
  },
  {
    sourceTag: 'type:contract',
    onlyDependOnLibsWithTags: ['type:data', 'type:util'],
  },
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:util'],
  },
  {
    sourceTag: 'type:data',
    onlyDependOnLibsWithTags: ['type:util'],
  },
  {
    sourceTag: 'type:util',
    onlyDependOnLibsWithTags: [],
  },
  {
    sourceTag: 'type:tooling',
    onlyDependOnLibsWithTags: ['type:tooling'],
  },
];

const eslintConfigImport = '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$';

const moduleBoundaries = (allow) => [
  'error',
  {
    enforceBuildableLibDependency: true,
    allow,
    depConstraints,
  },
];

const sourceFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '.claude/**/',
      '**/dist',
      '**/out-tsc',
      'tools/nx-plugin/src/generators/context/files',
      'tools/eslint/anti-slop/**',
      '**/routeTree.gen.ts',
    ],
  },
  {
    files: sourceFiles,
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries([eslintConfigImport]),
    },
  },
  // A surface imports its own BFF's AppRouter type — `<x>-web` -> `<x>-bff`.
  // Nx forbids app->app imports by default and has no depConstraint for it,
  // so the exception is declared here. It is deliberate: the pair ships as one
  // unit (see the commit that created apps/<x>/web + apps/<x>/bff), and the
  // alternative is a generated stand-in router that only claims to match.
  ...contexts.map((context) => ({
    files: [`apps/${context}/web/**/*.ts`, `apps/${context}/web/**/*.tsx`],
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries([
        eslintConfigImport,
        `^@jarvis/${context}-bff$`,
      ]),
    },
  })),
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: {
      'anti-slop': antiSlop,
      '@eslint-community/eslint-comments': comments,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
      '@eslint-community/eslint-comments/require-description': [
        'error',
        { ignore: ['eslint-enable'] },
      ],
      'anti-slop/no-chained-type-assertions': 'error',
      'anti-slop/no-conditional-empty-object-spread': 'error',
      'anti-slop/no-known-value-widening': 'error',
      'anti-slop/no-module-mocking': 'error',
      'anti-slop/no-object-parameters': 'error',
      'anti-slop/no-runtime-typeof': 'error',
      'anti-slop/no-shape-in-symbol-names': 'error',
      'anti-slop/no-unknown-parameters': 'error',
      'anti-slop/no-unknown-returns': 'error',
      'anti-slop/no-unknown-type-aliases': 'error',
      'anti-slop/no-unsafe-dictionary-type': 'error',
      'anti-slop/no-widen-then-assert': 'error',
      'anti-slop/require-safety-comment-for-type-assertion': 'error',
    },
  },
  {
    files: ['**/*.md'],
    language: 'markdown/gfm',
    plugins: { docs, markdown },
    rules: {
      'docs/no-missing-link': 'error',
    },
  },
  {
    files: ['CONTEXT-MAP.md'],
    language: 'markdown/gfm',
    plugins: { docs, markdown },
    rules: {
      'docs/context-map-complete': 'error',
    },
  },
];
