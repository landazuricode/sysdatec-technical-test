import type {
  Assignee,
  ChatToolCall,
  ChatToolResult,
  Comment,
  Conversation,
  Message,
  Ticket,
} from "~/types/schema";

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

export type SerializedMessage = Omit<
  Message,
  "createdAt" | "toolCalls" | "toolResults"
> & {
  createdAt: string;
  toolCalls: ChatToolCall[] | null;
  toolResults: ChatToolResult[] | null;
};

export type SerializedConversation = Omit<
  Conversation,
  "createdAt" | "updatedAt" | "messages"
> & {
  createdAt: string;
  updatedAt: string;
  messages?: SerializedMessage[];
};

// Serializar mensaje del chat para la UI
export function serializeMessage(
  message: Message & {
    toolCalls?: unknown;
    toolResults?: unknown;
  },
): SerializedMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    toolCalls: (message.toolCalls as ChatToolCall[] | null) ?? null,
    toolResults: (message.toolResults as ChatToolResult[] | null) ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

// Serializar conversación para la UI
export function serializeConversation(
  conversation: Conversation & { messages?: Message[] },
): SerializedConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    userName: conversation.userName,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages?.map(serializeMessage),
  };
}
