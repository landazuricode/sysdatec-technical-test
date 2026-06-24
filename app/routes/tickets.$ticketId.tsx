import type { Route } from "./+types/tickets.$ticketId";
import { TicketDetail } from "../components/tickets/TicketDetail";
import { APP_NAME } from "~/config/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Detalle del ticket | ${APP_NAME}` },
    { name: "description", content: "Ver y gestionar un ticket" },
  ];
}

export default function TicketDetailRoute({ params }: Route.ComponentProps) {
  return <TicketDetail ticketId={params.ticketId} />;
}
