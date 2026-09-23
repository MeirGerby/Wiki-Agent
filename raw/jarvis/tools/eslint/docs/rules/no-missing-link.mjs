import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const external = /^(https?:|mailto:|#)/;
const placeholder = /[<>*]/;
const importDirective = /(?:^|\s)@([^\s)]+\.md)/g;

const resolves = (fromFile, target) =>
  existsSync(resolve(dirname(fromFile), target));

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require every relative link and every @import to name a file that exists',
    },
    messages: {
      missingLink: 'Link points at a missing file: {{target}}',
      missingImport: 'Import points at a missing file: @{{target}}',
    },
  },
  create(context) {
    const checkUrl = (node) => {
      const target = node.url;
      if (!target || external.test(target) || placeholder.test(target)) return;
      const path = target.split('#')[0];
      if (!path || resolves(context.filename, path)) return;
      context.report({
        loc: node.position,
        messageId: 'missingLink',
        data: { target },
      });
    };

    return {
      definition: checkUrl,
      image: checkUrl,
      link: checkUrl,
      text(node) {
        for (const [, target] of node.value.matchAll(importDirective)) {
          if (resolves(context.filename, target)) continue;
          context.report({
            loc: node.position,
            messageId: 'missingImport',
            data: { target },
          });
        }
      },
    };
  },
};
