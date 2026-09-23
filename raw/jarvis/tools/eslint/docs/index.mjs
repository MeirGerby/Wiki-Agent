import contextMapComplete from './rules/context-map-complete.mjs';
import noMissingLink from './rules/no-missing-link.mjs';

export default {
  meta: { name: 'docs' },
  rules: {
    'context-map-complete': contextMapComplete,
    'no-missing-link': noMissingLink,
  },
};
