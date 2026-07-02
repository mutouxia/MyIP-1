export async function measure<T>(task: () => Promise<T>): Promise<{ value: T; durationMs: number }> {
  const startedAt = performance.now();
  const value = await task();
  return {
    value,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
