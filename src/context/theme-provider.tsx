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

type ContextType = {
  theme: ThemeType;
  toggleTheme: (theme?: ThemeType) => void;
};

const ThemeContext = createContext<ContextType>({
  theme: "light",
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
      setTheme((prev) => {
        if (theme) {
          return theme;
        }
        return prev === "light" ? "dark" : "light";
      });
    },
    [setTheme],
  );

  useEffect(() => {
    localStorage.setItem(KEY, theme);
    document.body.className = theme;
  }, [theme]);

  const value = useMemo(() => {
    return {
      theme,
      toggleTheme,
    };
  }, [toggleTheme, theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
