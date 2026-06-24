import {
  TicketCategory,
  TicketPriority,
} from "../../../generated/prisma/enums";
import { OPENAI_API_URL, OPENAI_MODEL } from "~/config/ai";
import {
  getAiErrorMessage,
  type AiResult,
  type ClassifyTicketInput,
  type TicketClassification,
} from "./types";

const SYSTEM_PROMPT = `Eres un clasificador de tickets operativos para una empresa.
Analiza la solicitud del cliente y responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con esta estructura exacta:
{
  "category": "FINANZAS" | "LEGAL" | "COMPRAS" | "OPERACIONES",
  "priority": "ALTA" | "MEDIA" | "BAJA",
  "summary": "resumen breve en español de máximo 2 oraciones"
}

Criterios de categoría:
- FINANZAS: pagos, facturas, presupuestos, reembolsos, contabilidad
- LEGAL: contratos, cumplimiento, políticas, asuntos jurídicos
- COMPRAS: adquisiciones, proveedores, cotizaciones, inventario
- OPERACIONES: procesos internos, logística, soporte operativo, incidencias

Criterios de prioridad:
- ALTA: urgente, bloquea operación, plazo inmediato
- MEDIA: importante pero no bloqueante
- BAJA: informativo o puede esperar`;

type RawClassification = {
  category?: string;
  priority?: string;
  summary?: string;
};

function isTicketCategory(value: string): value is TicketCategory {
  return Object.values(TicketCategory).includes(value as TicketCategory);
}

function isTicketPriority(value: string): value is TicketPriority {
  return Object.values(TicketPriority).includes(value as TicketPriority);
}

function parseClassification(content: string): AiResult<TicketClassification> {
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

export async function classifyTicket(
  input: ClassifyTicketInput,
): Promise<AiResult<TicketClassification>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY no está configurada",
      code: "CONFIG",
    };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

    return parseClassification(content);
  } catch (error) {
    return {
      ok: false,
      error: getAiErrorMessage(error),
      code: "AI",
    };
  }
}
