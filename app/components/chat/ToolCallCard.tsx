import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  type LucideIcon,
  MessageSquarePlus,
  PlusCircle,
  Search,
  Tag,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import type { ChatToolCall, ChatToolResult } from "~/types/schema";
import { TOOL_LABELS } from "./types";

const TOOL_ICONS: Record<string, LucideIcon> = {
  search_tickets: Search,
  get_ticket: Ticket,
  get_stats: Tag,
  get_workload: Users,
  list_assignees: Users,
  create_ticket: PlusCircle,
  update_ticket_status: Tag,
  assign_ticket: UserCog,
  add_comment: MessageSquarePlus,
};

type ToolCallCardProps = {
  toolCall: ChatToolCall;
  toolResult?: ChatToolResult;
};

type TicketLike = {
  id?: string;
  ticketNumber?: number;
  numero?: string;
  clientName?: string;
  status?: string;
  priority?: string | null;
  category?: string | null;
  assignee?: string | null;
  summary?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Tarjeta compacta de un ticket dentro del resultado de una herramienta
function TicketChip({ ticket }: { ticket: TicketLike }) {
  const number = ticket.ticketNumber;
  const label = ticket.numero ?? (number ? `#${number}` : "Ticket");
  const inner = (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-foreground">
          {label}
        </span>
        {ticket.status && (
          <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ticket.status}
          </span>
        )}
        {ticket.priority && (
          <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ticket.priority}
          </span>
        )}
      </div>
      {ticket.clientName && (
        <span className="text-xs font-medium text-foreground">
          {ticket.clientName}
        </span>
      )}
      {ticket.summary && (
        <span className="line-clamp-2 text-xs text-muted-foreground">
          {ticket.summary}
        </span>
      )}
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      {ticket.id ? (
        <Link to={`/tickets/${ticket.id}`} className="block hover:opacity-80">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}

// Render del contenido del resultado según la herramienta
function ToolResultBody({
  toolResult,
}: {
  toolResult: ChatToolResult;
}) {
  if (!toolResult.ok) {
    return (
      <p className="text-xs text-accent-danger">{toolResult.error}</p>
    );
  }

  const data = toolResult.data;
  if (!isRecord(data)) return null;

  // Listado de tickets (search_tickets)
  if (Array.isArray(data.tickets)) {
    const tickets = data.tickets as TicketLike[];
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {typeof data.total === "number"
            ? `${data.total} ticket(s) encontrados`
            : `${tickets.length} ticket(s)`}
        </p>
        {tickets.slice(0, 5).map((t, i) => (
          <TicketChip key={t.ticketNumber ?? i} ticket={t} />
        ))}
        {tickets.length > 5 && (
          <p className="text-xs text-muted-foreground">
            …y {tickets.length - 5} más
          </p>
        )}
      </div>
    );
  }

  // Carga por responsable (get_workload)
  if (Array.isArray(data.responsables) && data.responsables.length > 0 && isRecord(data.responsables[0])) {
    const rows = data.responsables as {
      assigneeName: string;
      abiertos: number;
      enProgreso: number;
      total: number;
    }[];
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-primary-subtle text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 font-medium">Responsable</th>
              <th className="px-2 py-1.5 font-medium">Abiertos</th>
              <th className="px-2 py-1.5 font-medium">En progreso</th>
              <th className="px-2 py-1.5 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.assigneeName} className="border-t border-border">
                <td className="px-2 py-1.5 font-medium text-foreground">
                  {r.assigneeName}
                </td>
                <td className="px-2 py-1.5 tabular-nums">{r.abiertos}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.enProgreso}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Lista simple de nombres de responsables (list_assignees)
  if (Array.isArray(data.responsables)) {
    const names = data.responsables as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {names.map((n) => (
          <span
            key={n}
            className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {n}
          </span>
        ))}
      </div>
    );
  }

  // Ticket único o resultado de acción con ticketNumber
  if (data.ticketNumber || data.numero) {
    return <TicketChip ticket={data as TicketLike} />;
  }

  // Estadísticas (get_stats)
  if (isRecord(data.resumen)) {
    const r = data.resumen as Record<string, number>;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(r).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {key}
            </p>
            <p className="text-lg font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function ToolCallCard({ toolCall, toolResult }: ToolCallCardProps) {
  const Icon = TOOL_ICONS[toolCall.name] ?? Ticket;
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;
  const isPending = !toolResult;
  const isError = toolResult && !toolResult.ok;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-xs font-semibold text-foreground">
          {label}
        </span>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4 text-accent-danger" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-accent-success" />
        )}
      </div>

      {toolResult && (
        <div className="mt-2.5 border-t border-border pt-2.5">
          <ToolResultBody toolResult={toolResult} />
        </div>
      )}
    </div>
  );
}
