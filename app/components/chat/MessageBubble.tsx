import { Bot } from "lucide-react";
import { MarkdownContent } from "~/components/ui/MarkdownContent";
import { ToolCallCard } from "./ToolCallCard";
import type { ChatMessageView } from "./types";

type MessageBubbleProps = {
  message: ChatMessageView;
  userInitials: string;
};

// Indicador de "escribiendo" (tres puntos)
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
    </span>
  );
}

export function MessageBubble({ message, userInitials }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground shadow-sm">
          {message.content}
        </div>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {userInitials || "Tú"}
        </span>
      </div>
    );
  }

  const resultById = new Map(message.toolResults.map((r) => [r.id, r]));
  const hasContent = message.content.trim().length > 0;
  const showTyping =
    message.streaming && !hasContent && message.toolCalls.length === 0;

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-violet-subtle text-accent-violet ring-1 ring-accent-violet/15">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-2.5">
        {message.toolCalls.map((tc) => (
          <ToolCallCard
            key={tc.id}
            toolCall={tc}
            toolResult={resultById.get(tc.id)}
          />
        ))}

        {showTyping && (
          <div className="w-fit rounded-2xl rounded-tl-md border border-border/80 bg-primary-subtle px-4 py-3 shadow-sm">
            <TypingDots />
          </div>
        )}

        {hasContent && (
          <div className="w-fit max-w-full rounded-2xl rounded-tl-md border border-border/80 bg-primary-subtle px-4 py-2.5 text-sm text-foreground shadow-sm">
            <MarkdownContent
              content={message.content}
              className="chat-markdown-preview text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );
}
