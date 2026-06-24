import {
  ClassificationStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type TicketCategory as TicketCategoryType,
  type TicketPriority as TicketPriorityType,
  type TicketStatus as TicketStatusType,
} from "../../generated/prisma/enums";
import type { Prisma } from "../../generated/prisma/client";
import type { TicketModel } from "../../generated/prisma/models/Ticket";
import { STATUS_FILTER_RESUELTOS, type TicketListFilters } from "~/utils/ticket-filters";
import { db } from "./database";
import { getErrorMessage, type DataResult } from "./result";

export type TicketClassificationInput = {
  category: TicketCategoryType;
  priority: TicketPriorityType;
  summary: string;
};

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

export type TicketWithComments = TicketModel & {
  comments: { id: string; ticketId: string; content: string; author: string | null; createdAt: Date }[];
};

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

function isTicketStatus(value: string): value is TicketStatusType {
  return Object.values(TicketStatus).includes(value as TicketStatusType);
}

function buildListTicketsWhere(
  filters?: TicketListFilters,
): Prisma.TicketWhereInput | undefined {
  if (!filters) return undefined;

  const conditions: Prisma.TicketWhereInput[] = [];

  if (filters.search) {
    conditions.push({
      OR: [
        { clientName: { contains: filters.search, mode: "insensitive" } },
        { requestText: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.status === STATUS_FILTER_RESUELTOS) {
    conditions.push({
      status: { in: [TicketStatus.RESUELTO, TicketStatus.CERRADO] },
    });
  } else if (filters.status && isTicketStatus(filters.status)) {
    conditions.push({ status: filters.status });
  }

  if (filters.priority) {
    conditions.push({ priority: filters.priority });
  }

  if (filters.category) {
    conditions.push({ category: filters.category });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

export async function listTickets(
  filters?: TicketListFilters,
): Promise<DataResult<TicketModel[]>> {
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

export async function getSidebarFilterCounts(): Promise<
  DataResult<SidebarFilterCounts>
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

export async function getTicketStats(): Promise<DataResult<TicketStats>> {
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

export async function getTicketById(
  id: string,
): Promise<DataResult<TicketWithComments>> {
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

export async function createTicket(
  input: CreateTicketInput,
): Promise<DataResult<TicketModel>> {
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

export async function saveTicketClassification(
  id: string,
  classification: TicketClassificationInput,
): Promise<DataResult<TicketModel>> {
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

export async function markTicketClassificationFailed(
  id: string,
  errorMessage: string,
): Promise<DataResult<TicketModel>> {
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

export async function updateTicketStatus(
  id: string,
  status: string,
): Promise<DataResult<TicketModel>> {
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

export async function updateTicketAssignee(
  id: string,
  assignee: string | null,
): Promise<DataResult<TicketModel>> {
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
