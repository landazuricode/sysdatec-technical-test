import type { TicketModel } from "../../../generated/prisma/models/Ticket";
import { classifyTicket } from "~/services/ai/classify-ticket";
import type { ClassifyTicketInput } from "~/services/ai/types";
import {
  markTicketClassificationFailed,
  saveTicketClassification,
} from "~/data/tickets";
import type { DataResult } from "~/data/result";

export async function runTicketClassification(
  ticketId: string,
  input: ClassifyTicketInput,
): Promise<DataResult<TicketModel>> {
  const classification = await classifyTicket(input);

  if (classification.ok) {
    return saveTicketClassification(ticketId, classification.data);
  }

  return markTicketClassificationFailed(ticketId, classification.error);
}
