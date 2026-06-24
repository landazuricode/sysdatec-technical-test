// ------------------------------------------------------------
// Enums
// ------------------------------------------------------------
export const TicketCategory = {
  FINANZAS: "FINANZAS",
  LEGAL: "LEGAL",
  COMPRAS: "COMPRAS",
  OPERACIONES: "OPERACIONES",
} as const;

export type TicketCategory =
  (typeof TicketCategory)[keyof typeof TicketCategory];

export const TicketPriority = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAJA: "BAJA",
} as const;

export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketStatus = {
  ABIERTO: "ABIERTO",
  EN_PROGRESO: "EN_PROGRESO",
  RESUELTO: "RESUELTO",
  CERRADO: "CERRADO",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const ClassificationStatus = {
  PENDIENTE: "PENDIENTE",
  COMPLETADA: "COMPLETADA",
  FALLIDA: "FALLIDA",
} as const;

export type ClassificationStatus =
  (typeof ClassificationStatus)[keyof typeof ClassificationStatus];

// ------------------------------------------------------------
// Models
// ------------------------------------------------------------
export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  author: string | null;
  createdAt: Date;
  ticket?: Ticket;
}

export interface Ticket {
  id: string;
  clientName: string;
  requestText: string;
  attachmentUrl: string | null;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  summary: string | null;
  classificationStatus: ClassificationStatus;
  classificationError: string | null;
  classifiedAt: Date | null;
  status: TicketStatus;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
  comments?: Comment[];
}

// ------------------------------------------------------------
// Clasificación IA
// ------------------------------------------------------------
export type TicketClassification = {
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
};

export type ClassifyTicketInput = Pick<Ticket, "clientName" | "requestText">;
