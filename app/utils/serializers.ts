import type { Comment, Ticket } from "~/types/schema";

export type SerializedComment = Omit<Comment, "createdAt"> & {
  createdAt: string;
};

export type SerializedTicket = Omit<
  Ticket,
  "createdAt" | "updatedAt" | "classifiedAt" | "comments"
> & {
  createdAt: string;
  updatedAt: string;
  classifiedAt: string | null;
  comments?: SerializedComment[];
};

// Serializar comentario para la UI
export function serializeComment(comment: Comment): SerializedComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

// Serializar ticket para la UI
export function serializeTicket(
  ticket: Ticket & { comments?: Comment[] },
): SerializedTicket {
  return {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    classifiedAt: ticket.classifiedAt?.toISOString() ?? null,
    comments: ticket.comments?.map(serializeComment),
  };
}
