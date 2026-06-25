import { useEffect, useState } from "react";

type MarkdownEditorProps = {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editorKey?: string;
};

export function MarkdownEditor({
  id,
  name,
  value,
  onChange,
  placeholder,
  editorKey = "new",
}: MarkdownEditorProps) {
  const [Client, setClient] = useState<
    typeof import("./MarkdownEditorClient").MarkdownEditorClient | null
  >(null);

  useEffect(() => {
    void import("./MarkdownEditorClient").then((mod) => {
      setClient(() => mod.MarkdownEditorClient);
    });
  }, []);

  return (
    <div className="mt-1.5">
      <input type="hidden" name={name} value={value} />
      {Client ? (
        <div id={id}>
          <Client
            key={editorKey}
            initialMarkdown={value}
            onChange={onChange}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border bg-primary-subtle/40 text-sm text-muted-foreground">
          Cargando editor...
        </div>
      )}
    </div>
  );
}
