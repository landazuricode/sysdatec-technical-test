import type { Assignee, Comment, Ticket } from "~/types/schema";

export type SerializedAssignee = Omit<Assignee, "createdAt"> & {
  createdAt: string;
};

export type SerializedComment = Omit<Comment, "createdAt"> & {
  createdAt: string;
};

export type SerializedTicket = Omit<
  Ticket,
  "createdAt" | "updatedAt" | "classifiedAt" | "comments" | "assignee"
> & {
  createdAt: string;
  updatedAt: string;
  classifiedAt: string | null;
  assignee?: SerializedAssignee | null;
  comments?: SerializedComment[];
};

// Serializar responsable para la UI
export function serializeAssignee(assignee: Assignee): SerializedAssignee {
  return {
    ...assignee,
    createdAt: assignee.createdAt.toISOString(),
  };
}

// Serializar comentario para la UI
export function serializeComment(comment: Comment): SerializedComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

// Serializar ticket para la UI
export function serializeTicket(
  ticket: Ticket & { comments?: Comment[]; assignee?: Assignee | null },
): SerializedTicket {
  return {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    classifiedAt: ticket.classifiedAt?.toISOString() ?? null,
    assignee: ticket.assignee ? serializeAssignee(ticket.assignee) : null,
    comments: ticket.comments?.map(serializeComment),
  };
}
