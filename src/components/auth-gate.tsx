"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth";

/**
 * Sign-in overlay shown when edit mode is requested without a Supabase session.
 * Anon visitors keep the full read experience; only the owner gets past this.
 */
export function AuthGate({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState(
    typeof window !== "undefined" ? localStorage.getItem("dash-auth-email") ?? "" : "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    localStorage.setItem("dash-auth-email", email.trim());
    setPassword("");
    onSuccess();
  };

  const field: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 4,
    color: "#eee",
    fontFamily: "inherit",
    fontSize: 13,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          width: "min(320px, 90vw)",
          background: "#161318",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 8,
          padding: "22px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#d9b451", fontWeight: 600 }}>
          OWNER SIGN-IN
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "#999" }}>
          Edits write to the live database. Viewing never needs this.
        </div>
        <input
          type="email"
          required
          placeholder="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={field}
        />
        <input
          type="password"
          required
          placeholder="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={field}
        />
        {error && (
          <div style={{ fontSize: 11, color: "#e5484d", lineHeight: 1.4 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            disabled={busy}
            style={{
              ...field,
              cursor: busy ? "wait" : "pointer",
              background: "#d9b451",
              border: "1px solid #d9b451",
              color: "#161318",
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {busy ? "SIGNING IN…" : "UNLOCK EDITS"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...field, cursor: "pointer", width: "auto", flexShrink: 0 }}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
