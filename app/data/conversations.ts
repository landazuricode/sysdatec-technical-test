import type {
  ChatToolCall,
  ChatToolResult,
  Conversation,
  Message,
  MessageRole,
} from "~/types/schema";
import { db } from "./database";
import { getErrorMessage, type Result } from "~/utils";

export type ConversationSummary = Pick<
  Conversation,
  "id" | "title" | "userName" | "createdAt" | "updatedAt"
>;

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type AppendMessageInput = {
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls?: ChatToolCall[] | null;
  toolResults?: ChatToolResult[] | null;
};

const MAX_TITLE_LENGTH = 60;

// Derivar un título legible a partir del primer mensaje del usuario
export function deriveConversationTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Nueva conversación";
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`;
}

// Listar las conversaciones de un usuario
export async function listConversations(
  userName: string | null,
): Promise<Result<ConversationSummary[]>> {
  try {
    const conversations = await db.conversation.findMany({
      where: userName ? { userName } : {},
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        userName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { ok: true, data: conversations };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}

// Obtener una conversación con todos sus mensajes
export async function getConversation(
  id: string,
): Promise<Result<ConversationWithMessages>> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      return { ok: false, error: "Conversación no encontrada", code: "NOT_FOUND" };
    }

    return { ok: true, data: conversation as ConversationWithMessages };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}

// Crear una nueva conversación
export async function createConversation(input: {
  title: string;
  userName: string | null;
}): Promise<Result<Conversation>> {
  try {
    const conversation = await db.conversation.create({
      data: {
        title: input.title.trim() || "Nueva conversación",
        userName: input.userName?.trim() || null,
      },
    });
    return { ok: true, data: conversation };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}

// Agregar un mensaje a una conversación y refrescar su updatedAt
export async function appendMessage(
  input: AppendMessageInput,
): Promise<Result<Message>> {
  try {
    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          toolCalls: (input.toolCalls ?? undefined) as never,
          toolResults: (input.toolResults ?? undefined) as never,
        },
      }),
      db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return { ok: true, data: message as Message };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}

// Renombrar una conversación
export async function renameConversation(
  id: string,
  title: string,
): Promise<Result<Conversation>> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false, error: "El título no puede estar vacío", code: "VALIDATION" };
  }

  try {
    const conversation = await db.conversation.update({
      where: { id },
      data: { title: trimmed.slice(0, MAX_TITLE_LENGTH) },
    });
    return { ok: true, data: conversation };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}

// Eliminar una conversación
export async function deleteConversation(id: string): Promise<Result<true>> {
  try {
    await db.conversation.delete({ where: { id } });
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error), code: "DATABASE" };
  }
}
