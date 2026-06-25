import type OpenAI from "openai";
import { listAssignees } from "~/data/assignees";
import { addComment } from "~/data/comments";
import {
  classifyTicketWithAi,
  createTicket,
  getAssigneeWorkload,
  getSidebarFilterCounts,
  getTicketByNumber,
  getTicketStats,
  listTickets,
  updateTicketAssignee,
  updateTicketStatus,
} from "~/data/tickets";
import { formatTicketNumber } from "~/utils";
import { serializeTicket } from "~/utils/serializers";
import type { Ticket } from "~/types/schema";

// Definición de las herramientas expuestas al modelo
export const chatTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_tickets",
      description:
        "Busca y lista tickets aplicando filtros opcionales. Útil para responder cuántos tickets hay o encontrar tickets que cumplen ciertos criterios.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description:
              "Texto libre para buscar por nombre de cliente, contenido de la solicitud o número de ticket.",
          },
          status: {
            type: "string",
            enum: ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO", "RESUELTOS"],
            description:
              "Filtra por estado. Usa 'RESUELTOS' para incluir RESUELTO y CERRADO juntos.",
          },
          priority: {
            type: "string",
            enum: ["ALTA", "MEDIA", "BAJA"],
          },
          category: {
            type: "string",
            enum: ["FINANZAS", "LEGAL", "COMPRAS", "OPERACIONES"],
          },
          page: {
            type: "integer",
            description: "Página de resultados (10 por página). Por defecto 1.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ticket",
      description:
        "Obtiene el detalle completo de un ticket por su número de seguimiento, incluyendo comentarios y responsable.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: {
            type: "integer",
            description: "Número de seguimiento del ticket, p. ej. 12.",
          },
        },
        required: ["ticketNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stats",
      description:
        "Devuelve estadísticas globales: totales por estado, prioridad y categoría.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_workload",
      description:
        "Devuelve la carga de trabajo por responsable: tickets abiertos y en progreso asignados a cada persona.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_assignees",
      description: "Lista los responsables registrados en el sistema.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description:
        "Crea un nuevo ticket. La categoría, prioridad y resumen se asignan automáticamente por IA.",
      parameters: {
        type: "object",
        properties: {
          clientName: {
            type: "string",
            description: "Nombre del cliente o solicitante.",
          },
          requestText: {
            type: "string",
            description: "Descripción de la solicitud del cliente.",
          },
          attachmentUrl: {
            type: "string",
            description: "URL de un adjunto opcional.",
          },
        },
        required: ["clientName", "requestText"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ticket_status",
      description: "Cambia el estado de un ticket existente.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: { type: "integer" },
          status: {
            type: "string",
            enum: ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"],
          },
        },
        required: ["ticketNumber", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_ticket",
      description:
        "Asigna (o reasigna) un ticket a un responsable por nombre. Si el responsable no existe, se crea. Usa assigneeName vacío o null para desasignar.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: { type: "integer" },
          assigneeName: {
            type: ["string", "null"],
            description: "Nombre del responsable. Null o vacío para desasignar.",
          },
        },
        required: ["ticketNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_comment",
      description: "Agrega un comentario a un ticket.",
      parameters: {
        type: "object",
        properties: {
          ticketNumber: { type: "integer" },
          content: { type: "string", description: "Texto del comentario." },
        },
        required: ["ticketNumber", "content"],
      },
    },
  },
];

// Versión compacta de un ticket para enviar al modelo y renderizar tarjetas
function compactTicket(ticket: Ticket) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    numero: `#${formatTicketNumber(ticket.ticketNumber)}`,
    clientName: ticket.clientName,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    summary: ticket.summary,
    assignee: ticket.assignee?.name ?? null,
  };
}

type ToolOutcome =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10);
  return Number.NaN;
}

// Ejecuta una herramienta por nombre con los argumentos dados por el modelo
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: { userName: string | null },
): Promise<ToolOutcome> {
  switch (name) {
    case "search_tickets": {
      const result = await listTickets({
        search: typeof args.search === "string" ? args.search : undefined,
        status: typeof args.status === "string" ? args.status : undefined,
        priority: args.priority as never,
        category: args.category as never,
        page: typeof args.page === "number" ? args.page : undefined,
      });
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        data: {
          total: result.data.total,
          page: result.data.page,
          pageSize: result.data.pageSize,
          tickets: result.data.tickets.map(compactTicket),
        },
      };
    }

    case "get_ticket": {
      const result = await getTicketByNumber(toNumber(args.ticketNumber));
      if (!result.ok) return { ok: false, error: result.error };
      const t = result.data;
      return {
        ok: true,
        data: {
          ...compactTicket(t),
          requestText: t.requestText,
          attachmentUrl: t.attachmentUrl,
          createdAt: t.createdAt,
          comments: (t.comments ?? []).map((c) => ({
            author: c.author,
            content: c.content,
            createdAt: c.createdAt,
          })),
        },
      };
    }

    case "get_stats": {
      const [stats, counts] = await Promise.all([
        getTicketStats(),
        getSidebarFilterCounts(),
      ]);
      if (!stats.ok) return { ok: false, error: stats.error };
      if (!counts.ok) return { ok: false, error: counts.error };
      return {
        ok: true,
        data: { resumen: stats.data, detalle: counts.data },
      };
    }

    case "get_workload": {
      const result = await getAssigneeWorkload();
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, data: { responsables: result.data } };
    }

    case "list_assignees": {
      const result = await listAssignees();
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        data: { responsables: result.data.map((a) => a.name) },
      };
    }

    case "create_ticket": {
      const created = await createTicket({
        clientName: String(args.clientName ?? ""),
        requestText: String(args.requestText ?? ""),
        attachmentUrl:
          typeof args.attachmentUrl === "string" ? args.attachmentUrl : null,
      });
      if (!created.ok) return { ok: false, error: created.error };

      const classified = await classifyTicketWithAi(created.data.id, {
        clientName: created.data.clientName,
        requestText: created.data.requestText,
      });

      const finalTicket = classified.ok ? classified.data : created.data;
      return {
        ok: true,
        data: {
          ...compactTicket(serializeTicket(finalTicket) as unknown as Ticket),
          clasificada: classified.ok,
        },
      };
    }

    case "update_ticket_status": {
      const ticketResult = await getTicketByNumber(toNumber(args.ticketNumber));
      if (!ticketResult.ok) return { ok: false, error: ticketResult.error };
      const result = await updateTicketStatus(
        ticketResult.data.id,
        String(args.status ?? ""),
      );
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        data: {
          id: result.data.id,
          ticketNumber: result.data.ticketNumber,
          numero: `#${formatTicketNumber(result.data.ticketNumber)}`,
          status: result.data.status,
        },
      };
    }

    case "assign_ticket": {
      const ticketResult = await getTicketByNumber(toNumber(args.ticketNumber));
      if (!ticketResult.ok) return { ok: false, error: ticketResult.error };
      const assigneeName =
        typeof args.assigneeName === "string" ? args.assigneeName : null;
      const result = await updateTicketAssignee(ticketResult.data.id, assigneeName);
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        data: {
          id: result.data.id,
          ticketNumber: result.data.ticketNumber,
          numero: `#${formatTicketNumber(result.data.ticketNumber)}`,
          assignee: result.data.assignee?.name ?? null,
        },
      };
    }

    case "add_comment": {
      const ticketResult = await getTicketByNumber(toNumber(args.ticketNumber));
      if (!ticketResult.ok) return { ok: false, error: ticketResult.error };
      const result = await addComment({
        ticketId: ticketResult.data.id,
        content: String(args.content ?? ""),
        author: context.userName,
      });
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        data: {
          id: ticketResult.data.id,
          ticketNumber: ticketResult.data.ticketNumber,
          numero: `#${formatTicketNumber(ticketResult.data.ticketNumber)}`,
          comentario: result.data.content,
          autor: result.data.author,
        },
      };
    }

    default:
      return { ok: false, error: `Herramienta desconocida: ${name}` };
  }
}
