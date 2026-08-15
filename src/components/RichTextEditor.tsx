"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
}

export function RichTextEditor({ name, label, defaultValue }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-1 text-sm text-zinc-600">
      {label && <span>{label}</span>}
      <input type="hidden" name={name} value={value} />
      <div className="rich-text-editor rounded-md border border-zinc-200">
        {mounted ? (
          <CKEditor
            editor={ClassicEditor}
            data={defaultValue ?? ""}
            config={{
              licenseKey: "GPL",
              plugins: [Essentials, Paragraph, Bold, Italic, Link, List, Heading, BlockQuote],
              toolbar: [
                "heading",
                "|",
                "bold",
                "italic",
                "link",
                "bulletedList",
                "numberedList",
                "blockQuote",
                "|",
                "undo",
                "redo",
              ],
            }}
            onChange={(_event, editor) => setValue(editor.getData())}
          />
        ) : (
          <div className="h-40 animate-pulse bg-zinc-50" />
        )}
      </div>
    </div>
  );
}
