import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppState {
  dbUrl: string;
  dbName: string;
  connected: boolean;
  setDb: (url: string, name: string) => void;
  clearDb: () => void;
  docsReady: boolean;
  setDocsReady: (ready: boolean) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
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

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
