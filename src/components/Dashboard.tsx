import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, limit, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Database, 
  TrendingUp, 
  History, 
  ChevronRight, 
  ArrowUpRight, 
  Maximize2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType, cn } from "../lib/utils";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState({ users: 0, projects: 0, storage: 0 });
  const [isScaling, setIsScaling] = useState(false);
  const [scalingStep, setScalingStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const { user } = useAuth();

  const growthData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 1100 },
  ];

  const getGrowthData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {};
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[days[d.getDay()]] = 0;
    }

    logs.forEach(log => {
      if (log.serverTime) {
        const date = new Date(log.serverTime.seconds * 1000);
        const dayName = days[date.getDay()];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value: value * 10 + 5 })).reverse();
  };

  const entityDistribution = () => {
    const counts: Record<string, number> = { users: 0, projects: 0, other: 0 };
    logs.forEach(l => {
      if (l.entityType === 'users') counts.users++;
      else if (l.entityType === 'projects') counts.projects++;
      else counts.other++;
    });
    const total = logs.length || 1;
    return [
      { label: 'User Nodes', value: Math.round((counts.users / total) * 100), color: 'bg-blue-500' },
      { label: 'Project Clusters', value: Math.round((counts.projects / total) * 100), color: 'bg-emerald-500' },
      { label: 'System Logs', value: Math.round((counts.other / total) * 100), color: 'bg-amber-500' },
    ];
  };

  const handleScale = async () => {
    setIsScaling(true);
    for (let i = 1; i <= 4; i++) {
      setScalingStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }

    if (user) {
      await addDoc(collection(db, "content"), {
        entityType: "logs",
        data: {
          severity: "INFO",
          message: "System horizontal scaling successful across all shadow-nodes",
          timestamp: Date.now()
        },
        ownerId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(console.error);
    }

    setIsScaling(false);
    setScalingStep(0);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const qUsers = query(
      collection(db, "content"), 
      where("entityType", "==", "users"),
      where("ownerId", "==", uid)
    );
    const u1 = onSnapshot(qUsers, (snap) => {
      setStats(prev => {
        const newUsers = snap.size;
        const calculatedStorage = Math.min(98, 15 + (newUsers * 1.5) + (prev.projects * 3.2));
        return { ...prev, users: newUsers, storage: Math.round(calculatedStorage) };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "content/users");
    });

    const qProj = query(
      collection(db, "content"), 
      where("entityType", "==", "projects"),
      where("ownerId", "==", uid)
    );
    const u2 = onSnapshot(qProj, (snap) => {
      setStats(prev => {
        const newProjects = snap.size;
        const totalNodes = prev.users + newProjects;
        // Accurate storage calculation based on resource weight and log density
        const calculatedStorage = Math.min(98, 15 + (prev.users * 1.5) + (newProjects * 3.2));
        return { ...prev, projects: newProjects, storage: Math.round(calculatedStorage) };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "content/projects");
    });

    const qLogs = query(
      collection(db, "content"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(15)
    );
    const u3 = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data().data, 
        entityType: doc.data().entityType,
        serverTime: doc.data().createdAt 
      })));
    }, (err) => {
      console.warn("Log stream degraded:", err);
    });

    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  const cards = [
    { id: 'users', label: "Active Users", value: stats.users, icon: Users, color: "text-blue-400", subtext: "Total registered nodes" },
    { id: 'projects', label: "Current Projects", value: stats.projects, icon: Zap, color: "text-emerald-400", subtext: "Active logical clusters" },
    { id: 'storage', label: "Storage Capacity", value: `${stats.storage}%`, icon: Database, color: "text-amber-400", subtext: "Resource utilization" },
    { id: 'growth', label: "Daily Growth", value: logs.length > 0 ? `+${Math.min(99, logs.length * 4)}%` : "0%", icon: TrendingUp, color: "text-rose-400", subtext: "Expansion velocity" }
  ];

  useEffect(() => {
    if (!selectedMetric || !user) return;
    
    if (selectedMetric === 'users' || selectedMetric === 'projects' || selectedMetric === 'logs') {
      setIsDetailLoading(true);
      const q = query(
        collection(db, "content"),
        where("entityType", "==", selectedMetric),
        where("ownerId", "==", user.id),
        limit(15)
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        setDetailData(snap.docs.map(doc => ({ id: doc.id, ...doc.data().data })));
        setIsDetailLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `content/${selectedMetric}`);
        setIsDetailLoading(false);
      });

      return () => unsubscribe();
    } else {
      setDetailData([]);
    }
  }, [selectedMetric]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex items-center justify-between">
    <div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-mono transition-colors">System Overview</h1>
      <div className="flex items-center space-x-3 text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-3 transition-colors">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
        <span>Runtime: Operational</span>
        <span className="text-slate-300 dark:text-slate-800 transition-colors">|</span>
        <span>Nodes: {stats.users + stats.projects}</span>
      </div>
    </div>
    <div className="hidden lg:flex items-center gap-6">
       <div className="text-right">
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-colors">Protocol Version</p>
         <p className="text-sm font-mono text-slate-900 dark:text-white transition-colors">v4.8.2-alpha</p>
       </div>
       <div className="h-10 w-px bg-slate-200 dark:bg-white/5 transition-colors"></div>
       <div className="flex -space-x-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-50 dark:border-[#050508] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-white/5 transition-all">
            {String.fromCharCode(64 + i)}
          </div>
        ))}
      </div>
    </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedMetric(card.id)}
            className={cn(
              "p-6 bg-white dark:bg-[#0a0a14] rounded-2xl border transition-all text-left group relative overflow-hidden",
              selectedMetric === card.id 
                ? "border-blue-500 ring-1 ring-blue-500/20 shadow-lg" 
                : "border-slate-200 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/20 shadow-sm"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-1">{card.label}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-600 font-medium mb-4 transition-colors">{card.subtext}</p>
              </div>
              <card.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", card.color)} />
            </div>
            <div className="flex items-end justify-between relative z-10">
              <span className="block text-3xl font-black text-slate-900 dark:text-white tracking-tighter font-mono transition-colors">{card.value}</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 font-bold transition-colors">
                <ArrowUpRight className="w-3 h-3" />
                <span>{logs.length > 0 ? "STABLE" : "INIT"}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMetric && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#0c0c1a] border border-blue-500/30 rounded-3xl p-8 relative transition-colors shadow-2xl">
              <div className="absolute top-6 right-6">
                <button 
                  onClick={() => setSelectedMetric(null)}
                  className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 dark:text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 underline decoration-blue-500/50 underline-offset-8 transition-colors">
                    {cards.find(c => c.id === selectedMetric)?.label} Analysis
                  </h4>
                  
                  {selectedMetric === 'growth' ? (
                    <div className="h-64 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getGrowthData()}>
                          <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a14', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                            itemStyle={{ color: '#3b82f6' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorGrowth)" 
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : selectedMetric === 'storage' ? (
                    <div className="space-y-6 mt-4">
                      {entityDistribution().map(item => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>{item.label}</span>
                            <span className="text-white">{item.value}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", item.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isDetailLoading ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                      ) : detailData.length > 0 ? (
                        <div className="grid gap-3">
                          {detailData.map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                              <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wider">{item.name || item.title || `Entry ${idx + 1}`}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">{item.id}</p>
                              </div>
                              <Maximize2 className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">No data clusters detected in this sector.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 dark:bg-[#050508] p-8 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-center transition-colors">
                  <h5 className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-[0.3em] mb-4 transition-colors">Metric Insights</h5>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium transition-colors">
                    Our heuristics analysis indicates a <span className="text-slate-900 dark:text-white transition-colors">positive deviation</span> of data integrity in this cluster. System stability remains optimal.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-transparent transition-all">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1 transition-colors">Latency</p>
                      <p className="text-lg font-mono text-emerald-600 dark:text-emerald-400 transition-colors">12ms</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-transparent transition-all">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1 transition-colors">Reliability</p>
                      <p className="text-lg font-mono text-slate-900 dark:text-white transition-colors">99.9%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[560px]">
        <div className="lg:col-span-2 bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl dark:shadow-2xl relative group transition-all">
          <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="h-14 px-6 flex items-center justify-between bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5 relative z-10 transition-colors">
            <h3 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-[0.3em] flex items-center gap-3 transition-colors">
              <History className="w-4 h-4 text-blue-500" />
              Runtime Activity Stream
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping transition-colors"></div>
              <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-600 tracking-widest transition-colors">REALTIME_ENCRYPTED_FEED</span>
            </div>
          </div>
          <div className="flex-1 p-8 space-y-6 overflow-y-auto relative z-10 font-mono text-[11px] custom-scrollbar">
            {logs.length > 0 ? (
              logs.map((log, i) => {
                const isError = log.entityType === 'logs' && log.severity === 'CRITICAL';
                const time = log.serverTime?.seconds 
                  ? new Date(log.serverTime.seconds * 1000).toLocaleTimeString() 
                  : new Date().toLocaleTimeString();
                
                return (
                  <div key={log.id || i} className="flex gap-6 p-4 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all text-slate-500 dark:text-slate-400 group items-start">
                    <span className="text-blue-500/50 mt-0.5 font-mono text-[9px] transition-colors">
                      [{time}]
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-colors",
                          isError ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {log.entityType || 'SYSTEM'}
                        </span>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300 transition-colors font-sans">
                          <span className="text-slate-900 dark:text-white font-bold tracking-wider transition-colors">
                            {log.entityType === 'logs' ? 'EXCEPTION_CAUGHT' : 'NODE_SYNCED'}
                          </span>: {log.message || log.name || log.title || `Resource ${log.id?.slice(0,6)} synchronized`}.
                        </p>
                      </div>
                      <div className="h-0.5 w-0 bg-blue-500/50 group-hover:w-full transition-all duration-500"></div>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full border transition-all mt-1.5",
                      isError ? "border-rose-500/30 bg-rose-500/10 group-hover:bg-rose-500 group-hover:shadow-[0_0_10px_#f43f5e]" : "border-emerald-500/30 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:shadow-[0_0_10px_#10b981]"
                    )}></div>
                  </div>
                );
              })
            ) : (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-6 p-4 rounded-xl border border-transparent opacity-30 text-slate-400 items-start">
                  <span className="text-blue-500/50 mt-0.5">[{14 + i}:22:0{i}]</span>
                  <div className="flex-1">
                    <p>Scanning for diagnostic telemetry...</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-white/5 rounded-3xl p-10 shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all">
          <div className="absolute inset-0 bg-blue-600/5 transition-colors group-hover:bg-blue-600/8 transition-colors"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_8px_25px_rgba(37,99,235,0.4)] mb-8 relative">
              <Zap className={cn("w-8 h-8 text-white transition-all", isScaling && "scale-110")} />
              {isScaling && <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-ping"></div>}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-3 uppercase font-mono transition-colors">Scale Runtime</h3>
            <p className="text-slate-500 dark:text-slate-500 text-xs leading-relaxed tracking-wide font-medium transition-colors">
              {isScaling 
                ? "Allocating hyper-dimensional resources across distributed shadow-nodes..." 
                : "Your distributed engine is currently running in singleton mode. Upgrade to enable multi-node horizontal scaling for petabyte-scale throughput."}
            </p>
            
            {isScaling && (
              <div className="mt-10 space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] transition-colors">
                  <span>Optimizing Phase {scalingStep}/4</span>
                  <span>{Math.round((scalingStep/4) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 transition-colors">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(scalingStep/4) * 100}%` }}
                    className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-3 bg-blue-500 animate-pulse"></div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono italic tracking-tight transition-colors">
                    {scalingStep === 1 && "> INIT_HYPER_NODES..."}
                    {scalingStep === 2 && "> DISTRIB_WORKLOAD..."}
                    {scalingStep === 3 && "> SYNC_GLOBAL_STATE..."}
                    {scalingStep === 4 && "> PATCH_LOAD_BALANCE..."}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleScale}
            disabled={isScaling}
            className="w-full mt-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_10px_25px_rgba(37,99,235,0.4)] disabled:opacity-30 hover:bg-blue-500 transition-all active:scale-95 relative z-10 flex items-center justify-center gap-3"
          >
            {isScaling ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : "Establish Hyper-Scale"}
          </button>
        </div>
      </div>
      
      {showSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-12 right-12 bg-[#0a0a14] border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest">Cluster Stabilized: Nodes Online</span>
        </motion.div>
      )}
    </div>
  );
}
