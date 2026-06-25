import type { ActionFunctionArgs } from "react-router";
import { ChatPage } from "~/components/chat/ChatPage";
import { APP_NAME } from "~/config/constants";
import {
  deleteConversation,
  listConversations,
  renameConversation,
} from "~/data/conversations";
import { getFormDataRequest } from "~/utils";
import { serializeConversation } from "~/utils/serializers";

export function meta() {
  return [
    { title: `Copiloto IA | ${APP_NAME}` },
    {
      name: "description",
      content: "Asistente de IA para consultar y operar tickets",
    },
  ];
}

export async function loader() {
  const result = await listConversations(null);
  if (!result.ok) {
    throw new Response(result.error, { status: 500 });
  }

  return {
    conversations: result.data.map((c) => serializeConversation(c)),
    activeConversation: null,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await getFormDataRequest(request);
  const intent = formData.intent;
  const conversationId = formData.conversationId;

  if (intent === "delete" && typeof conversationId === "string") {
    const result = await deleteConversation(conversationId);
    return { ok: result.ok, intent };
  }

  if (intent === "rename" && typeof conversationId === "string") {
    const result = await renameConversation(conversationId, formData.title ?? "");
    return { ok: result.ok, intent };
  }

  return { ok: false, intent: "unknown" };
}

export default function Route() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPage />
    </div>
  );
}
