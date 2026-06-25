import { useMemo } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

type MarkdownEditorClientProps = {
  initialMarkdown: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditorClient({
  initialMarkdown,
  onChange,
  placeholder,
}: MarkdownEditorClientProps) {
  const plugins = useMemo(
    () => [
      headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
      listsPlugin(),
      quotePlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarClassName: "ticket-mdx-editor-toolbar",
        toolbarContents: () => (
          <>
            <UndoRedo />
            <BoldItalicUnderlineToggles />
            <BlockTypeSelect />
            <ListsToggle options={["bullet", "number"]} />
          </>
        ),
      }),
    ],
    [],
  );

  return (
    <MDXEditor
      markdown={initialMarkdown}
      onChange={onChange}
      placeholder={placeholder}
      plugins={plugins}
      className="ticket-mdx-editor"
      contentEditableClassName="ticket-mdx-editor-content"
    />
  );
}
