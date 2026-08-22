import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface AwardLike {
  points: number;
  label: string;
  bonuses?: { points: number; label: string }[];
}

interface ToastItem {
  id: number;
  text: string;
}

interface ToastContextValue {
  push: (text: string) => void;
  /** Raise the ORDER FILLED plate for any mutation that returned an award. */
  pushAward: (award: AwardLike | null | undefined) => void;
}

const ToastContext = createContext<ToastContextValue>({ push: () => {}, pushAward: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const push = useCallback((text: string) => {
    const id = ++next.current;
    setItems((prev) => [...prev, { id, text }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3200);
  }, []);

  const pushAward = useCallback(
    (award: AwardLike | null | undefined) => {
      if (!award) return;
      push(`ORDER FILLED · +${award.points} PP · ${award.label}`);
      award.bonuses?.forEach((b, i) =>
        window.setTimeout(() => push(`BONUS · +${b.points} PP · ${b.label}`), 700 * (i + 1)),
      );
    },
    [push],
  );

  return (
    <ToastContext.Provider value={{ push, pushAward }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        {items.map((item) => (
          <Toast key={item.id} text={item.text} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ text }: { text: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div
      className={`blueprint pp-toast cond${mounted ? "" : ""}`}
      style={{
        background: "var(--plate-ink-bg)",
        color: "var(--plate-ink-text)",
        fontSize: 14,
        letterSpacing: ".06em",
        padding: "11px 16px",
        boxShadow: "var(--shadow-lg)",
        borderColor: "var(--plate-ink-bg)",
      }}
    >
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      {text}
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
