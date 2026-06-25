import { Form, Link, useLoaderData } from "react-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Inbox,
  Search,
  Ticket,
  X,
} from "lucide-react";
import type { TicketCategory, TicketPriority, TicketStatus } from "~/types/schema";
import type { SerializedTicket } from "~/utils/serializers";
import type { TicketStats } from "~/data/tickets";
import {
  buildTicketListUrl,
  formatDate,
  formatTicketNumber,
  hasActiveListFilters,
  type TicketListFilters,
} from "~/utils";

const ticketStatusLabels: Record<TicketStatus, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const ticketCategoryLabels: Record<TicketCategory, string> = {
  FINANZAS: "Finanzas",
  LEGAL: "Legal",
  COMPRAS: "Compras",
  OPERACIONES: "Operaciones",
};

const ticketPriorityLabels: Record<TicketPriority, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

// Obtener los chips de filtros
function getFilterChips(filters: TicketListFilters) {
  const chips: { key: keyof TicketListFilters; label: string }[] = [];

  if (filters.search) {
    chips.push({ key: "search", label: `Búsqueda: "${filters.search}"` });
  }

  if (filters.status) {
    const statusLabel =
      filters.status === "RESUELTOS"
        ? "Resueltos"
        : ticketStatusLabels[filters.status as TicketStatus];
    chips.push({ key: "status", label: `Estado: ${statusLabel}` });
  }

  if (filters.priority) {
    chips.push({
      key: "priority",
      label: `Prioridad: ${ticketPriorityLabels[filters.priority]}`,
    });
  }

  if (filters.category) {
    chips.push({
      key: "category",
      label: `Categoría: ${ticketCategoryLabels[filters.category]}`,
    });
  }

  return chips;
}

export function TicketDashboard() {
  const { tickets, total, page, pageSize, stats, filters } = useLoaderData<{
    tickets: SerializedTicket[];
    total: number;
    page: number;
    pageSize: number;
    stats: TicketStats;
    filters: TicketListFilters;
  }>();
  const filterChips = getFilterChips(filters);
  const hasFilters = hasActiveListFilters(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // Estadísticas de la barra lateral
  const dashboardStats = [
    {
      label: "Total tickets",
      value: stats.total,
      icon: Inbox,
      tone: "default" as const,
      hint: "En el sistema",
    },
    {
      label: "Nuevos",
      value: stats.nuevos,
      icon: CircleDot,
      tone: "info" as const,
      hint: "Sin asignar",
    },
    {
      label: "En progreso",
      value: stats.enProgreso,
      icon: Clock,
      tone: "warning" as const,
      hint: "Activos ahora",
    },
    {
      label: "Resueltos",
      value: stats.resueltos,
      icon: CheckCircle,
      tone: "success" as const,
      hint: "Completados",
    },
  ];

  // Colores de los iconos de las estadísticas
  const statIconBg = {
    default: "bg-primary-subtle text-foreground",
    info: "bg-accent-info-subtle text-accent-info",
    warning: "bg-accent-warning-subtle text-accent-warning",
    success: "bg-accent-success-subtle text-accent-success",
  } as const;

  // Colores de los bordes de las estadísticas
  const statAccentBorder = {
    default: "border-l-foreground",
    info: "border-l-accent-info",
    warning: "border-l-accent-warning",
    success: "border-l-accent-success",
  } as const;

  // Parámetros de la URL
  const searchParams = new URLSearchParams();
  if (filters.search) searchParams.set("q", filters.search);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.priority) searchParams.set("priority", filters.priority);
  if (filters.category) searchParams.set("category", filters.category);
  if (page > 1) searchParams.set("page", String(page));

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen de tickets</h2>
          {hasFilters && (
            <p className="mt-1 text-sm text-muted-foreground">
              Mostrando {total} resultado{total === 1 ? "" : "s"}{" "}
              filtrado{total === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Form method="get" className="relative w-full sm:max-w-xs">
          {filters.status && (
            <input type="hidden" name="status" value={filters.status} />
          )}
          {filters.priority && (
            <input type="hidden" name="priority" value={filters.priority} />
          )}
          {filters.category && (
            <input type="hidden" name="category" value={filters.category} />
          )}
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="Buscar por número, cliente o solicitud..."
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-primary-subtle/40 py-3 pr-4 pl-10 text-sm outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-foreground/20 focus:bg-background focus:outline-none focus:ring-2 focus:ring-foreground/5 focus-visible:outline-none"
          />
        </Form>
      </div>

      {filterChips.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {filterChips.map((chip) => {
            const paramKey =
              chip.key === "search"
                ? "q"
                : (chip.key as "status" | "priority" | "category");

            return (
              <Link
                key={chip.key}
                to={buildTicketListUrl(searchParams, { [paramKey]: null })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium transition-colors hover:bg-primary-subtle"
              >
                {chip.label}
                <X className="h-3 w-3 text-muted-foreground" />
              </Link>
            );
          })}
          <Link
            to="/"
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </Link>
        </div>
      )}

      <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={[
                "rounded-xl border border-border border-l-4 bg-surface p-5 shadow-sm",
                statAccentBorder[stat.tone],
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    statIconBg[stat.tone],
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {hasFilters ? "Tickets filtrados" : "Tickets recientes"}
            </h3>
          </div>
          <Link
            to="/tickets/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Ticket className="h-4 w-4" />
            Nuevo ticket
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-primary-subtle/40 px-6 py-14 text-center">
            <h4 className="text-base font-semibold">
              {hasFilters ? "Sin resultados" : "Aún no hay tickets"}
            </h4>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "No hay tickets que coincidan con los filtros seleccionados."
                : "Crea el primer ticket para empezar a trabajar."}
            </p>
            {hasFilters ? (
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle"
              >
                Limpiar filtros
              </Link>
            ) : (
              <Link
                to="/tickets/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle"
              >
                <Ticket className="h-4 w-4" />
                Crear primer ticket
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-muted-foreground">
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Nº
                    </th>
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Cliente
                    </th>
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Estado
                    </th>
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Categoría
                    </th>
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Prioridad
                    </th>
                    <th className="sticky top-0 z-10 bg-surface px-3 py-3 font-medium">
                      Creado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-border/70 transition-colors hover:bg-primary-subtle/40"
                    >
                      <td className="px-3 py-3">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-mono text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                        >
                          #{formatTicketNumber(ticket.ticketNumber)}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.clientName}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {ticketStatusLabels[ticket.status]}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.category
                          ? ticketCategoryLabels[ticket.category]
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.priority
                          ? ticketPriorityLabels[ticket.priority]
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {rangeStart}–{rangeEnd} de {total}
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      to={buildTicketListUrl(searchParams, {
                        page: page - 1 === 1 ? null : String(page - 1),
                      })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </span>
                  )}
                  <span className="px-2 text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      to={buildTicketListUrl(searchParams, {
                        page: String(page + 1),
                      })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-subtle"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
