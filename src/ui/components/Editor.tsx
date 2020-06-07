import React, { useRef } from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";

function getHeight(value?: string, maxHeight = 25, minHeight = 5) {
  if (!value) return "200px";
  const lines = value.split("\n").length;

  return `${Math.max(Math.min(lines, maxHeight), minHeight)}em`;
}

function getTheme() {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const Editor: React.FC<
  EditorProps & {
    readonly?: boolean;
    maxHeight?: number;
    /** Keep scrolling to the end as values change */
    follow?: boolean;
  }
> = (props) => {
  const editor = useRef<monacoEditor.editor.IStandaloneCodeEditor>();

  if (props.follow && editor.current) {
    editor.current.revealLineInCenter(props.value?.length);
  }

  return (
    <MonacoEditor
      theme={getTheme()}
      language="json"
      height={getHeight(props.value, props.maxHeight)}
      editorDidMount={(_, e) => (editor.current = e)}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastColumn: 10,
        scrollBeyondLastLine: true,
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          ...(props?.options?.scrollbar ?? {}),
        },
        ...(props.options ?? {}),
        readOnly: props.readonly ?? false,
      }}
      {...props}
    />
  );
};

export default Editor;
