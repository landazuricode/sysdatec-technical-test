import type { ChatToolCall, ChatToolResult } from "~/types/schema";

// Eventos emitidos por el agente durante el streaming (SSE)
export type AgentEvent =
  | { type: "conversation"; conversationId: string; title: string }
  | { type: "text-delta"; delta: string }
  | { type: "tool-call"; toolCall: ChatToolCall }
  | { type: "tool-result"; toolResult: ChatToolResult }
  | { type: "done"; content: string }
  | { type: "error"; error: string };

export type AgentEventHandler = (event: AgentEvent) => void;
