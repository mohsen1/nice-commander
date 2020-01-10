import React from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";

import { isDarkModeEnabled } from "./utils/colors";

function getHeight(value?: string, maxHeight: number = 25) {
  if (!value) return "200px";
  const lines = value.split("\n").length;

  return `${Math.min(lines, maxHeight)}em`;
}

const Editor: React.FC<EditorProps & {
  readonly?: boolean;
  maxHeight?: number;
}> = props => (
  <MonacoEditor
    theme={isDarkModeEnabled() ? "dark" : "light"}
    language="json"
    options={{
      minimap: { enabled: false },
      scrollBeyondLastColumn: 0,
      scrollBeyondLastLine: 0,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: false,
        ...(props?.options?.scrollbar ?? {})
      },
      ...(props.options ?? {}),
      readOnly: props.readonly ?? false
    }}
    height={getHeight(props.value, props.maxHeight)}
    {...props}
  />
);

export default Editor;
