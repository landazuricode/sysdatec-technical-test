import type { Route } from "./+types/tickets.new";
import { TicketCreateForm } from "../components/tickets/TicketCreateForm";
import { APP_NAME } from "~/config/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Nuevo ticket | ${APP_NAME}` },
    { name: "description", content: "Crear un nuevo ticket" },
  ];
}

export default function TicketsNewRoute() {
  return <TicketCreateForm />;
}
