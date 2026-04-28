import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Github, Mail, Lock, ShieldCheck, Globe, User } from "lucide-react";
import { motion } from "motion/react";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#050508] p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full scale-150"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative z-10 transition-colors"
      >
        <div className="p-10 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] relative">
              <ShieldCheck className="w-10 h-10 text-white" />
              <div className="absolute inset-0 rounded-[2rem] border-2 border-white/20 animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-widest uppercase transition-colors">Flex<span className="text-blue-500">Gen</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2">Security Access Protocol</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-3">
              <div className="relative group transition-all">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-all font-mono"
                  required
                />
              </div>
              <div className="relative group transition-all">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
              >
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest leading-relaxed transition-colors">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? "Synchronizing..." : isRegister ? "Initialize Account" : "Access System"}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isRegister ? "// Switch to: Standard Login" : "// Switch to: New Initialization"}
            </button>
          </div>
        </div>

        <div className="px-12 py-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/5 text-center transition-colors">
          <p className="text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.5em] transition-colors">Global Relay Node v5.0.0-verified</p>
        </div>
      </motion.div>
    </div>
  );
}
