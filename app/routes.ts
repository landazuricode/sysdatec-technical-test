import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("layouts/AppLayout.tsx", [
    index("routes/home.tsx"),
    route("tickets/new", "routes/tickets/new.tsx"),
    route("tickets/:ticketId", "routes/tickets/details.tsx"),
    route("reports", "routes/reports/index.tsx"),
    route("chat", "routes/chat/index.tsx"),
    route("chat/:conversationId", "routes/chat/conversation.tsx"),
  ]),
  route("api/chat", "routes/api/chat.ts"),
] satisfies RouteConfig;
