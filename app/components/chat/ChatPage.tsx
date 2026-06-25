import { useCallback, useRef, useState } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { useUserName } from "~/hooks/useUserName";
import { useChatStream } from "~/hooks/useChatStream";
import type { AgentEvent } from "~/services/chat-agent/events";
import type { SerializedConversation, SerializedMessage } from "~/utils/serializers";
import { ChatComposer } from "./ChatComposer";
import { ChatEmptyState } from "./ChatEmptyState";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import type { ChatMessageView } from "./types";

type ChatLoaderData = {
  conversations: Omit<SerializedConversation, "messages">[];
  activeConversation: SerializedConversation | null;
};

// Mapear un mensaje persistido a su representación en la UI
function toView(message: SerializedMessage): ChatMessageView {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    toolCalls: message.toolCalls ?? [],
    toolResults: message.toolResults ?? [],
  };
}

function ChatThread({
  activeConversation,
  userName,
  userInitials,
}: {
  activeConversation: SerializedConversation | null;
  userName: string | null;
  userInitials: string;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const [messages, setMessages] = useState<ChatMessageView[]>(
    () => activeConversation?.messages?.map(toView) ?? [],
  );

  const assistantIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(activeConversation?.id ?? null);
  const isNewRef = useRef(activeConversation === null);

  // Actualizar el mensaje del asistente que se está transmitiendo
  const patchAssistant = useCallback(
    (patch: (m: ChatMessageView) => ChatMessageView) => {
      const id = assistantIdRef.current;
      if (!id) return;
      setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
    },
    [],
  );

  const handleEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "conversation":
          conversationIdRef.current = event.conversationId;
          break;
        case "text-delta":
          patchAssistant((m) => ({ ...m, content: m.content + event.delta }));
          break;
        case "tool-call":
          patchAssistant((m) => ({
            ...m,
            toolCalls: [...m.toolCalls, event.toolCall],
          }));
          break;
        case "tool-result":
          patchAssistant((m) => ({
            ...m,
            toolResults: [...m.toolResults, event.toolResult],
          }));
          break;
        case "done":
          patchAssistant((m) => ({ ...m, streaming: false }));
          if (isNewRef.current && conversationIdRef.current) {
            navigate(`/chat/${conversationIdRef.current}`, { replace: true });
          } else {
            revalidator.revalidate();
          }
          break;
        case "error":
          patchAssistant((m) => ({
            ...m,
            streaming: false,
            content:
              m.content +
              (m.content ? "\n\n" : "") +
              `⚠️ ${event.error}`,
          }));
          break;
      }
    },
    [navigate, patchAssistant, revalidator],
  );

  const { send, stop, isStreaming } = useChatStream({ onEvent: handleEvent });
  const [focusTrigger, setFocusTrigger] = useState(0);

  const handleSend = useCallback(
    (text: string) => {
      const assistantId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `a-${Date.now()}`;
      assistantIdRef.current = assistantId;

      setMessages((prev) => [
        ...prev,
        {
          id: `u-${assistantId}`,
          role: "user",
          content: text,
          toolCalls: [],
          toolResults: [],
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          toolCalls: [],
          toolResults: [],
          streaming: true,
        },
      ]);

      void send({
        message: text,
        conversationId: conversationIdRef.current,
        userName,
      });

      setFocusTrigger((n) => n + 1);
    },
    [send, userName],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
          {messages.length === 0 ? (
            <ChatEmptyState onPick={handleSend} />
          ) : (
            <MessageList messages={messages} userInitials={userInitials} />
          )}
        </div>
      </div>

      <div className="shrink-0 px-3 pb-4 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer
            onSend={handleSend}
            onStop={stop}
            isStreaming={isStreaming}
            focusTrigger={focusTrigger}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            El copiloto puede ejecutar acciones reales sobre tus tickets.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const data = useLoaderData<ChatLoaderData>();
  const { userName, initials } = useUserName();
  const activeId = data.activeConversation?.id ?? null;

  const conversations = userName
    ? data.conversations.filter(
        (c) => !c.userName || c.userName === userName,
      )
    : data.conversations;

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
        <ConversationList conversations={conversations} activeId={activeId} />
      </aside>

      <ChatThread
        key={activeId ?? "new"}
        activeConversation={data.activeConversation}
        userName={userName}
        userInitials={initials}
      />
    </div>
  );
}
