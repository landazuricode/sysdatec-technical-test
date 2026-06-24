import { getErrorMessage, type Result } from "~/utils";
import { isTicketCategory, isTicketPriority } from "~/utils";
import type {
  ClassifyTicketInput,
  TicketClassification,
} from "~/types/schema";
import { TICKET_CLASSIFIER_PROMPT } from "./prompt";

type RawClassification = {
  category?: string;
  priority?: string;
  summary?: string;
};

// Parsear y validar la respuesta de la IA
function parseResponse(content: string): Result<TicketClassification> {
  try {
    const parsed = JSON.parse(content) as RawClassification;

    if (!parsed.category || !isTicketCategory(parsed.category)) {
      return {
        ok: false,
        error: "La IA devolvió una categoría inválida",
        code: "VALIDATION",
      };
    }

    if (!parsed.priority || !isTicketPriority(parsed.priority)) {
      return {
        ok: false,
        error: "La IA devolvió una prioridad inválida",
        code: "VALIDATION",
      };
    }

    if (!parsed.summary?.trim()) {
      return {
        ok: false,
        error: "La IA no generó un resumen válido",
        code: "VALIDATION",
      };
    }

    return {
      ok: true,
      data: {
        category: parsed.category,
        priority: parsed.priority,
        summary: parsed.summary.trim(),
      },
    };
  } catch {
    return {
      ok: false,
      error: "No se pudo interpretar la respuesta de la IA",
      code: "VALIDATION",
    };
  }
}

// Clasificar un ticket con OpenAI
export async function classifyTicket(
  input: ClassifyTicketInput,
): Promise<Result<TicketClassification>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY no está configurada",
      code: "CONFIG",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TICKET_CLASSIFIER_PROMPT },
          {
            role: "user",
            content: `Cliente: ${input.clientName.trim()}\n\nSolicitud:\n${input.requestText.trim()}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        ok: false,
        error: `OpenAI respondió con error ${response.status}: ${errorBody}`,
        code: "AI",
      };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        error: "OpenAI no devolvió contenido en la respuesta",
        code: "AI",
      };
    }

    return parseResponse(content);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
      code: "AI",
    };
  }
}
