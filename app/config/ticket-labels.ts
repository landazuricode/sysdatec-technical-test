import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/enums";

export const ticketStatusLabels: Record<
  (typeof TicketStatus)[keyof typeof TicketStatus],
  string
> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

export const ticketCategoryLabels: Record<
  (typeof TicketCategory)[keyof typeof TicketCategory],
  string
> = {
  FINANZAS: "Finanzas",
  LEGAL: "Legal",
  COMPRAS: "Compras",
  OPERACIONES: "Operaciones",
};

export const ticketPriorityLabels: Record<
  (typeof TicketPriority)[keyof typeof TicketPriority],
  string
> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const ticketStatusOptions = Object.values(TicketStatus).map((value) => ({
  value,
  label: ticketStatusLabels[value],
}));
