import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessageView } from "./types";

type MessageListProps = {
  messages: ChatMessageView[];
  userInitials: string;
};

export function MessageList({ messages, userInitials }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan nuevos tokens o mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-6 px-1 py-2">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          userInitials={userInitials}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
