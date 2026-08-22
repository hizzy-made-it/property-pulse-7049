import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { Footer, Nav } from "./nav";
import { useSession } from "../lib/auth";

/** Shared chrome: sticky nav, 1360px content column, hairline footer. */
export function Layout({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: wide ? 1440 : 1360,
          margin: "0 auto",
          padding: "36px 40px 0",
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  if (isPending) return <Loading label="CHECKING SESSION" />;
  if (!session) return <Redirect to="/auth" />;
  return <>{children}</>;
}

export function Loading({ label = "LOADING" }: { label?: string }) {
  return (
    <div
      className="micro"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "var(--color-muted)",
        padding: "40px 0",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          border: "1.5px solid var(--color-accent)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "pp-spin 700ms linear infinite",
          display: "inline-block",
        }}
      />
      {label}
      <style>{"@keyframes pp-spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

/** Inline spinner for pending action buttons. */
export function Spinner({ size = 11 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: "1.5px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "pp-spin 700ms linear infinite",
      }}
    >
      <style>{"@keyframes pp-spin{to{transform:rotate(360deg)}}"}</style>
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-muted"
      style={{
        border: "1px dashed var(--color-divider)",
        padding: "34px 22px",
        textAlign: "center",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
