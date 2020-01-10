import React from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";

import { isDarkModeEnabled } from "./utils/colors";

const Editor: React.FC<EditorProps & { readonly?: boolean }> = props => (
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
    height="200px"
    {...props}
  />
);

export default Editor;
