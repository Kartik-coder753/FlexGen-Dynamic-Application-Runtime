import React, { useState } from "react";
import Papa from "papaparse";
import { EntityConfig } from "../types/config";
import { FileUp, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { handleFirestoreError, OperationType, sanitizeData } from "../lib/utils";

interface CSVImportProps {
  entities: Record<string, EntityConfig>;
}

export function CSVImport({ entities }: CSVImportProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
      Papa.parse(f, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          if (results.meta.fields) setHeaders(results.meta.fields);
        },
      });
    }
  };

  const handleMapChange = (entityField: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [entityField]: csvHeader }));
  };

  const startImport = async () => {
    if (!selectedEntity || !user) return;
    setIsImporting(true);
    setError(null);
    let count = 0;

    try {
      for (const row of csvData) {
        const mappedData: any = {};
        Object.entries(mapping).forEach(([entityField, csvHeader]) => {
          if (csvHeader) mappedData[entityField] = row[csvHeader];
        });

        if (Object.keys(mappedData).length > 0) {
          try {
            await addDoc(collection(db, "content"), {
              entityType: selectedEntity,
              data: sanitizeData(mappedData),
              ownerId: user.id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            count++;
            setSuccessCount(count);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `content/${selectedEntity}`);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "A protocol error occurred during transport.");
      console.error("Import session terminated:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const entityConfig = entities[selectedEntity];

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 animate-in fade-in duration-700">
      <header className="text-center space-y-3">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter uppercase transition-colors">Data Importer</h2>
        <p className="text-slate-500 text-sm tracking-wide">Establish a data-link between legacy CSV assets and the FlexGen ecosystem.</p>
      </header>

      <section className="bg-white dark:bg-[#0a0a14] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden relative transition-colors duration-300">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
        <div className="p-10 space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest">1. Target Entity Cluster</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500/50 text-slate-900 dark:text-slate-300 appearance-none transition-colors"
            >
              <option value="" className="bg-white dark:bg-[#0a0a14]">-- Select Target --</option>
              {Object.keys(entities).map((id) => (
                <option key={id} value={id} className="bg-white dark:bg-[#0a0a14]">{entities[id].label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest">2. Payload Upload (.csv)</label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] p-16 text-center hover:border-blue-500/30 transition-all cursor-pointer group bg-slate-50 dark:bg-white/[0.01]">
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <FileUp className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors" />
              <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">
                {file ? <span className="text-blue-600 dark:text-blue-400 font-bold">{file.name}</span> : "Drop CSV payload here or click to browse"}
              </p>
            </div>
          </div>

          {headers.length > 0 && selectedEntity && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
              <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest">3. Protocol Mapping</label>
              <div className="grid gap-4 bg-slate-50 dark:bg-white/[0.02] p-8 rounded-2xl border border-slate-100 dark:border-white/5">
                {entityConfig.fields.map((field) => (
                  <div key={field.name} className="flex items-center gap-6">
                    <div className="w-40 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{field.label}</div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                    <select
                      value={mapping[field.name] || ""}
                      onChange={(e) => handleMapChange(field.name, e.target.value)}
                      className="flex-1 p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none transition-colors"
                    >
                      <option value="" className="bg-white dark:bg-[#0a0a14]">-- Ignore Field --</option>
                      {headers.map((h) => (
                        <option key={h} value={h} className="bg-white dark:bg-[#0a0a14]">{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-white/5 px-10 py-8 flex items-center justify-between relative z-10 border-t border-slate-200 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse"></div>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
               {isImporting ? "Transferring Packets..." : file ? `${csvData.length} entries detected` : "Ready for link"}
             </p>
          </div>
          <button
            onClick={startImport}
            disabled={!file || !selectedEntity || isImporting}
            className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-30 hover:bg-blue-500 transition-all active:scale-95 shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
          >
            {isImporting ? "Processing..." : "Establish Data Link"}
          </button>
        </div>
      </section>

      {successCount > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4 text-emerald-400 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Successfully synchronized {successCount} entities with core database.</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-start gap-4 text-rose-400 animate-in slide-in-from-bottom-4">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest">Transmission Failure</p>
            <p className="text-xs leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
