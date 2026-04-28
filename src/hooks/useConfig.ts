import { useState, useEffect } from "react";
import { AppConfig } from "../types/config";
import { APP_CONFIG } from "../lib/config";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(APP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        // Try to fetch runtime config if available, but don't fail if it's missing
        const response = await fetch("/api/config");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (err) {
        console.warn("Runtime config fetch ignored, using bundled config.");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  return { config, loading, error };
}
