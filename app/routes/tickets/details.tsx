import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import { TicketDetails } from "~/components/tickets/TicketDetails";
import { APP_NAME } from "~/config/constants";
import { addComment } from "~/data/comments";
import { serializeTicket } from "~/utils/serializers";
import {
  classifyTicketWithAi,
  getTicketById,
  updateTicketAssignee,
  updateTicketStatus,
} from "~/data/tickets";
import { getFormDataRequest } from "~/utils";

export function meta() {
  return [
    { title: `Detalle del ticket | ${APP_NAME}` },
    { name: "description", content: "Ver y gestionar un ticket" },
  ];
}

export default function Route() {
  return <TicketDetails />;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const result = await getTicketById(params.ticketId as string);

  // Verificar si la obtención del ticket fue exitosa
  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      throw new Response(result.error, { status: 404 });
    }
    throw new Response(result.error, { status: 500 });
  }

  return { ticket: serializeTicket(result.data) };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { ticketId }: any = params;
  const formData: any = await getFormDataRequest(request);
  const intent = formData.intent;

  // Actualizar el estado del ticket
  if (intent === "updateStatus") {
    const result = await updateTicketStatus(ticketId, formData.status);

    // Validar acción exitosa
    if (!result.ok) {
      return { ok: false, error: result.error, intent };
    }

    return { ok: true, intent };
  }

  // Actualizar el asignado del ticket
  if (intent === "updateAssignee") {
    const result = await updateTicketAssignee(
      ticketId,
      formData.assignee ?? null,
    );

    // Validar acción exitosa
    if (!result.ok) {
      return { ok: false, error: result.error, intent };
    }

    return { ok: true, intent };
  }

  // Agregar un comentario al ticket
  if (intent === "addComment") {
    const result = await addComment({
      ticketId,
      content: formData.content,
      author: formData.author,
    });

    // Validar acción exitosa
    if (!result.ok) {
      return { ok: false, error: result.error, intent };
    }

    return { ok: true, intent };
  }

  // Reintentar la clasificación del ticket
  if (intent === "retryClassification") {
    const ticketResult = await getTicketById(ticketId);

    // Validar acción exitosa
    if (!ticketResult.ok) {
      return { ok: false, error: ticketResult.error, intent };
    }

    const classifyResult = await classifyTicketWithAi(
      ticketId,
      {
        clientName: ticketResult.data.clientName,
        requestText: ticketResult.data.requestText,
      },
    );

    // Validar acción exitosa
    if (!classifyResult.ok) {
      return { ok: false, error: classifyResult.error, intent };
    }

    return { ok: true, intent };
  }

  return {
    ok: false,
    error: "Acción no reconocida",
    intent: "unknown",
  };
}
