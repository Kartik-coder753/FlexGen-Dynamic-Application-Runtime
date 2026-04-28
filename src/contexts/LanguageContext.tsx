import React, { createContext, useContext, useState, ReactNode } from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: Record<string, string> | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, defaultLang = "en" }: { children: ReactNode; defaultLang?: string }) {
  const [language, setLanguage] = useState(defaultLang);

  const t = (input: Record<string, string> | string) => {
    if (typeof input === "string") return input;
    return input[language] || input["en"] || Object.values(input)[0] || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
}
