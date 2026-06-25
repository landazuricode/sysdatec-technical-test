import { useCallback, useRef, useState } from "react";
import type { AgentEvent } from "~/services/chat-agent/events";

export type SendMessageParams = {
  message: string;
  conversationId: string | null;
  userName: string | null;
};

type UseChatStreamOptions = {
  onEvent: (event: AgentEvent) => void;
};

// Parsear un bloque SSE ("data: {...}") a un evento del agente
function parseSseBlock(block: string): AgentEvent | null {
  const line = block
    .split("\n")
    .find((l) => l.startsWith("data:"));
  if (!line) return null;

  const json = line.slice(5).trim();
  if (!json) return null;

  try {
    return JSON.parse(json) as AgentEvent;
  } catch {
    return null;
  }
}

// Hook para enviar mensajes al copiloto y consumir el stream SSE
export function useChatStream({ onEvent }: UseChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async ({ message, conversationId, userName }: SendMessageParams) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, conversationId, userName }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail || `Error ${response.status} al contactar la IA`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let separatorIndex: number;
          while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            const event = parseSseBlock(block);
            if (event) onEvent(event);
          }
        }

        const trailing = parseSseBlock(buffer);
        if (trailing) onEvent(trailing);
      } catch (error) {
        if (controller.signal.aborted) {
          onEvent({ type: "error", error: "Generación cancelada." });
        } else {
          onEvent({
            type: "error",
            error:
              error instanceof Error ? error.message : "Error inesperado del chat",
          });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [onEvent],
  );

  return { send, stop, isStreaming };
}
