"use client";

import { createContext, useContext } from "react";
import { useTheme } from "next-themes";

type MeetingThemeContextType = {
  theme: string | undefined;
  setTheme: (theme: string) => void;
};

const MeetingThemeContext = createContext<MeetingThemeContextType | undefined>(undefined);

export function MeetingThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <MeetingThemeContext.Provider value={{ theme, setTheme }}>
      <div className="meeting-theme-provider contents">
        {children}
      </div>
    </MeetingThemeContext.Provider>
  );
}

export const useMeetingTheme = () => {
  const context = useContext(MeetingThemeContext);
  if (!context) throw new Error("useMeetingTheme must be used within MeetingThemeProvider");
  return context;
};
