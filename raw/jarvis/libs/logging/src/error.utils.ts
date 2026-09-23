export type SerializedError = {
  name: string;
  message: string;
  stack: string | undefined;
};

export function serializeError<T>(error: T): T | SerializedError {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}
