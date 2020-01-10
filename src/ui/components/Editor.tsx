import React from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";

import { isDarkModeEnabled } from "./utils/colors";

const Editor: React.FC<EditorProps & { readonly?: boolean }> = props => (
  <MonacoEditor
    theme={isDarkModeEnabled() ? "dark" : "light"}
    language="json"
    options={{
      ...(props.options ?? {}),
      readOnly: props.readonly ?? false,
      minimap: { enabled: false }
    }}
    height="200px"
    {...props}
  />
);

export default Editor;
