import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ConfigModeContextValue {
  /** When true, floor plan markers can be dragged, SLD nodes can be moved/connected */
  configMode: boolean;
  setConfigMode: (on: boolean) => void;
  toggleConfigMode: () => void;
}

const ConfigModeContext = createContext<ConfigModeContextValue>({
  configMode: false,
  setConfigMode: () => {},
  toggleConfigMode: () => {},
});

export function ConfigModeProvider({ children }: { children: ReactNode }) {
  const [configMode, setConfigMode] = useState(false);
  const toggleConfigMode = useCallback(() => setConfigMode((v) => !v), []);

  return (
    <ConfigModeContext.Provider value={{ configMode, setConfigMode, toggleConfigMode }}>
      {children}
    </ConfigModeContext.Provider>
  );
}

export function useConfigMode() {
  return useContext(ConfigModeContext);
}
