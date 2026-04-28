import React from "react";
import { EntityConfig } from "../types/config";
import { cn } from "../lib/utils";

interface DynamicTableProps {
  config: EntityConfig;
  data: any[];
  isLoading?: boolean;
}

export function DynamicTable({ config, data, isLoading }: DynamicTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-slate-500">Loading data...</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a14] shadow-xl dark:shadow-2xl relative transition-all duration-300">
      <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 transition-colors">
              {config.fields.map((field) => (
                <th key={field.name} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
            {data.length === 0 ? (
              <tr>
                <td colSpan={config.fields.length} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 italic text-sm transition-colors">
                  Initial schema empty. No records detected.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  {config.fields.map((field) => (
                    <td key={field.name} className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap transition-colors">
                      {field.type === "number" ? (
                        <span className="font-mono text-blue-600 dark:text-blue-400 transition-colors uppercase">{row[field.name]?.toString() || "0"}</span>
                      ) : (
                        row[field.name]?.toString() || "-"
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
