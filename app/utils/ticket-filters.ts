import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/enums";

export const STATUS_FILTER_RESUELTOS = "RESUELTOS";

export type TicketListFilters = {
  search?: string;
  status?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
};

export function parseTicketListFilters(
  searchParams: URLSearchParams,
): TicketListFilters {
  const search = searchParams.get("q")?.trim() || undefined;
  const statusParam = searchParams.get("status")?.trim();
  const priorityParam = searchParams.get("priority")?.trim();
  const categoryParam = searchParams.get("category")?.trim();

  const priority =
    priorityParam &&
    Object.values(TicketPriority).includes(priorityParam as TicketPriority)
      ? (priorityParam as TicketPriority)
      : undefined;

  const category =
    categoryParam &&
    Object.values(TicketCategory).includes(categoryParam as TicketCategory)
      ? (categoryParam as TicketCategory)
      : undefined;

  const status =
    statusParam === STATUS_FILTER_RESUELTOS ||
    (statusParam &&
      Object.values(TicketStatus).includes(statusParam as TicketStatus))
      ? statusParam
      : undefined;

  return { search, status, priority, category };
}

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

export function hasActiveListFilters(filters: TicketListFilters): boolean {
  return Boolean(
    filters.search || filters.status || filters.priority || filters.category,
  );
}
