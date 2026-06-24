import type { CommentModel } from "../../generated/prisma/models/Comment";
import type { TicketModel } from "../../generated/prisma/models/Ticket";

export type SerializedComment = Omit<CommentModel, "createdAt"> & {
  createdAt: string;
};

export type SerializedTicket = Omit<
  TicketModel,
  "createdAt" | "updatedAt" | "classifiedAt"
> & {
  createdAt: string;
  updatedAt: string;
  classifiedAt: string | null;
  comments?: SerializedComment[];
};

export function serializeComment(comment: CommentModel): SerializedComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function serializeTicket(
  ticket: TicketModel & { comments?: CommentModel[] },
): SerializedTicket {
  return {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    classifiedAt: ticket.classifiedAt?.toISOString() ?? null,
    comments: ticket.comments?.map(serializeComment),
  };
}
