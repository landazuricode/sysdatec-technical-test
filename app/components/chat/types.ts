import type { ChatToolCall, ChatToolResult } from "~/types/schema";

// Representación de un mensaje en la UI del chat
export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ChatToolCall[];
  toolResults: ChatToolResult[];
  streaming?: boolean;
};

export const TOOL_LABELS: Record<string, string> = {
  search_tickets: "Buscando tickets",
  get_ticket: "Consultando ticket",
  get_stats: "Calculando estadísticas",
  get_workload: "Revisando carga por responsable",
  list_assignees: "Listando responsables",
  create_ticket: "Creando ticket",
  update_ticket_status: "Actualizando estado",
  assign_ticket: "Asignando responsable",
  add_comment: "Agregando comentario",
};
