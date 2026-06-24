import { redirect, type ActionFunctionArgs } from "react-router";
import { TicketNewForm } from "~/components/tickets/TicketNewForm";
import { APP_NAME } from "~/config/constants";
import { classifyTicketWithAi, createTicket } from "~/data/tickets";
import { getFormDataRequest } from "~/utils";

export function meta() {
  return [
    { title: `Nuevo ticket | ${APP_NAME}` },
    { name: "description", content: "Crear un nuevo ticket" },
  ];
}

export default function Route() {
  return <TicketNewForm />;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData: any = await getFormDataRequest(request);
  const clientName = formData.clientName;
  const requestText = formData.requestText;
  const attachmentUrl = formData.attachmentUrl;

  // Crear el ticket
  const result = await createTicket({ clientName, requestText, attachmentUrl });

  // Validar creación del ticket
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code,
      values: { clientName, requestText, attachmentUrl },
    };
  }

  // Clasificar el ticket
  await classifyTicketWithAi(result.data.id, { clientName, requestText });

  // Redirigir al detalle del ticket
  return redirect(`/tickets/${result.data.id}`);
}
