"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface EditContextValue {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  toggleEditMode: () => void;
}

const EditCtx = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);
  return (
    <EditCtx.Provider value={{ editMode, setEditMode, toggleEditMode }}>
      {children}
    </EditCtx.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditCtx);
  if (!ctx) {
    return {
      editMode: false,
      setEditMode: () => {},
      toggleEditMode: () => {},
    };
  }
  return ctx;
}
