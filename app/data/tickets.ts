import {
  ClassificationStatus,
  TicketStatus,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus as TicketStatusType,
} from "../../generated/prisma/enums";
import type { TicketModel } from "../../generated/prisma/models/Ticket";
import { db } from "./database";
import { getErrorMessage, type DataResult } from "./result";

export type TicketClassificationInput = {
  category: TicketCategory;
  priority: TicketPriority;
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

export async function listTickets(
  search?: string,
): Promise<DataResult<TicketModel[]>> {
  try {
    const query = search?.trim();
    const tickets = await db.ticket.findMany({
      where: query
        ? {
            OR: [
              { clientName: { contains: query, mode: "insensitive" } },
              { requestText: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
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
