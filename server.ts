import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Example of a hardcoded "Master Config" which could also be fetched from Firestore
  // In a real FlexGen, this might be loaded from a file or a dedicated "system" collection
  app.get("/api/config", (req, res) => {
    res.json({
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
    });
  });

  // Dynamic CRUD (Mocked logic for "Dynamic APIs" requirement)
  // Real implementation would use firebase-admin to interact with Firestore
  app.post("/api/data/:entity", (req, res) => {
    const { entity } = req.params;
    const body = req.body;
    console.log(`[BACKEND] Creating dynamic entry for ${entity}:`, body);
    res.json({ success: true, message: `Created new ${entity}`, data: body });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
