import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "theme";

type ThemeType = "dark" | "light";

type State = {
  theme: ThemeType;
};

type ContextType = State & {
  toggleTheme: (theme?: ThemeType) => void;
};

const ThemeContext = createContext<ContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: PropsWithChildren<unknown>) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const storedTheme = localStorage.getItem(KEY) as ThemeType; //make typescript satified
    return storedTheme || "light";
  });

  const toggleTheme = useCallback(
    (theme?: ThemeType) => {
      setTheme((prev) => (theme ? theme : prev === "light" ? "dark" : "light"));
    },
    [setTheme],
  );

  useEffect(() => {
    localStorage.setItem(KEY, theme);
    document.body.className = theme;
  }, [theme]);

  const value = useMemo(() => ({ toggleTheme, theme }), [toggleTheme, theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
