import React, { useState } from "react";
import { EntityConfig } from "../types/config";

interface DynamicFormProps {
  config: EntityConfig;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function DynamicForm({ config, onSubmit, initialData }: DynamicFormProps) {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-white/[0.03] p-8 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md relative overflow-hidden group transition-all duration-300">
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8 transition-colors">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">Deploy Entity</h3>
          <span className="bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[9px] px-2 py-0.5 rounded border border-blue-600/20 dark:border-blue-500/30 font-mono">RECORD_UPSERT</span>
        </div>
        
        <div className="space-y-6">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest transition-colors">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>
              
              {field.type === "select" ? (
                <select
                  name={field.name}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                >
                  <option value="" className="bg-white dark:bg-[#12121f]">Select --</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-[#12121f]">{opt}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-8">
          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-[0.98]"
          >
            Commit Changes
          </button>
        </div>
      </div>
    </form>
  );
}
