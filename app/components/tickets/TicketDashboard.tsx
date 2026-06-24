import { Form, Link } from "react-router";
import {
  CheckCircle,
  CircleDot,
  Clock,
  Inbox,
  Search,
  Ticket,
} from "lucide-react";
import {
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketStatusLabels,
} from "~/config/ticket-labels";
import type { SerializedTicket } from "~/data/serializers";
import type { TicketStats } from "~/data/tickets";

type TicketDashboardProps = {
  tickets: SerializedTicket[];
  stats: TicketStats;
  search: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function TicketDashboard({ tickets, stats, search }: TicketDashboardProps) {
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

  const statIconBg = {
    default: "bg-primary-subtle text-foreground",
    info: "bg-accent-info-subtle text-accent-info",
    warning: "bg-accent-warning-subtle text-accent-warning",
    success: "bg-accent-success-subtle text-accent-success",
  } as const;

  const statAccentBorder = {
    default: "border-l-foreground",
    info: "border-l-accent-info",
    warning: "border-l-accent-warning",
    success: "border-l-accent-success",
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resumen de tickets</h2>
        </div>
        <Form method="get" className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Buscar ticket..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
        </Form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Tickets recientes</h3>
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-primary-subtle/40 px-6 py-14 text-center">
            <h4 className="text-base font-semibold">
              {search ? "Sin resultados" : "Aún no hay tickets"}
            </h4>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {search
                ? "Prueba con otro término de búsqueda."
                : "Crea el primer ticket para empezar a trabajar."}
            </p>
            {!search && (
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium">Categoría</th>
                  <th className="px-3 py-3 font-medium">Prioridad</th>
                  <th className="px-3 py-3 font-medium">Creado</th>
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
        )}
      </div>
    </div>
  );
}
