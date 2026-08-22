import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Blueprint } from "../components/blueprint";
import { Spinner } from "../components/layout";
import { authClient, useSession } from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "email" | null>(null);

  if (session) {
    navigate("/dashboard", { replace: true });
  }

  const finish = async () => {
    await qc.invalidateQueries();
    navigate(mode === "signup" ? "/onboarding" : "/dashboard", { replace: true });
  };

  const google = async () => {
    setError(null);
    setPending("google");
    const result = await authClient.signIn.social({ provider: "google" });
    setPending(null);
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed.");
      return;
    }
    await finish();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending("email");
    const result =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
        : await authClient.signIn.email({ email, password });
    setPending(null);
    if (result.error) {
      setError(result.error.message ?? "Could not authenticate.");
      return;
    }
    await finish();
  };

  return (
    <div className="pp-rise" style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 60, alignItems: "center", minHeight: "70vh" }}>
      <div>
        <div className="kicker" style={{ marginBottom: 12 }}>
          PP-00 · ACCESS
        </div>
        <h1 style={{ margin: 0, fontSize: 52, lineHeight: 1.02 }}>
          Same inputs.
          <br />
          Same scores.
        </h1>
        <p className="text-muted" style={{ fontSize: 17, maxWidth: 460, marginTop: 16 }}>
          Sign in to save properties, run stress tests, buy qualified leads and hold your place on
          the season board. Every action posts PulsePoints to a server-side ledger.
        </p>
        <div className="micro text-muted" style={{ marginTop: 26, lineHeight: 2 }}>
          FREE STARTER TIER · PUBLIC BROWSING · PUBLISHED METHODOLOGY · CANCEL ANYTIME
        </div>
      </div>

      <Blueprint style={{ background: "var(--color-surface)" }}>
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className="micro"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                cursor: "pointer",
                background: mode === m ? "var(--color-accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--color-text)",
              }}
            >
              {m === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={google}
            disabled={pending !== null}
          >
            {pending === "google" ? <Spinner /> : "Continue with Google"}
          </button>

          <div
            className="micro text-muted"
            style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--color-hairline)" }} />
            OR
            <span style={{ flex: 1, height: 1, background: "var(--color-hairline)" }} />
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {mode === "signup" ? (
              <label className="field">
                <span className="micro text-muted">NAME</span>
                <input
                  aria-label="Name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Jordan Reyes"
                />
              </label>
            ) : null}
            <label className="field">
              <span className="micro text-muted">EMAIL</span>
              <input
                aria-label="Email"
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span className="micro text-muted">PASSWORD</span>
              <input
                aria-label="Password"
                className="input"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
              />
            </label>

            {error ? (
              <div className="micro" style={{ color: "var(--accent-ink-strong)" }}>
                {error.toUpperCase()}
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary btn-block" disabled={pending !== null}>
              {pending === "email" ? <Spinner /> : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="micro text-muted" style={{ marginTop: 16 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              ← BACK TO BROWSING
            </Link>
          </div>
        </div>
      </Blueprint>
    </div>
  );
}
