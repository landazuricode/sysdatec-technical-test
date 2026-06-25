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
import { TICKET_LIST_PAGE_SIZE, type TicketListFilters } from "~/utils";
import { findOrCreateAssignee } from "./assignees";
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

  // Buscar por número, cliente o texto de la solicitud
  if (filters.search) {
    const searchConditions: TicketWhereInput[] = [
      { clientName: { contains: filters.search } },
      { requestText: { contains: filters.search } },
    ];

    const numericQuery = filters.search.replace(/^#/, "").replace(/^0+/, "");
    const ticketNumber = Number.parseInt(numericQuery, 10);
    if (Number.isFinite(ticketNumber) && ticketNumber > 0) {
      searchConditions.push({ ticketNumber: { equals: ticketNumber } });
    }

    conditions.push({ OR: searchConditions } as TicketWhereInput);
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

export type TicketListPage = {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

// Listar los tickets
export async function listTickets(
  filters?: TicketListFilters,
): Promise<Result<TicketListPage>> {
  try {
    const where = buildListTicketsWhere(filters);
    const requestedPage = filters?.page ?? 1;
    const pageSize = TICKET_LIST_PAGE_SIZE;

    const total = await db.ticket.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = total === 0 ? 1 : Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    const tickets = await db.ticket.findMany({
      where,
      include: { assignee: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    return {
      ok: true,
      data: {
        tickets,
        total,
        page,
        pageSize,
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
        where: { status: TicketStatus.ABIERTO, assigneeId: null },
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

// Obtener un ticket por su número de seguimiento
export async function getTicketByNumber(
  ticketNumber: number,
): Promise<Result<TicketWithComments>> {
  if (!Number.isFinite(ticketNumber) || ticketNumber <= 0) {
    return { ok: false, error: "Número de ticket inválido", code: "VALIDATION" };
  }

  try {
    const ticket = await db.ticket.findUnique({
      where: { ticketNumber },
      include: {
        assignee: true,
        comments: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return {
        ok: false,
        error: `No existe el ticket #${ticketNumber}`,
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

export type AssigneeWorkload = {
  assigneeName: string;
  abiertos: number;
  enProgreso: number;
  total: number;
};

// Obtener la carga de trabajo por responsable
export async function getAssigneeWorkload(): Promise<Result<AssigneeWorkload[]>> {
  try {
    const grouped = await db.ticket.groupBy({
      by: ["assigneeId", "status"],
      where: {
        assigneeId: { not: null },
        status: { in: [TicketStatus.ABIERTO, TicketStatus.EN_PROGRESO] },
      },
      _count: { _all: true },
    });

    if (grouped.length === 0) {
      return { ok: true, data: [] };
    }

    const assigneeIds = [
      ...new Set(grouped.map((row) => row.assigneeId).filter(Boolean)),
    ] as string[];

    const assignees = await db.assignee.findMany({
      where: { id: { in: assigneeIds } },
    });
    const nameById = new Map(assignees.map((a) => [a.id, a.name]));

    const workloadByAssignee = new Map<string, AssigneeWorkload>();

    for (const row of grouped) {
      if (!row.assigneeId) continue;
      const name = nameById.get(row.assigneeId) ?? "Desconocido";
      const current =
        workloadByAssignee.get(row.assigneeId) ??
        ({ assigneeName: name, abiertos: 0, enProgreso: 0, total: 0 } as AssigneeWorkload);

      const count = row._count._all;
      if (row.status === TicketStatus.ABIERTO) current.abiertos += count;
      if (row.status === TicketStatus.EN_PROGRESO) current.enProgreso += count;
      current.total += count;

      workloadByAssignee.set(row.assigneeId, current);
    }

    const workload = [...workloadByAssignee.values()].sort(
      (a, b) => b.total - a.total,
    );

    return { ok: true, data: workload };
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
        assignee: true,
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
  assigneeName: string | null,
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

    let assigneeId: string | null = null;
    if (assigneeName?.trim()) {
      const assigneeResult = await findOrCreateAssignee(assigneeName);
      if (!assigneeResult.ok) {
        return assigneeResult;
      }
      assigneeId = assigneeResult.data.id;
    }

    const ticket = await db.ticket.update({
      where: { id },
      data: { assigneeId },
      include: { assignee: true },
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
