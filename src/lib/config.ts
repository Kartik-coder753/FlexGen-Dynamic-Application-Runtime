import { AppConfig } from "../types/config";

export const APP_CONFIG: AppConfig = {
  name: "FlexGen Engine",
  version: "1.0.0",
  layout: {
    theme: "technical", // technical, luxury, brutalist, minimal
    navigation: [
      { id: "dashboard", label: { en: "Dashboard", es: "Tablero" }, icon: "LayoutDashboard", type: "dashboard" },
      { id: "users", label: { en: "User Directory", es: "Directorio de Usuarios" }, icon: "Users", type: "table", entity: "users" },
      { id: "projects", label: { en: "Projects", es: "Proyectos" }, icon: "Briefcase", type: "table", entity: "projects" },
      { id: "import", label: { en: "CSV Import", es: "Importar CSV" }, icon: "FileUp", type: "import" }
    ]
  },
  entities: {
    users: {
      label: "Users",
      fields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email Address", type: "email", required: true },
        { name: "role", label: "Role", type: "select", options: ["Admin", "Editor", "Viewer"] }
      ]
    },
    projects: {
      label: "Projects",
      fields: [
        { name: "title", label: "Project Title", type: "text", required: true },
        { name: "status", label: "Status", type: "select", options: ["Active", "Paused", "Completed"] },
        { name: "budget", label: "Budget", type: "number" },
        { name: "description", label: "Description", type: "textarea" }
      ]
    }
  },
  localization: {
    defaultLanguage: "en",
    supportedLanguages: ["en", "es"]
  }
};
