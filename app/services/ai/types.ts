import type {
  TicketCategory,
  TicketPriority,
} from "../../../generated/prisma/enums";

export type TicketClassification = {
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
};

export type ClassifyTicketInput = {
  clientName: string;
  requestText: string;
};

export type AiErrorCode = "CONFIG" | "AI" | "VALIDATION";

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: AiErrorCode };

export function getAiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Error inesperado al clasificar el ticket";
}
