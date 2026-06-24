import {
  ClassificationStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type ClassifyTicketInput,
  type Comment,
  type Ticket,
  type TicketClassification,
} from "~/types/schema";
import { classifyTicket } from "~/services/ticket-classifier";
import { isTicketStatus } from "~/utils";
import type { TicketListFilters } from "~/utils";
import { db } from "./database";
import { getErrorMessage, type Result } from "~/utils";

export type CreateTicketInput = {
  clientName: string;
  requestText: string;
  attachmentUrl?: string | null;
};

export type TicketStats = {
  total: number;
  nuevos: number;
  enProgreso: number;
  resueltos: number;
};

export type SidebarFilterCounts = {
  status: {
    todos: number;
    abiertos: number;
    enProgreso: number;
    resueltos: number;
  };
  priority: {
    alta: number;
    media: number;
    baja: number;
  };
  category: {
    finanzas: number;
    legal: number;
    compras: number;
    operaciones: number;
  };
};

export type TicketWithComments = Ticket & {
  comments: Comment[];
};

type TicketWhereInput = NonNullable<
  Parameters<typeof db.ticket.findMany>[0]
>["where"];

// Validar el input de creación de ticket
function validateCreateTicketInput(input: CreateTicketInput): string | null {
  if (!input.clientName?.trim()) {
    return "El nombre del cliente es requerido";
  }
  if (!input.requestText?.trim()) {
    return "El texto de la solicitud es requerido";
  }
  if (input.attachmentUrl?.trim()) {
    try {
      new URL(input.attachmentUrl.trim());
    } catch {
      return "La URL del adjunto no es válida";
    }
  }
  return null;
}

// Construir el where para la lista de tickets
function buildListTicketsWhere(
  filters?: TicketListFilters,
): TicketWhereInput | undefined {
  if (!filters) return undefined;

  const conditions: TicketWhereInput[] = [];

  // Buscar por nombre del cliente o texto de la solicitud
  if (filters.search) {
    conditions.push({
      OR: [
        { clientName: { contains: filters.search } },
        { requestText: { contains: filters.search } },
      ],
    });
  }

  // Buscar por estado
  if (filters.status === "RESUELTOS") {
    conditions.push({
      status: { in: [TicketStatus.RESUELTO, TicketStatus.CERRADO] },
    });
  } else if (filters.status && isTicketStatus(filters.status)) {
    conditions.push({ status: filters.status });
  }

  // Buscar por prioridad
  if (filters.priority) {
    conditions.push({ priority: filters.priority });
  }

  // Buscar por categoría
  if (filters.category) {
    conditions.push({ category: filters.category });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0]!;
  return { AND: conditions } as TicketWhereInput;
}

// Listar los tickets
export async function listTickets(
  filters?: TicketListFilters,
): Promise<Result<Ticket[]>> {
  try {
    const tickets = await db.ticket.findMany({
      where: buildListTicketsWhere(filters),
      orderBy: { createdAt: "desc" },
    });
    return { ok: true, data: tickets };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Obtener los contadores de filtros de la barra lateral
export async function getSidebarFilterCounts(): Promise<
  Result<SidebarFilterCounts>
> {
  try {
    const [
      todos,
      abiertos,
      enProgreso,
      resueltos,
      alta,
      media,
      baja,
      finanzas,
      legal,
      compras,
      operaciones,
    ] = await Promise.all([
      db.ticket.count(),
      db.ticket.count({ where: { status: TicketStatus.ABIERTO } }),
      db.ticket.count({ where: { status: TicketStatus.EN_PROGRESO } }),
      db.ticket.count({
        where: {
          status: { in: [TicketStatus.RESUELTO, TicketStatus.CERRADO] },
        },
      }),
      db.ticket.count({ where: { priority: TicketPriority.ALTA } }),
      db.ticket.count({ where: { priority: TicketPriority.MEDIA } }),
      db.ticket.count({ where: { priority: TicketPriority.BAJA } }),
      db.ticket.count({ where: { category: TicketCategory.FINANZAS } }),
      db.ticket.count({ where: { category: TicketCategory.LEGAL } }),
      db.ticket.count({ where: { category: TicketCategory.COMPRAS } }),
      db.ticket.count({ where: { category: TicketCategory.OPERACIONES } }),
    ]);

    return {
      ok: true,
      data: {
        status: { todos, abiertos, enProgreso, resueltos },
        priority: { alta, media, baja },
        category: { finanzas, legal, compras, operaciones },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Obtener los estadísticas de los tickets
export async function getTicketStats(): Promise<Result<TicketStats>> {
  try {
    const [total, nuevos, enProgreso, resueltos] = await Promise.all([
      db.ticket.count(),
      db.ticket.count({
        where: { status: TicketStatus.ABIERTO, assignee: null },
      }),
      db.ticket.count({ where: { status: TicketStatus.EN_PROGRESO } }),
      db.ticket.count({
        where: {
          status: { in: [TicketStatus.RESUELTO, TicketStatus.CERRADO] },
        },
      }),
    ]);

    return {
      ok: true,
      data: { total, nuevos, enProgreso, resueltos },
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Obtener un ticket por su ID
export async function getTicketById(
  id: string,
): Promise<Result<TicketWithComments>> {
  try {
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Crear un ticket
export async function createTicket(
  input: CreateTicketInput,
): Promise<Result<Ticket>> {
  const validationError = validateCreateTicketInput(input);
  if (validationError) {
    return { ok: false, error: validationError, code: "VALIDATION" };
  }

  try {
    const ticket = await db.ticket.create({
      data: {
        clientName: input.clientName.trim(),
        requestText: input.requestText.trim(),
        attachmentUrl: input.attachmentUrl?.trim() || null,
      },
    });
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Guardar la clasificación de un ticket
export async function saveTicketClassification(
  id: string,
  classification: TicketClassification,
): Promise<Result<Ticket>> {
  try {
    const existing = await db.ticket.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: {
        category: classification.category,
        priority: classification.priority,
        summary: classification.summary.trim(),
        classificationStatus: ClassificationStatus.COMPLETADA,
        classificationError: null,
        classifiedAt: new Date(),
      },
    });
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Marcar un ticket como fallido
export async function markTicketClassificationFailed(
  id: string,
  errorMessage: string,
): Promise<Result<Ticket>> {
  try {
    const existing = await db.ticket.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: {
        classificationStatus: ClassificationStatus.FALLIDA,
        classificationError: errorMessage,
        classifiedAt: new Date(),
      },
    });
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Clasificar ticket con IA y persistir resultado
export async function classifyTicketWithAi(
  ticketId: string,
  input: ClassifyTicketInput,
): Promise<Result<Ticket>> {
  const classification = await classifyTicket(input);

  if (classification.ok) {
    return saveTicketClassification(ticketId, classification.data);
  }

  return markTicketClassificationFailed(ticketId, classification.error);
}

// Actualizar el estado de un ticket
export async function updateTicketStatus(
  id: string,
  status: string,
): Promise<Result<Ticket>> {
  if (!isTicketStatus(status)) {
    return { ok: false, error: "Estado de ticket inválido", code: "VALIDATION" };
  }

  try {
    const existing = await db.ticket.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: { status },
    });
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}

// Actualizar el asignado de un ticket
export async function updateTicketAssignee(
  id: string,
  assignee: string | null,
): Promise<Result<Ticket>> {
  try {
    const existing = await db.ticket.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: { assignee: assignee?.trim() || null },
    });
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}
