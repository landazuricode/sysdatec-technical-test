import type { Comment } from "~/types/schema";
import { db } from "./database";
import { getErrorMessage, type DataResult } from "~/utils";

export type CreateCommentInput = {
  ticketId: string;
  content: string;
  author?: string | null;
};

// Validar el input de creación de comentario
function validateCreateCommentInput(input: CreateCommentInput): string | null {
  if (!input.content?.trim()) {
    return "El comentario no puede estar vacío";
  }
  return null;
}

// Crear un comentario
export async function addComment(
  input: CreateCommentInput,
): Promise<DataResult<Comment>> {
  const validationError = validateCreateCommentInput(input);

  // Validar error de validación
  if (validationError) {
    return { ok: false, error: validationError, code: "VALIDATION" };
  }

  // Buscar el ticket
  try {
    const ticket = await db.ticket.findUnique({
      where: { id: input.ticketId },
    });

    // Validar existencia del ticket
    if (!ticket) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    // Crear el comentario
    const comment = await db.comment.create({
      data: {
        ticketId: input.ticketId,
        content: input.content.trim(),
        author: input.author?.trim() || null,
      },
    });

    // Validar creación del comentario
    return { ok: true, data: comment };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}
