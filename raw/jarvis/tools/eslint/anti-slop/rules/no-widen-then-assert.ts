import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

type BroadTypeKind = "top" | "object" | "record";

type KnownValueEvidence = {
  readonly type: TSESTree.TypeNode | null;
};

const functionBoundaryTypes = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression",
]);

function typeReferenceName(type: TSESTree.TSTypeReference): string | null {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}

function isUnknownOrAnyType(type: TSESTree.TypeNode): boolean {
  return type.type === "TSUnknownKeyword" || type.type === "TSAnyKeyword";
}

function isBroadRecordKeyType(type: TSESTree.TypeNode): boolean {
  if (
    type.type === "TSStringKeyword" ||
    type.type === "TSNumberKeyword" ||
    type.type === "TSSymbolKeyword"
  ) {
    return true;
  }
  if (type.type === "TSUnionType") return type.types.every(isBroadRecordKeyType);
  return type.type === "TSTypeReference" && typeReferenceName(type) === "PropertyKey";
}

function isBroadRecordType(type: TSESTree.TypeNode): boolean {
  if (type.type === "TSTypeReference") {
    if (typeReferenceName(type) === "Readonly") {
      const [inner] = type.typeArguments?.params ?? [];
      return inner !== undefined && isBroadRecordType(inner);
    }

    if (typeReferenceName(type) !== "Record") return false;
    const parameters = type.typeArguments?.params ?? [];
    return (
      parameters.length === 2 &&
      parameters[0] !== undefined &&
      parameters[1] !== undefined &&
      isBroadRecordKeyType(parameters[0]) &&
      isUnknownOrAnyType(parameters[1])
    );
  }

  if (type.type !== "TSTypeLiteral" || type.members.length !== 1) return false;
  const [member] = type.members;
  const [parameter] = member?.type === "TSIndexSignature" ? member.parameters : [];
  return (
    member?.type === "TSIndexSignature" &&
    member.parameters.length === 1 &&
    parameter !== undefined &&
    parameter.type === "Identifier" &&
    parameter.typeAnnotation !== undefined &&
    isBroadRecordKeyType(parameter.typeAnnotation.typeAnnotation) &&
    member.typeAnnotation !== undefined &&
    isUnknownOrAnyType(member.typeAnnotation.typeAnnotation)
  );
}

function broadTypeKind(type: TSESTree.TypeNode): BroadTypeKind | null {
  if (type.type === "TSUnknownKeyword" || type.type === "TSAnyKeyword") return "top";
  if (type.type === "TSObjectKeyword") return "object";
  return isBroadRecordType(type) ? "record" : null;
}

function assertedExpression(
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): TSESTree.Expression {
  return node.expression;
}

function assertionFromExpression(
  expression: TSESTree.Expression,
): TSESTree.TSAsExpression | TSESTree.TSTypeAssertion | null {
  return expression.type === "TSAsExpression" || expression.type === "TSTypeAssertion"
    ? expression
    : null;
}

function normalizedTypeText(sourceText: string, type: TSESTree.TypeNode): string {
  return sourceText.slice(type.range[0], type.range[1]).replaceAll(/\s+/gu, "");
}

function typesHaveSameSyntax(
  sourceText: string,
  left: TSESTree.TypeNode | null,
  right: TSESTree.TypeNode,
): boolean {
  return (
    left !== null &&
    normalizedTypeText(sourceText, left) === normalizedTypeText(sourceText, right)
  );
}

function isDefinitelyObjectType(type: TSESTree.TypeNode): boolean {
  switch (type.type) {
    case "TSArrayType":
    case "TSConstructorType":
    case "TSFunctionType":
    case "TSMappedType":
    case "TSObjectKeyword":
    case "TSTupleType":
      return true;
    case "TSTypeLiteral":
      return type.members.length > 0;
    case "TSIntersectionType":
      return type.types.every(isDefinitelyObjectType);
    case "TSTypeOperator":
      return (
        type.operator === "readonly" &&
        type.typeAnnotation !== undefined &&
        isDefinitelyObjectType(type.typeAnnotation)
      );
    default:
      return false;
  }
}

function isDefinitelyNarrowerRecordType(type: TSESTree.TypeNode): boolean {
  if (type.type === "TSTypeLiteral") {
    return type.members.some((member) => member.type !== "TSIndexSignature");
  }

  if (type.type !== "TSTypeReference") return false;
  if (typeReferenceName(type) === "Readonly") {
    const [inner] = type.typeArguments?.params ?? [];
    return inner !== undefined && isDefinitelyNarrowerRecordType(inner);
  }
  if (typeReferenceName(type) !== "Record") return false;

  const parameters = type.typeArguments?.params ?? [];
  return (
    parameters.length === 2 && parameters[1] !== undefined && !isUnknownOrAnyType(parameters[1])
  );
}

function functionBoundary(node: TSESTree.Node): TSESTree.Node | null {
  let current: TSESTree.Node | null | undefined = node.parent;
  while (current !== null && current !== undefined && current.type !== "Program") {
    if (functionBoundaryTypes.has(current.type)) return current;
    current = current.parent;
  }
  return null;
}

function resolvedVariableForIdentifier(
  scopes: readonly TSESLint.Scope.Scope[],
  identifier: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
  for (const scope of scopes) {
    const reference = scope.references.find(
      (candidate) =>
        candidate.identifier.range[0] === identifier.range[0] &&
        candidate.identifier.range[1] === identifier.range[1],
    );
    if (reference !== undefined) return reference.resolved;
  }
  return null;
}

function variableDeclarator(
  variable: TSESLint.Scope.Variable,
): TSESTree.VariableDeclarator | null {
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator") {
      return definition.node;
    }
  }
  return null;
}

function knownValueEvidence(
  expression: TSESTree.Expression,
  scopes: readonly TSESLint.Scope.Scope[],
  boundary: TSESTree.Node | null,
  visitedVariables: ReadonlySet<TSESLint.Scope.Variable>,
): KnownValueEvidence | null {
  const unwrapped = expression;

  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    if (broadTypeKind(unwrapped.typeAnnotation) !== null) return null;
    return { type: unwrapped.typeAnnotation };
  }

  if (unwrapped.type === "Literal" || unwrapped.type === "TemplateLiteral") {
    return { type: null };
  }

  if (
    unwrapped.type === "ArrayExpression" ||
    unwrapped.type === "ArrowFunctionExpression" ||
    unwrapped.type === "ClassExpression" ||
    unwrapped.type === "FunctionExpression" ||
    unwrapped.type === "NewExpression" ||
    unwrapped.type === "ObjectExpression"
  ) {
    return { type: null };
  }

  if (unwrapped.type !== "Identifier") return null;
  const variable = resolvedVariableForIdentifier(scopes, unwrapped);
  if (variable === null || visitedVariables.has(variable)) return null;

  const annotatedIdentifier = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== undefined,
  );
  const annotation = annotatedIdentifier?.typeAnnotation?.typeAnnotation;
  if (annotation !== undefined && annotatedIdentifier !== undefined) {
    if (functionBoundary(annotatedIdentifier) !== boundary || broadTypeKind(annotation) !== null) {
      return null;
    }
    return { type: annotation };
  }

  const declarator = variableDeclarator(variable);
  const declaration = declarator?.parent;
  if (
    declarator === null ||
    declaration === undefined ||
    declaration.type !== "VariableDeclaration" ||
    declaration.kind !== "const" ||
    declarator.init === null ||
    variable.references.some((reference) => reference.isWrite() && !reference.init) ||
    functionBoundary(declarator) !== boundary
  ) {
    return null;
  }

  return knownValueEvidence(
    declarator.init,
    scopes,
    boundary,
    new Set([...visitedVariables, variable]),
  );
}

function widenedBinding(
  variable: TSESLint.Scope.Variable,
  scopes: readonly TSESLint.Scope.Scope[],
): {
  readonly broadKind: BroadTypeKind;
  readonly evidence: KnownValueEvidence;
  readonly declaredAt: number;
  readonly boundary: TSESTree.Node | null;
} | null {
  const declarator = variableDeclarator(variable);
  const declaration = declarator?.parent;
  if (
    declarator === null ||
    declaration === undefined ||
    declaration.type !== "VariableDeclaration" ||
    declaration.kind !== "const" ||
    declarator.id.type !== "Identifier" ||
    declarator.init === null ||
    variable.references.some((reference) => reference.isWrite() && !reference.init)
  ) {
    return null;
  }

  const boundary = functionBoundary(declarator);
  const declaredType = declarator.id.typeAnnotation?.typeAnnotation;
  const initializerAssertion = assertionFromExpression(declarator.init);
  const initializerBroadKind =
    initializerAssertion === null ? null : broadTypeKind(initializerAssertion.typeAnnotation);
  const declaredBroadKind = declaredType === undefined ? null : broadTypeKind(declaredType);
  const broadKind = declaredBroadKind ?? initializerBroadKind;
  if (broadKind === null) return null;

  const originalExpression =
    initializerAssertion !== null && initializerBroadKind !== null
      ? assertedExpression(initializerAssertion)
      : declarator.init;
  const evidence = knownValueEvidence(originalExpression, scopes, boundary, new Set([variable]));
  return evidence === null
    ? null
    : { broadKind, evidence, declaredAt: declarator.range[1], boundary };
}

function assertionIsNarrower(
  sourceText: string,
  broadKind: BroadTypeKind,
  evidence: KnownValueEvidence,
  assertedType: TSESTree.TypeNode,
): boolean {
  if (broadTypeKind(assertedType) !== null) return false;
  if (broadKind === "top") return true;
  if (typesHaveSameSyntax(sourceText, evidence.type, assertedType)) return true;
  if (broadKind === "object") return isDefinitelyObjectType(assertedType);
  return isDefinitelyNarrowerRecordType(assertedType);
}

/** Detect immutable local bindings that erase a known type and are later asserted back to a narrower type. */
export const noWidenThenAssertRule: TSESLint.RuleModule<"widenThenAssert", []> = {
  defaultOptions: [],
  meta: {
    type: "problem",
    schema: [],
    docs: {
      description:
        "Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.",
    },
    messages: {
      widenThenAssert:
        'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.',
    },
  },
  create(context) {
    let scopes: readonly TSESLint.Scope.Scope[] = [];

    const checkAssertion = (node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion) => {
      const expression = assertedExpression(node);
      if (expression.type !== "Identifier") return;

      const variable = resolvedVariableForIdentifier(scopes, expression);
      if (variable === null) return;
      const widened = widenedBinding(variable, scopes);
      if (
        widened === null ||
        node.range[0] <= widened.declaredAt ||
        functionBoundary(node) !== widened.boundary ||
        !assertionIsNarrower(
          context.sourceCode.text,
          widened.broadKind,
          widened.evidence,
          node.typeAnnotation,
        )
      ) {
        return;
      }

      context.report({
        node,
        messageId: "widenThenAssert",
        data: { name: expression.name },
      });
    };

    return {
      Program() {
        scopes = context.sourceCode.scopeManager?.scopes ?? [];
      },
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
};
