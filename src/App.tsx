import { useConfig } from "./hooks/useConfig";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./components/LoginPage";
import { Loader2, AlertCircle } from "lucide-react";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading, error: configError } = useConfig();

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#050508] space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.3)]">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/50 animate-pulse">Initializing FlexGen</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-[#050508] p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-10 rounded-[2rem] shadow-2xl border border-red-100 dark:border-white/5 text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Initialization Failure</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{configError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <LanguageProvider defaultLang={config!.localization.defaultLanguage}>
      <AppShell config={config!} />
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

