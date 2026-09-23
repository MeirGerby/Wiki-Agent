import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import {
	classifyUnsafeDictionary,
	classifyUnsafeDictionaryValue,
	createTypeEnvironment,
	type TypeEnvironment,
} from "../shared/dictionary-types.ts";
import { visibleTypeAlias } from "../shared/type-alias-resolution.ts";

const typeNodeKinds: ReadonlySet<string> = new Set([
	"JSDocNonNullableType",
	"JSDocNullableType",
	"JSDocUnknownType",
	"TSAnyKeyword",
	"TSArrayType",
	"TSBigIntKeyword",
	"TSBooleanKeyword",
	"TSConditionalType",
	"TSConstructorType",
	"TSFunctionType",
	"TSImportType",
	"TSIndexedAccessType",
	"TSInferType",
	"TSIntersectionType",
	"TSIntrinsicKeyword",
	"TSLiteralType",
	"TSMappedType",
	"TSNamedTupleMember",
	"TSNeverKeyword",
	"TSNullKeyword",
	"TSNumberKeyword",
	"TSObjectKeyword",
	"TSStringKeyword",
	"TSSymbolKeyword",
	"TSTemplateLiteralType",
	"TSThisType",
	"TSTupleType",
	"TSTypeLiteral",
	"TSTypeOperator",
	"TSTypePredicate",
	"TSTypeQuery",
	"TSTypeReference",
	"TSUndefinedKeyword",
	"TSUnionType",
	"TSUnknownKeyword",
	"TSVoidKeyword",
]);

function isTypeNode(node: TSESTree.Node): node is TSESTree.TypeNode {
	return typeNodeKinds.has(node.type);
}

function typeReferenceName(type: TSESTree.TSTypeReference): string | null {
	return type.typeName.type === "Identifier" ? type.typeName.name : null;
}

function isInsideTypeAliasDeclaration(node: TSESTree.Node): boolean {
	let current: TSESTree.Node | null | undefined = node.parent;
	while (current !== null && current !== undefined && current.type !== "Program") {
		if (current.type === "TSTypeAliasDeclaration") return true;
		current = current.parent;
	}
	return false;
}

function isPlainAliasConsumerUse(node: TSESTree.TypeNode, environment: TypeEnvironment): boolean {
	if (node.type !== "TSTypeReference" || node.typeArguments?.params.length) return false;
	const name = typeReferenceName(node);
	return (
		name !== null &&
		visibleTypeAlias(name, node, environment.typeAliases) !== null &&
		!isInsideTypeAliasDeclaration(node)
	);
}

function isInsideTypeParameterConstraint(node: TSESTree.TypeNode): boolean {
	let child: TSESTree.Node = node;
	let parent: TSESTree.Node | null | undefined = child.parent;
	while (parent !== null && parent !== undefined && parent.type !== "Program") {
		if (parent.type === "TSTypeParameter" && parent.constraint === child) return true;
		child = parent;
		parent = child.parent;
	}
	return false;
}

function shouldReportType(node: TSESTree.TypeNode, environment: TypeEnvironment): boolean {
	if (isInsideTypeParameterConstraint(node)) return false;
	if (isPlainAliasConsumerUse(node, environment)) return false;
	if (classifyUnsafeDictionary(node, environment) === null) return false;
	let current: TSESTree.Node | null | undefined = node.parent;
	while (current !== null && current !== undefined && current.type !== "Program") {
		if (isTypeNode(current) && classifyUnsafeDictionary(current, environment) !== null)
			return false;
		current = current.parent;
	}
	return true;
}

/** Disallow object-dictionary contracts whose direct value type is an unsafe escape hatch. */
export const noUnsafeDictionaryTypeRule: TSESLint.RuleModule<"unsafeDictionary", []> = {
	defaultOptions: [],
	meta: {
		type: "problem",
		schema: [],
		docs: {
			description:
				"Disallow object-dictionary contracts whose direct value type is unknown, any, object, {}, or a union/alias containing one of those escape hatches.",
		},
		messages: {
			unsafeDictionary:
				"This dictionary's {{value}} value type gives callers no concrete value contract. Use an owner/schema-derived value type; parse external payloads before insertion.",
		},
	},
	create(context) {
		let environment: TypeEnvironment | null = null;
		const report = (node: TSESTree.Node, value: string) => {
			context.report({ node, messageId: "unsafeDictionary", data: { value } });
		};
		const reportIfUnsafe = (node: TSESTree.TypeNode) => {
			if (environment === null || !shouldReportType(node, environment)) return;
			const unsafe = classifyUnsafeDictionary(node, environment);
			if (unsafe === null) return;
			report(node, unsafe.unsafeValue);
		};

		return {
			Program(node) {
				environment = createTypeEnvironment(
					node,
					context.sourceCode.visitorKeys,
				);
			},
			TSTypeReference: reportIfUnsafe,
			TSTypeLiteral: reportIfUnsafe,
			TSMappedType: reportIfUnsafe,
			TSIndexSignature(node) {
				if (
					environment === null ||
					node.typeAnnotation === null ||
					node.typeAnnotation === undefined ||
					node.parent?.type === "TSTypeLiteral"
				)
					return;
				const unsafe = classifyUnsafeDictionaryValue(
					node.typeAnnotation.typeAnnotation,
					environment,
				);
				if (unsafe !== null) report(node, unsafe.unsafeValue);
			},
		};
	},
};
