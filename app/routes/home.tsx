import type { Route } from "./+types/home";
import { TicketDashboard } from "../components/tickets/TicketDashboard";
import { APP_DESCRIPTION, APP_NAME } from "~/config/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Panel de control | ${APP_NAME}` },
    { name: "description", content: APP_DESCRIPTION },
  ];
}

export default function Home() {
  return <TicketDashboard />;
}
