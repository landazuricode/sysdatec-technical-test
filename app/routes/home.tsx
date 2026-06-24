import type { Route } from "./+types/home";
import { TicketDashboard } from "../components/tickets/TicketDashboard";
import { APP_DESCRIPTION, APP_NAME } from "~/config/constants";
import { getTicketStats, listTickets } from "~/data/tickets";
import { serializeTicket } from "~/data/serializers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Panel de control | ${APP_NAME}` },
    { name: "description", content: APP_DESCRIPTION },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? undefined;

  const [ticketsResult, statsResult] = await Promise.all([
    listTickets(search),
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
    search: search ?? "",
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <TicketDashboard {...loaderData} />;
}
