"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useEditMode } from "@/lib/edit-context";

interface BaseProps {
  value: string;
  onCommit: (next: string) => void;
  width?: number | string;
  align?: "left" | "right" | "center";
  staticStyle?: CSSProperties;
  inputStyle?: CSSProperties;
  multiline?: boolean;
  options?: readonly string[];
  placeholder?: string;
}

export function EditableField({
  value,
  onCommit,
  width,
  align = "left",
  staticStyle,
  inputStyle,
  multiline = false,
  options,
  placeholder,
}: BaseProps) {
  const { editMode } = useEditMode();
  const [local, setLocal] = useState(value);
  const initial = useRef(value);

  // If the upstream value changes (e.g. another tab edit, CLI write), sync.
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  if (!editMode) {
    return (
      <span style={{ textAlign: align, ...staticStyle }}>
        {value || placeholder || ""}
      </span>
    );
  }

  const commit = (raw: string) => {
    if (raw !== initial.current) {
      initial.current = raw;
      onCommit(raw);
    }
  };

  const baseInputStyle: CSSProperties = {
    width: width ?? "100%",
    minWidth: 60,
    padding: "2px 6px",
    background: "rgba(126,224,255,0.08)",
    border: "1px solid rgba(120,220,255,0.32)",
    color: "inherit",
    font: "inherit",
    textAlign: align,
    outline: "none",
    borderRadius: 0,
    ...inputStyle,
  };

  if (options) {
    return (
      <select
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          commit(e.target.value);
        }}
        style={baseInputStyle}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    );
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLInputElement | HTMLTextAreaElement).blur();
    }
    if (e.key === "Escape") {
      setLocal(initial.current);
      (e.target as HTMLInputElement | HTMLTextAreaElement).blur();
    }
  };

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        rows={2}
        style={{ ...baseInputStyle, resize: "vertical" }}
      />
    );
  }

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={onKey}
      placeholder={placeholder}
      style={baseInputStyle}
    />
  );
}
