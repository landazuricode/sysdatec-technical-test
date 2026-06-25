import type { LoaderFunctionArgs } from "react-router";
import { ChatPage } from "~/components/chat/ChatPage";
import { APP_NAME } from "~/config/constants";
import { getConversation, listConversations } from "~/data/conversations";
import { serializeConversation } from "~/utils/serializers";

export { action } from "./index";

export function meta() {
  return [
    { title: `Copiloto IA | ${APP_NAME}` },
    {
      name: "description",
      content: "Asistente de IA para consultar y operar tickets",
    },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const conversationId = params.conversationId as string;

  const [listResult, conversationResult] = await Promise.all([
    listConversations(null),
    getConversation(conversationId),
  ]);

  if (!listResult.ok) {
    throw new Response(listResult.error, { status: 500 });
  }

  if (!conversationResult.ok) {
    if (conversationResult.code === "NOT_FOUND") {
      throw new Response(conversationResult.error, { status: 404 });
    }
    throw new Response(conversationResult.error, { status: 500 });
  }

  return {
    conversations: listResult.data.map((c) => serializeConversation(c)),
    activeConversation: serializeConversation(conversationResult.data),
  };
}

export default function Route() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPage />
    </div>
  );
}
