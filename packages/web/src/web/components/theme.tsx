import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const KEY = "pp-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

function read(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(KEY);
  return stored === "dark" ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(read);

  useEffect(() => {
    apply(theme);
    window.localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/** LIGHT / DARK segmented control used in the top nav. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="seg" aria-label="Colour theme">
      <button
        type="button"
        className="seg-opt micro"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        type="button"
        className="seg-opt micro"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
    </div>
  );
}
