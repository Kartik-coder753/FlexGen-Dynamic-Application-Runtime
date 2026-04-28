export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: string[];
}

export interface EntityConfig {
  label: string;
  fields: FieldConfig[];
}

export interface NavItem {
  id: string;
  label: Record<string, string>;
  icon: string;
  type: "dashboard" | "table" | "import" | "settings";
  entity?: string;
}

export interface AppConfig {
  name: string;
  version: string;
  layout: {
    theme: "technical" | "luxury" | "brutalist" | "minimal";
    navigation: NavItem[];
  };
  entities: Record<string, EntityConfig>;
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}
