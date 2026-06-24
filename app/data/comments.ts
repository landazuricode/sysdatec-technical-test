import type { CommentModel } from "../../generated/prisma/models/Comment";
import { db } from "./database";
import { getErrorMessage, type DataResult } from "./result";

export type CreateCommentInput = {
  ticketId: string;
  content: string;
  author?: string | null;
};

function validateCreateCommentInput(input: CreateCommentInput): string | null {
  if (!input.content?.trim()) {
    return "El comentario no puede estar vacío";
  }
  return null;
}

export async function addComment(
  input: CreateCommentInput,
): Promise<DataResult<CommentModel>> {
  const validationError = validateCreateCommentInput(input);
  if (validationError) {
    return { ok: false, error: validationError, code: "VALIDATION" };
  }

  try {
    const ticket = await db.ticket.findUnique({
      where: { id: input.ticketId },
    });

    if (!ticket) {
      return {
        ok: false,
        error: "Ticket no encontrado",
        code: "NOT_FOUND",
      };
    }

    const comment = await db.comment.create({
      data: {
        ticketId: input.ticketId,
        content: input.content.trim(),
        author: input.author?.trim() || null,
      },
    });

    return { ok: true, data: comment };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "DATABASE",
    };
  }
}
