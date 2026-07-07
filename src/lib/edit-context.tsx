"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { hasSession } from "./auth";
import { AuthGate } from "@/components/auth-gate";

interface EditContextValue {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  toggleEditMode: () => void;
}

const EditCtx = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: React.ReactNode }) {
  const [editMode, setEditModeState] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const editRef = useRef(false);

  // Turning edit mode ON requires the owner's Supabase session (anon is
  // read-only under RLS since 2026-07-07). Locking is always allowed.
  const setEditMode = useCallback((v: boolean) => {
    if (!v) {
      editRef.current = false;
      setEditModeState(false);
      return;
    }
    void hasSession().then((ok) => {
      if (ok) {
        editRef.current = true;
        setEditModeState(true);
      } else {
        setAuthOpen(true);
      }
    });
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode(!editRef.current);
  }, [setEditMode]);

  return (
    <EditCtx.Provider value={{ editMode, setEditMode, toggleEditMode }}>
      {children}
      <AuthGate
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          editRef.current = true;
          setEditModeState(true);
        }}
      />
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
