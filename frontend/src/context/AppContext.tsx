// frontend/src/context/AppContext.tsx
import React, { createContext, useContext, useState } from "react";

interface AppState {
  // NL2SQL
  dbUrl: string;
  dbName: string;
  connected: boolean;
  setDb: (url: string, name: string) => void;
  clearDb: () => void;

  // Copilot
  docsReady: boolean;
  setDocsReady: (ready: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbUrl, setDbUrl] = useState("");
  const [dbName, setDbName] = useState("");
  const [connected, setConnected] = useState(false);
  const [docsReady, setDocsReady] = useState(false);

  const setDb = (url: string, name: string) => {
    setDbUrl(url);
    setDbName(name);
    setConnected(true);
  };

  const clearDb = () => {
    setDbUrl("");
    setDbName("");
    setConnected(false);
  };

  return (
    <AppContext.Provider value={{ dbUrl, dbName, connected, setDb, clearDb, docsReady, setDocsReady }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};