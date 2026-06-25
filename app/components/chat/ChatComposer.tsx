import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

type ChatComposerProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  focusTrigger?: number;
};

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
  disabled,
  focusTrigger = 0,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    if (focusTrigger > 0) focusInput();
  }, [focusTrigger]);

  // Ajustar la altura del textarea al contenido
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      focusInput();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-foreground/20 focus-within:ring-2 focus-within:ring-foreground/5">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto de línea)"
          disabled={disabled}
          className="max-h-48 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-foreground transition-colors hover:bg-foreground/10"
            aria-label="Detener generación"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || disabled}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
