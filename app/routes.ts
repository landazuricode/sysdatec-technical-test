import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("layouts/AppLayout.tsx", [
    index("routes/home.tsx"),
    route("tickets/new", "routes/tickets.new.tsx"),
    route("tickets/:ticketId", "routes/tickets.$ticketId.tsx"),
  ]),
] satisfies RouteConfig;
