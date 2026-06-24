import type { Route } from "./+types/home";
import { TicketDashboard } from "../components/tickets/TicketDashboard";
import { APP_DESCRIPTION, APP_NAME } from "~/config/constants";
import { getTicketStats, listTickets } from "~/data/tickets";
import { serializeTicket } from "~/utils/serializers";
import { parseTicketListFilters } from "~/utils";

export function meta() {
  return [
    { title: `Panel de control | ${APP_NAME}` },
    { name: "description", content: APP_DESCRIPTION },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters = parseTicketListFilters(url.searchParams);

  const [ticketsResult, statsResult] = await Promise.all([
    listTickets(filters),
    getTicketStats(),
  ]);

  if (!ticketsResult.ok) {
    throw new Response(ticketsResult.error, { status: 500 });
  }

  if (!statsResult.ok) {
    throw new Response(statsResult.error, { status: 500 });
  }

  return {
    tickets: ticketsResult.data.map(serializeTicket),
    stats: statsResult.data,
    filters,
  };
}

export default function Route() {
  return <TicketDashboard />;
}
