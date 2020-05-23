import React from "react";

interface AppContextType {
  baseUrl: string | null;
}

export const AppContext = React.createContext<AppContextType>({
  baseUrl: null,
});
