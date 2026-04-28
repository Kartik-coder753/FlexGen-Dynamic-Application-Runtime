import React, { useState, useEffect } from "react";
import { AppConfig, NavItem } from "../types/config";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import * as Icons from "lucide-react";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Dashboard } from "./Dashboard";
import { DynamicTable } from "./DynamicTable";
import { DynamicForm } from "./DynamicForm";
import { CSVImport } from "./CSVImport";
import { motion, AnimatePresence } from "motion/react";
import { cn, handleFirestoreError, OperationType, sanitizeData } from "../lib/utils";

interface AppShellProps {
  config: AppConfig;
}

export function AppShell({ config }: AppShellProps) {
  const [activeNav, setActiveNav] = useState(config.layout.navigation[0].id);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const { language, setLanguage, t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const activeItem = config.layout.navigation.find(n => n.id === activeNav) || config.layout.navigation[0];

  useEffect(() => {
    if (!activeItem.entity || !user) {
      setData([]);
      return;
    }

    setIsLoading(true);
    const entityPath = `content/${activeItem.entity}`;
    const q = query(
      collection(db, "content"),
      where("entityType", "==", activeItem.entity),
      where("ownerId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data().data })));
      setIsLoading(false);
      setErrorNotification(null);
    }, (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, entityPath);
      } catch (e: any) {
        setErrorNotification(e.message);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeItem.entity]);

  const handleFormSubmit = async (formData: any) => {
    if (!activeItem.entity || !user) return;
    try {
      await addDoc(collection(db, "content"), {
        entityType: activeItem.entity,
        data: sanitizeData(formData),
        ownerId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setErrorNotification(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `content/${activeItem.entity}`);
      } catch (e: any) {
        setErrorNotification(e.message);
      }
    }
  };

  const renderContent = () => {
    switch (activeItem.type) {
      case "dashboard":
        return <Dashboard />;
      case "table":
        const entityConfig = config.entities[activeItem.entity!];
        if (!entityConfig) return <div className="p-8 text-center text-red-500 font-bold">Error: Unknown Entity Configuration</div>;
        return (
          <div className="space-y-12">
            <header className="flex items-center justify-between">
              <div>
                <h2 className={cn(
                  "text-4xl font-black tracking-tighter uppercase font-mono transition-colors",
                  activeItem.id === 'users' ? "text-blue-500 dark:text-blue-400" : 
                  activeItem.id === 'projects' ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                )}>
                  {t(activeItem.label)}
                </h2>
                <p className="text-slate-500 font-medium tracking-wide mt-1 underline decoration-slate-900/10 dark:decoration-white/10 underline-offset-4">
                  Autonomous data management for {activeItem.entity} cluster.
                </p>
              </div>
            </header>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
              <div className="xl:col-span-2">
                <DynamicTable config={entityConfig} data={data} isLoading={isLoading} />
              </div>
              <div className="xl:col-span-1 border-l border-slate-200 dark:border-white/5 pl-12 space-y-8 sticky top-8">
                <DynamicForm config={entityConfig} onSubmit={handleFormSubmit} />
              </div>
            </div>
          </div>
        );
      case "import":
        return <CSVImport entities={config.entities} />;
      default:
        return <div className="p-20 text-center text-gray-400 italic">Component interface not found for {activeItem.type}</div>;
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#050508] text-slate-900 dark:text-slate-300 overflow-hidden font-sans transition-colors duration-300">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white"
      >
        {isSidebarOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-white/5 bg-[#ffffff] dark:bg-[#07070c] flex flex-col p-6 transition-all duration-300 transform lg:translate-x-0 lg:static lg:inset-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-4 mb-10 px-2 transition-opacity">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Icons.Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase transition-colors">Flex<span className="text-blue-500">Gen</span></h1>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest">{config.version}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 px-3 pb-3 tracking-widest">Navigation</p>
          {config.layout.navigation.map((item) => {
            const Icon = (Icons as any)[item.icon] || Icons.HelpCircle;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group relative text-sm",
                  active 
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 shadow-inner" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform", active ? "scale-110" : "group-hover:scale-110")} />
                <span>{t(item.label)}</span>
                {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
              </button>
            );
          })}
        </nav>

        <div className="pt-6 space-y-4 border-t border-slate-200 dark:border-white/5">
          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              {user?.username?.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
              <p className="text-[9px] text-slate-500 uppercase">Superuser</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Global Header */}
        <header className="h-16 lg:h-20 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 lg:px-12 bg-white/50 dark:bg-[#050508]/50 backdrop-blur-xl z-20 transition-all duration-300">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
             <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Channel_Verified: AES-256</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-1 items-center border-r border-slate-200 dark:border-white/10 pr-6 mr-0">
               {config.localization.supportedLanguages.map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      "w-7 h-7 rounded text-[9px] font-black uppercase transition-all",
                      language === lang ? "bg-blue-600/10 text-blue-600 dark:bg-white/10 dark:text-white border border-blue-600/20 dark:border-white/20" : "bg-transparent text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-400"
                    )}
                  >
                    {lang}
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
               <button 
                  onClick={toggleTheme}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all group"
                  title="Toggle Visual Mode"
                >
                  {theme === 'dark' ? (
                    <Icons.Sun className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
                  ) : (
                    <Icons.Moon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                  )}
                </button>

                <button 
                  onClick={logout}
                  className="p-2 hover:bg-rose-500/10 rounded-xl transition-all group"
                  title="Terminate Session"
                >
                  <Icons.LogOut className="w-5 h-5 text-slate-500 group-hover:text-rose-500 transition-colors" />
                </button>
            </div>
          </div>
        </header>

      {/* Global Error Notification */}
      <AnimatePresence>
        {errorNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-[#1a0a0a] border border-rose-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-4 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Icons.AlertOctagon className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">System Exception</p>
                <p className="text-sm text-slate-200 leading-snug">{errorNotification}</p>
              </div>
              <button 
                onClick={() => setErrorNotification(null)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 bg-immersive-gradient overflow-y-auto p-6 lg:p-12 relative">
          {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" />}
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
