import { useEffect, useState } from "react";
import { useTheme } from "~/hooks/useTheme";
import "@uiw/react-markdown-preview/markdown.css";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const { theme } = useTheme();
  const [Preview, setPreview] = useState<
    typeof import("@uiw/react-markdown-preview").default | null
  >(null);

  useEffect(() => {
    void import("@uiw/react-markdown-preview").then((mod) => {
      setPreview(() => mod.default);
    });
  }, []);

  if (!Preview) {
    return (
      <p
        className={`whitespace-pre-wrap text-sm text-muted-foreground ${className ?? ""}`}
      >
        {content}
      </p>
    );
  }

  return (
    <div
      className={`ticket-markdown-preview text-sm text-muted-foreground ${className ?? ""}`}
      data-color-mode={theme}
    >
      <Preview source={content} />
    </div>
  );
}
