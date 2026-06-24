import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "~/types/schema";

// ------------------------------------------------------------
// Resultados de operaciones
// ------------------------------------------------------------
export type DataErrorCode = "NOT_FOUND" | "VALIDATION" | "DATABASE";
export type ErrorCode = DataErrorCode | "CONFIG" | "AI";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ErrorCode };

/** @deprecated Usar Result */
export type DataResult<T> = Result<T>;

// Obtener mensaje de error desde una excepción
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}

export const TICKET_CATEGORIES = [
  "FINANZAS",
  "LEGAL",
  "COMPRAS",
  "OPERACIONES",
] as const satisfies readonly TicketCategory[];

export const TICKET_PRIORITIES = ["ALTA", "MEDIA", "BAJA"] as const satisfies readonly TicketPriority[];

export const TICKET_STATUSES = [
  "ABIERTO",
  "EN_PROGRESO",
  "RESUELTO",
  "CERRADO",
] as const satisfies readonly TicketStatus[];

export const CLASSIFICATION_STATUSES = [
  "PENDIENTE",
  "COMPLETADA",
  "FALLIDA",
] as const;

// Verificar si el valor es una categoría válida
export function isTicketCategory(value: string): value is TicketCategory {
  return (TICKET_CATEGORIES as readonly string[]).includes(value);
}

// Verificar si el valor es una prioridad válida
export function isTicketPriority(value: string): value is TicketPriority {
  return (TICKET_PRIORITIES as readonly string[]).includes(value);
}

// Verificar si el valor es un estado válido
export function isTicketStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(value);
}

export type TicketListFilters = {
  search?: string;
  status?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
};

// Parsear filtros de la URL del listado
export function parseTicketListFilters(
  searchParams: URLSearchParams,
): TicketListFilters {
  const search = searchParams.get("q")?.trim() || undefined;
  const statusParam = searchParams.get("status")?.trim();
  const priorityParam = searchParams.get("priority")?.trim();
  const categoryParam = searchParams.get("category")?.trim();

  const priority =
    priorityParam && isTicketPriority(priorityParam) ? priorityParam : undefined;

  const category =
    categoryParam && isTicketCategory(categoryParam) ? categoryParam : undefined;

  const status =
    statusParam === "RESUELTOS" ||
    (statusParam && isTicketStatus(statusParam))
      ? statusParam
      : undefined;

  return { search, status, priority, category };
}

// Construir URL del listado con filtros
export function buildTicketListUrl(
  current: URLSearchParams,
  update: Partial<Record<"q" | "status" | "priority" | "category", string | null>>,
): string {
  const params = new URLSearchParams(current);

  for (const [key, value] of Object.entries(update)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

// Indicar si hay filtros activos
export function hasActiveListFilters(filters: TicketListFilters): boolean {
  return Boolean(
    filters.search || filters.status || filters.priority || filters.category,
  );
}

/**
 * Obtener datos del formulario de la solicitud
 */
export async function getFormDataRequest(
  request: Request,
): Promise<Record<any, any>> {
  const contentType = request.headers.get("content-type") || "";
  let payload: Record<string, any> = {};

  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries());
  } else if (contentType.trim().length === 0) {
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }
  } else {
    payload = {};
    throw new Error("Unsupported Content-Type: " + contentType);
  }
  return payload;
}

export * from "./serializers";