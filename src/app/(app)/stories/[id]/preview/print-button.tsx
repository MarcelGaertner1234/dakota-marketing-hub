"use client"

import { Printer, Download } from "lucide-react"

/**
 * Client-side Print Button that calls window.print().
 * Triggers the browser's native print dialog, which lets the user
 * "Save as PDF" — same effect as Cmd+P, but with an explicit button
 * so users don't need to know the keyboard shortcut.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "#C5A572",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 18px",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-assistant), system-ui, sans-serif",
        letterSpacing: "0.02em",
        boxShadow: "0 2px 8px rgba(197, 165, 114, 0.3)",
      }}
    >
      <Download style={{ width: 16, height: 16 }} />
      Als PDF herunterladen
    </button>
  )
}
