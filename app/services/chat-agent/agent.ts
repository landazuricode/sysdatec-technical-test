import type OpenAI from "openai";
import type { ChatToolCall, ChatToolResult } from "~/types/schema";
import { getChatModel, getOpenAIClient } from "./client";
import type { AgentEventHandler } from "./events";
import { buildSystemPrompt } from "./prompt";
import { chatTools, executeTool } from "./tools";

const MAX_ITERATIONS = 6;

// Mensaje previo del historial
export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RunChatAgentInput = {
  history: HistoryMessage[];
  userMessage: string;
  userName: string | null;
  onEvent: AgentEventHandler;
};

export type RunChatAgentResult = {
  content: string;
  toolCalls: ChatToolCall[];
  toolResults: ChatToolResult[];
};

// Acumulador de tool calls provenientes del stream
type PartialToolCall = {
  id: string;
  name: string;
  arguments: string;
};

function parseArguments(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Ejecuta el loop del agente con streaming y function calling
export async function runChatAgent({
  history,
  userMessage,
  userName,
  onEvent,
}: RunChatAgentInput): Promise<RunChatAgentResult> {
  const client = getOpenAIClient();
  const model = getChatModel();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(userName) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  let finalText = "";
  const allToolCalls: ChatToolCall[] = [];
  const allToolResults: ChatToolResult[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const stream = await client.chat.completions.create({
      model,
      messages,
      tools: chatTools,
      stream: true,
    });

    let assistantText = "";
    const partialToolCalls: PartialToolCall[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        assistantText += delta.content;
        finalText += delta.content;
        onEvent({ type: "text-delta", delta: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0;
          const existing = partialToolCalls[index] ?? {
            id: "",
            name: "",
            arguments: "",
          };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          partialToolCalls[index] = existing;
        }
      }
    }

    const toolCalls = partialToolCalls.filter((tc) => tc.name);

    // Sin herramientas: la respuesta final ya se transmitió
    if (toolCalls.length === 0) {
      onEvent({ type: "done", content: finalText });
      return { content: finalText, toolCalls: allToolCalls, toolResults: allToolResults };
    }

    // Registrar el turno del asistente con sus tool calls
    messages.push({
      role: "assistant",
      content: assistantText || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments || "{}" },
      })),
    });

    // Ejecutar cada herramienta y devolver su resultado al modelo
    for (const tc of toolCalls) {
      const parsedArgs = parseArguments(tc.arguments);
      const call: ChatToolCall = {
        id: tc.id,
        name: tc.name,
        arguments: parsedArgs,
      };
      allToolCalls.push(call);
      onEvent({ type: "tool-call", toolCall: call });

      const outcome = await executeTool(tc.name, parsedArgs, { userName });

      const toolResult: ChatToolResult = outcome.ok
        ? { id: tc.id, name: tc.name, ok: true, data: outcome.data }
        : { id: tc.id, name: tc.name, ok: false, error: outcome.error };

      allToolResults.push(toolResult);
      onEvent({ type: "tool-result", toolResult });

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(outcome.ok ? outcome.data : { error: outcome.error }),
      });
    }
  }

  // Tope de iteraciones alcanzado
  const message =
    finalText ||
    "He realizado varias acciones pero alcancé el límite de pasos. ¿Quieres que continúe?";
  onEvent({ type: "done", content: message });
  return { content: message, toolCalls: allToolCalls, toolResults: allToolResults };
}
