<div align="center">
<img width="1200" height="475" alt="FlexGen Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FlexGen: Dynamic Application Runtime

FlexGen is a **configuration-driven application engine** that dynamically generates UI, APIs, and database structures from JSON definitions. It supports localization, CSV import, custom authentication, and real-time data management—making it ideal for building admin panels, internal tools, and rapid prototypes.

View your app in AI Studio: [https://ai.studio/apps/91c635f2-1693-44be-a561-e65fb91d3ebb](https://ai.studio/apps/91c635f2-1693-44be-a561-e65fb91d3ebb)

---

## ✨ Features

- **Dynamic UI** – Navigation and forms are generated from a master configuration (`/api/config`).
- **Entity Management** – Define entities (e.g., `users`, `projects`) with field types, validation, and labels.
- **Localization** – Built‑in support for multiple languages (en/es by default, easily extensible).
- **CSV Import** – Bulk import data using Papaparse.
- **Gemini AI Integration** – Leverage Google’s Gemini API for AI‑powered features (requires API key).
- **Firebase Ready** – Pre‑configured for Firestore (via `firebase-admin` & client SDK) with a flexible `dynamicContent` schema.
- **Security First** – Follows the “Dirty Dozen” payload protection spec (see [`security_spec.md`](security_spec.md)).
- **Developer Friendly** – TypeScript, Vite, Tailwind CSS, and Express backend.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm or yarn
- A [Gemini API key](https://aistudio.google.com/) (for AI features)
- (Optional) Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd flexgen
Install dependencies

bash
npm install
Set up environment variables

Copy .env.example to .env.local:

bash
cp .env.example .env.local
Add your Gemini API key: GEMINI_API_KEY=your_key_here

(Optional) Set APP_URL if deploying.

Run the development server

bash
npm run dev
The app will be available at http://localhost:3000.

Build for Production
bash
npm run build
npm start
🧱 Architecture
FlexGen consists of two main parts:

Backend (server.ts)
Express server that serves the Vite frontend and provides REST APIs.

GET /api/config – Returns the master configuration (UI layout, entities, locale settings).

POST /api/data/:entity – Mock CRUD endpoint; replace with Firestore logic using firebase-admin.

In production, the server also serves the built static files.

Frontend (React + Tailwind)
Dynamically renders navigation and entity tables/forms based on the config.

Uses lucide-react for icons and recharts for analytics-ready components.

Gemini AI integration is available via the @google/genai SDK.

Firebase Integration
The project includes two Firebase configuration files:

firebase-applet-config.json – Client‑side Firebase config (Auth, Firestore, Storage).
Keep this file secret; it's meant for the frontend.

firebase-blueprint.json – Defines the Firestore schema:

appConfigs – Global runtime settings.

dynamicContent – Universal container for any entity type (entityType, data, ownerId, timestamps).

To use Firestore, replace the mock POST /api/data/:entity with actual calls to firebase-admin or the client SDK.

🛡️ Security
FlexGen follows a strict security specification (see security_spec.md for details). Key invariants:

Every content document must have a valid ownerId matching the authenticated user.

entityType must be a known value (cannot be injected).

No client‑side timestamps – server only.

Protection against nested payload bombs, oversized IDs, and unauthenticated queries.

All “Dirty Dozen” payloads are automatically rejected by the intended Firestore security rules (not yet deployed in this template but documented).

🔧 Configuration
The entire UI is driven by the object returned from /api/config. You can edit this endpoint in server.ts or move the configuration to Firestore (see firebase-blueprint.json → appConfigs collection).

Example configuration structure:

json
{
  "name": "FlexGen Engine",
  "layout": { "theme": "technical", "navigation": [...] },
  "entities": {
    "users": {
      "label": "Users",
      "fields": [
        { "name": "name", "type": "text", "required": true },
        { "name": "email", "type": "email" }
      ]
    }
  },
  "localization": { "defaultLanguage": "en", "supportedLanguages": ["en", "es"] }
}
📦 Available Scripts
Command	Description
npm run dev	Starts the development server (Express + Vite HMR)
npm run build	Builds the frontend into dist/
npm start	Runs the production server
npm run preview	Previews the built app locally
npm run lint	Type‑checks the project with tsc --noEmit
npm run clean	Removes the dist/ folder
🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.
For major changes, discuss them first via the AI Studio community or GitHub Issues.

