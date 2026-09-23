import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

export type FunctionParameter = TSESTree.Parameter;

/** Return whether a type is or contains TypeScript's absorbing unknown top type. */
export function containsUnknownType(type: TSESTree.TypeNode): boolean {
	if (type.type === "TSUnknownKeyword") return true;
	return type.type === "TSUnionType" && type.types.some(containsUnknownType);
}

/** Return the TypeScript annotation attached to a function parameter or its wrapped binding. */
export function functionParameterTypeAnnotation(
	parameter: FunctionParameter,
): TSESTree.TSTypeAnnotation | null | undefined {
	if (parameter.type === "TSParameterProperty") {
		return functionParameterTypeAnnotation(parameter.parameter);
	}
	if (parameter.type === "RestElement") {
		return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.argument);
	}
	if (parameter.type === "AssignmentPattern") {
		return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.left);
	}
	return parameter.typeAnnotation;
}

/** Return only a function parameter's local binding, excluding its annotation and default value. */
export function functionParameterBindingName(
	parameter: FunctionParameter,
	sourceCode: TSESLint.SourceCode,
): string {
	if (parameter.type === "TSParameterProperty") {
		return functionParameterBindingName(parameter.parameter, sourceCode);
	}
	if (parameter.type === "AssignmentPattern") {
		return functionParameterBindingName(parameter.left, sourceCode);
	}
	if (parameter.type === "RestElement") {
		return functionParameterBindingName(parameter.argument, sourceCode);
	}
	if (parameter.type === "Identifier") return parameter.name;

	const sourceText = sourceCode.getText(parameter);
	const annotationStart = parameter.typeAnnotation?.range[0];
	return annotationStart === undefined
		? sourceText
		: sourceText.slice(0, annotationStart - parameter.range[0]).trimEnd();
}
