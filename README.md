# AI-Powered Task Assistant

A full-stack modern task management application featuring **Google Gemini AI** integration to intelligently generate actionable task descriptions and recommend priority levels based on task titles, with robust graceful degradation and rate-limiting.

---

## 🌟 Key Features

- **Full Task Lifecycle (CRUD):**
  - **Create:** Add new tasks with title, description, and priority (`low`, `medium`, `high`).
  - **Read:** Filter tasks by status (`All`, `Pending`, `Done`).
  - **Update:** Inline editing to update task title, description, or priority in-place.
  - **Toggle Status:** Mark tasks completed or pending with visual strikethrough.
  - **Delete:** Remove tasks with confirmation.
- **✨ AI-Powered Task Assistance:**
  - Enter a task title and click **"✨ Auto-Generate with Gemini AI"** to automatically receive a concise, professional technical description and recommended priority.
  - AI-assisted tasks are marked with a distinct `✨ AI Assisted` badge.
- **🛡️ Responsible AI & System Design:**
  - **Server-Side Key Protection:** The Gemini API key is stored strictly on the server in `.env` and never leaked to the client browser.
  - **Rate Limiting:** Protects API quota with a policy of maximum 1 AI generation request per task per minute, with live countdown feedback on the UI.
  - **Domain-Aware Graceful Degradation:** If the external AI service is unreachable, disabled, or rate-limited, the application does not crash. It automatically falls back to an intelligent, domain-aware technical template engine covering Authentication, Databases, Bug Fixing, REST APIs, Frontend UI, Testing, DevOps, Performance, and Documentation.
  - **Human-in-the-Loop:** AI-generated descriptions and priorities populate the form fields first, allowing the user to review, edit, or customize before saving.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Modern Vanilla CSS (Dark theme, glassmorphism, responsive layout)
- **Networking:** Native Fetch API

### Backend
- **Runtime:** Node.js
- **Server Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **AI SDK:** `@google/generative-ai` (Google Gemini) and `openai` (optional secondary provider)
- **Environment Management:** `dotenv`
- **Security:** `cors` middleware, server-side rate-limiting map

---

## 📁 Project Structure

```
Practical-13/
├── README.md
├── .gitignore
├── backend/
│   ├── .env                    # Environment variables (Mongo URI, API keys)
│   ├── .gitignore
│   ├── geminiService.js        # Gemini API integration & domain-aware fallback generator
│   ├── package.json
│   ├── server.js               # Express server & REST endpoints
│   └── models/
│       └── Task.js             # Mongoose schema for tasks
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Main React application component
        ├── api.js              # Centralized API service functions
        ├── index.css           # Global design system & component styles
        └── main.jsx            # React root entry point
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or a MongoDB Atlas connection string)
- *(Optional)* Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create or verify your `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   > **Note:** If `GEMINI_API_KEY` is not provided or invalid, the backend automatically engages the intelligent offline fallback engine, ensuring all core features function seamlessly.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend runs at `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend runs at `http://localhost:5173`.*

---

## 📡 API Endpoints Reference

### Task Management Routes

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks sorted by creation date | None |
| `POST` | `/tasks` | Create a new task | `{ title, description, priority, isAiGenerated }` |
| `PUT` | `/tasks/:id` | Update an existing task or toggle completion | `{ completed, title, description, priority }` |
| `DELETE` | `/tasks/:id` | Delete a task by ID | None |

### AI Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ai/status` | Check the active AI provider and key configuration status (keys are never exposed) |
| `POST` | `/api/ai/generate-description` | Generate description & recommended priority for a given task title (Rate-limited: 1 req/min per task) |

---

## 🧪 Testing the AI Integration

Try typing any of the following task titles and clicking **"✨ Auto-Generate with Gemini AI"**:

1. **`Implement JWT user authentication and password hashing`**
   * *Generated Description:* Configures secure authentication by generating cryptographically signed JWT tokens with expiry, securely hashing user passwords using bcrypt/argon2, and protecting private API routes via authentication middleware.
   * *Recommended Priority:* **High**

2. **`Fix MongoDB connection timeout and optimize queries`**
   * *Generated Description:* Diagnoses and optimizes database operations: tunes connection pool parameters, indexes frequently queried fields, and optimizes query pipelines to prevent latency and connection timeouts.
   * *Recommended Priority:* **High**

3. **`Design responsive navigation bar and mobile drawer`**
   * *Generated Description:* Constructs responsive interface components with clean CSS styling, fluid transitions, and verified accessibility across desktop and mobile viewports.
   * *Recommended Priority:* **Medium**

---

## 📄 License
This project is open-source and intended for educational and developmental purposes.
