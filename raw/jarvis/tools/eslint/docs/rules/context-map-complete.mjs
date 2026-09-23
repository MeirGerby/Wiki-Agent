import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';

const placeholder = /[<>*]/;

const workspaceRootFrom = (file) => {
  let current = dirname(file);
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'nx.json'))) return current;
    current = dirname(current);
  }
  return dirname(file);
};

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the context map to give every app a row, and every row a path that exists',
    },
    messages: {
      missingPath: 'Row points at a missing path: {{target}}',
      missingRow: 'apps/{{app}} has no row',
      missingGlossary: 'apps/{{app}} has no glossary',
    },
  },
  create(context) {
    const workspaceRoot = workspaceRootFrom(context.filename);

    return {
      inlineCode(node) {
        const target = node.value;
        if (placeholder.test(target) || !target.includes('/')) return;
        if (existsSync(resolve(workspaceRoot, normalize(target)))) return;
        context.report({
          loc: node.position,
          messageId: 'missingPath',
          data: { target },
        });
      },
      root(node) {
        const map = context.sourceCode.text;
        const apps = readdirSync(join(workspaceRoot, 'apps'), {
          withFileTypes: true,
        })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);

        for (const app of apps) {
          const glossary = `apps/${app}/docs/CONTEXT.md`;
          if (!map.includes(glossary)) {
            context.report({
              loc: node.position,
              messageId: 'missingRow',
              data: { app },
            });
          }
          if (!existsSync(join(workspaceRoot, glossary))) {
            context.report({
              loc: node.position,
              messageId: 'missingGlossary',
              data: { app },
            });
          }
        }
      },
    };
  },
};
