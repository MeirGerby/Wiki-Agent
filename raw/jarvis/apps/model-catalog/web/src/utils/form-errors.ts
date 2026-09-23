export function firstMessage(errors: readonly unknown[]): string | undefined {
  /* eslint-disable anti-slop/no-runtime-typeof -- react-form errors arrive as untyped string | issue-object */
  for (const error of errors) {
    if (error === undefined || error === null) continue;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }
  }
  /* eslint-enable anti-slop/no-runtime-typeof */
  return undefined;
}
