export type DataErrorCode = "NOT_FOUND" | "VALIDATION" | "DATABASE";

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: DataErrorCode };

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Error inesperado en la base de datos";
}
