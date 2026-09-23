import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

function isEmptyObjectExpression(node: TSESTree.Expression): boolean {
  return node.type === "ObjectExpression" && node.properties.length === 0;
}

function isConditionalEmptyObjectSpread(node: TSESTree.Expression): boolean {
  return (
    node.type === "ConditionalExpression" &&
    (isEmptyObjectExpression(node.consequent) || isEmptyObjectExpression(node.alternate))
  );
}

/** Ban conditional empty-object spreads without changing their omission semantics. */
export const noConditionalEmptyObjectSpreadRule: TSESLint.RuleModule<"avoid", []> = {
  defaultOptions: [],
  meta: {
    type: "suggestion",
    schema: [],
    docs: {
      description:
        "Disallow object spreads that conditionally spread an empty object to omit fields.",
    },
    messages: {
      avoid:
        "This conditional spread hides property omission behind an empty object. Build the object in separate statements and add the property only when present.",
    },
  },
  create(context) {
    return {
      SpreadElement(node) {
        if (node.parent?.type !== "ObjectExpression") return;

        if (isConditionalEmptyObjectSpread(node.argument)) {
          context.report({ node, messageId: "avoid" });
        }
      },
    };
  },
};
