# AI-First CRM HCP Module (Log Interaction Screen)

A state-of-the-art Healthcare Professional (HCP) CRM Log Interaction workspace featuring a modern split-screen layout. The **Left Panel** displays an interactive, read-only Interaction Details form, while the **Right Panel** features an AI Assistant Chat interface. 

The application uses an AI agent built with **LangGraph** and **LangChain** that acts as the absolute controller for the form state. The user has no manual typing access to the left form inputs; they interact with the AI assistant to log meetings, make edits, query history, schedule follow-ups, and persist logs to the SQL database.

---

## Architecture Flow

The following diagram illustrates how the frontend Redux store, FastAPI endpoints, and the LangGraph StateGraph interact to maintain state:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend (UI)                           │
│                                                                        │
│   ┌───────────────────────────┐           ┌────────────────────────┐   │
│   │ Left Panel: Read-only Form│           │ Right Panel: Chat UI   │   │
│   └─────────────▲─────────────┘           └───────────┬────────────┘   │
└─────────────────│─────────────────────────────────────│────────────────┘
                  │                                     │
                  │ (Updates formState                  │ (User Message +
                  │  Redux Store)                       │  Chat History)
                  │                                     ▼
┌─────────────────│──────────────────────────────────────────────────────┐
│                 │               FastAPI Backend                        │
│                 │                                                      │
│    ┌────────────┴────────────┐            ┌────────────────────────┐   │
│    │  /api/chat Response     │◄───────────┤  /api/chat POST        │   │
│    │  (ai_msg, form_state)   │            │  Endpoint              │   │
│    └─────────────────────────┘            └───────────┬────────────┘   │
└───────────────────────────────────────────────────────│────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              LangGraph                                 │
│                                                                        │
│                    ┌────────────────────────────┐                      │
│                    │   AgentState               │                      │
│                    │   - messages (history)     │                      │
│                    │   - form_state (JSON)      │                      │
│                    └─────────────┬──────────────┘                      │
│                                  │                                     │
│                                  ▼                                     │
│                       ┌──────────────────────┐                         │
│                       │   Agent Node (LLM)   │                         │
│                       └──────────┬───────────┘                         │
│                                  │                                     │
│                        (Routing Decision)                              │
│                        /                \                              │
│           (Has Tool Calls)            (Final Text Response)            │
│                  /                        \                            │
│                 ▼                          ▼                           │
│       ┌──────────────────┐                [END]                        │
│       │    Tools Node    │                                             │
│       │  (Executes custom│                                             │
│       │   @tool logic)   │                                             │
│       └─────────┬────────┘                                             │
│                 │                                                      │
│                 ▼                                                      │
│     (Applies updates to form_state)                                    │
│                 │                                                      │
│                 ▼                                                      │
│         (Return to Agent Node)                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ The 5 LangGraph Tools

The agent is equipped with five custom Python functions decorated with `@tool`:

1. **`log_interaction`**: Accepts a natural language description of a meeting (e.g., *"I met Dr. Alice today, she was positive, we discussed cardiology and I shared brochure v2"*). It calls the LLM in the background to structure and extract `hcp_name`, `date` (formatted as YYYY-MM-DD), `sentiment` (Positive, Neutral, Negative), `topics` (list), and `materials` (list), and updates the form state.
2. **`edit_interaction`**: Accepts a dictionary of specific fields and values to update. It merges these new details (e.g., updating only the sentiment to Negative) into the existing `form_state` while preserving the remaining fields.
3. **`retrieve_hcp_history`**: Takes an HCP name, queries the local SQLite database for past matching interactions, and returns the list of historical records to the AI's context so it can summarize them for the sales rep.
4. **`schedule_follow_up`**: Extracts a date and topic for a future meeting and writes it into the `next_steps` field in the form state (e.g., *"Follow-up scheduled on 2026-07-20 to discuss client feedback."*).
5. **`save_interaction_to_db`**: Persists the current `form_state` to the SQLite database. It extracts the current fields, serializes arrays, and writes a new row to the database.

---

## 💻 Tech Stack

- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Lucide Icons, Google Inter Font.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, LangChain, LangGraph.
- **Database**: SQLite (local serverless execution).
- **LLM**: Groq / OpenRouter API (`llama-3.3-70b-versatile` or `llama-3.3-70b-instruct`).

---

## 🚀 Local Setup Instructions

Follow these steps to set up the backend and frontend locally:

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- A Groq API Key or OpenRouter API Key

---

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` folder and paste your API key:
   ```env
   GROQ_API_KEY=your_groq_or_openrouter_api_key
   ```
   *Note: If you provide an OpenRouter key starting with `sk-or-v1-`, the backend automatically redirects LLM queries to the OpenRouter gateway.*

5. Initialize the database (this will auto-create `crm_hcp.db` and seed it with mock history for **Dr. Alice Smith**, **Dr. Bob Jones**, and **Dr. Carol Evans**):
   ```bash
   python database.py
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend documentation will be accessible at: `http://localhost:8000/docs`.

---

### 3. Frontend Setup

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local server URL (usually `http://localhost:5173`).

---

## 🎯 Verification Scenarios to Try

Try entering the following requests in the AI Assistant Chat (right panel) to see the tools and form synchronization in action:

1. **Log a new interaction**:
   > *"I had a positive meeting with Dr. Alice Smith today. We discussed Cardiology and the Side Effect Profile, and I shared the Beta Blocker Trial PDF."*
   - **Expected Result**: The left panel form instantly updates with Dr. Alice Smith's details, date `2026-07-15`, Positive sentiment, topics capsule tags, and materials capsule tags.

2. **Refine/Edit the details**:
   > *"Actually, we also discussed vaccine distribution, and the sentiment was neutral."*
   - **Expected Result**: The form state updates the sentiment badge to Neutral and appends "vaccine distribution" or replaces topics.

3. **Schedule a follow-up**:
   > *"Schedule a follow-up for July 24 about clinical trial metrics."*
   - **Expected Result**: The "Next Steps" text area displays: *"Follow-up scheduled on 2026-07-24 to discuss 'clinical trial metrics'."*

4. **Persist data**:
   > *"Save this interaction"*
   - **Expected Result**: The interaction is saved to SQLite, and the record immediately appears at the top of the **Database Explorer** panel at the bottom.

5. **Query Past History**:
   > *"What is the past history for Dr. Bob Jones?"*
   - **Expected Result**: The assistant queries the database and outputs his negative sentiment immunotherapy cost interaction history in the chat logs.
