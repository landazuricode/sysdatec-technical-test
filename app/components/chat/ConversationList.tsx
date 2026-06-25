import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import type { SerializedConversation } from "~/utils/serializers";

type ConversationSummary = Omit<SerializedConversation, "messages">;

type ConversationListProps = {
  conversations: ConversationSummary[];
  activeId: string | null;
};

function ConversationItem({
  conversation,
  isActive,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
}) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  // Si se elimina la conversación activa, volver al inicio del chat
  const isDeleting =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete";

  useEffect(() => {
    if (isDeleting && isActive) {
      navigate("/chat", { replace: true });
    }
  }, [isDeleting, isActive, navigate]);

  if (isDeleting) return null;

  const submitRename = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(conversation.title);
      setIsEditing(false);
      return;
    }
    fetcher.submit(
      { intent: "rename", conversationId: conversation.id, title: trimmed },
      { method: "post", action: "/chat" },
    );
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") {
              setTitle(conversation.title);
              setIsEditing(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={submitRename}
          className="text-accent-success"
          aria-label="Guardar título"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setTitle(conversation.title);
            setIsEditing(false);
          }}
          className="text-muted-foreground"
          aria-label="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary-subtle text-foreground ring-1 ring-inset ring-border"
          : "text-foreground hover:bg-primary-subtle",
      ].join(" ")}
    >
      <Link
        to={`/chat/${conversation.id}`}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{conversation.title}</span>
      </Link>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Renombrar conversación"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <fetcher.Form method="post" action="/chat">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <button
            type="submit"
            className="text-muted-foreground hover:text-accent-danger"
            aria-label="Eliminar conversación"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </fetcher.Form>
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeId,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Link
          to="/chat"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-primary-subtle px-3 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-foreground/25 hover:bg-foreground/5"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Aún no tienes conversaciones.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <ConversationItem
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
