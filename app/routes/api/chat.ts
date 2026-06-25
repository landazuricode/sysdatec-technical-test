import type { ActionFunctionArgs } from "react-router";
import {
  appendMessage,
  createConversation,
  deriveConversationTitle,
  getConversation,
} from "~/data/conversations";
import { runChatAgent, type HistoryMessage } from "~/services/chat-agent";
import type { AgentEvent } from "~/services/chat-agent";
import { getErrorMessage, getFormDataRequest } from "~/utils";
import { MessageRole } from "~/types/schema";

// Reconstruir el historial de texto (user/assistant) para el modelo
function buildHistory(
  messages: { role: string; content: string }[],
): HistoryMessage[] {
  return messages
    .filter(
      (m) =>
        (m.role === MessageRole.USER || m.role === MessageRole.ASSISTANT) &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role === MessageRole.USER ? "user" : "assistant",
      content: m.content,
    }));
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await getFormDataRequest(request);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const userName =
    typeof body.userName === "string" && body.userName.trim()
      ? body.userName.trim()
      : null;
  const requestedConversationId =
    typeof body.conversationId === "string" ? body.conversationId : null;

  if (!message) {
    return Response.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }

  // Resolver o crear la conversación
  let conversationId = requestedConversationId;
  let conversationTitle = "";
  let history: HistoryMessage[] = [];
  let isNew = false;

  if (conversationId) {
    const existing = await getConversation(conversationId);
    if (existing.ok) {
      conversationTitle = existing.data.title;
      history = buildHistory(existing.data.messages);
    } else {
      conversationId = null;
    }
  }

  if (!conversationId) {
    const created = await createConversation({
      title: deriveConversationTitle(message),
      userName,
    });
    if (!created.ok) {
      return Response.json({ error: created.error }, { status: 500 });
    }
    conversationId = created.data.id;
    conversationTitle = created.data.title;
    isNew = true;
  }

  // Persistir el mensaje del usuario
  await appendMessage({
    conversationId,
    role: MessageRole.USER,
    content: message,
  });

  const encoder = new TextEncoder();
  const activeConversationId = conversationId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        send({
          type: "conversation",
          conversationId: activeConversationId,
          title: conversationTitle,
        });

        const result = await runChatAgent({
          history,
          userMessage: message,
          userName,
          onEvent: send,
        });

        await appendMessage({
          conversationId: activeConversationId,
          role: MessageRole.ASSISTANT,
          content: result.content,
          toolCalls: result.toolCalls.length ? result.toolCalls : null,
          toolResults: result.toolResults.length ? result.toolResults : null,
        });
      } catch (error) {
        send({ type: "error", error: getErrorMessage(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Conversation-Id": activeConversationId,
      "X-Conversation-New": isNew ? "1" : "0",
    },
  });
}
