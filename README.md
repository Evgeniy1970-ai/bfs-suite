# BFS Suite — Big For Small

> Multi-agent AI customer support platform for small businesses. Three specialized agents (Legal, HR, Support) powered by RAG, intelligent routing, and real-time escalation — all under one roof.

![Architecture](./architecture.svg)

---

## 🌐 Live Demo

| Interface | URL |
|-----------|-----|
| Internal Dashboard | [charming-sable-0dd4f8.netlify.app](https://charming-sable-0dd4f8.netlify.app) |
| Embeddable Widget | `widget.js` — drop into any website |

---

## 📌 Overview

BFS Suite is a production-ready AI support system built for small businesses. It classifies incoming queries by topic, routes them to the correct specialized agent, retrieves relevant information from a vector knowledge base, and responds in the user's language — all in seconds.

**Demo client:** Basecamp

**Two deployment modes:**
- **Public web widget** — embedded on the client's website, limited to public documents
- **Internal dashboard** — full access for managers and staff, including all documents and analytics

---

## ✨ Features

- 🤖 **3 specialized AI agents** — Legal, HR, Support
- 🧠 **RAG-based retrieval** — pgvector similarity search over structured knowledge base
- 🔀 **Intelligent routing** — GPT-4o-mini classifies every query and routes to the correct agent
- 🚨 **Escalation system** — 3 triggers: low similarity score, explicit user request, or ambiguous routing (Legal/HR overlap) — notifies via Telegram
- 🧑‍💼 **Human-in-the-loop** — when AI Router confidence drops below 0.7, query is forwarded to a human instead of guessing
- 📊 **Analytics dashboard** — live charts, conversation history, agent logs
- 🔍 **Knowledge gap detection** — unanswered questions saved and surfaced in the dashboard
- 📎 **Citation support** — agent responses include source document references
- 📁 **Document upload** — drag & drop PDF/DOCX directly from the dashboard
- 🌍 **Multilingual** — responds in the language the user writes in
- 🔐 **Dual access model** — public API key (widget) vs private API key (dashboard)

---

## 🏗️ Architecture

```
Interfaces
├── Web Widget          (public, on client site)
├── Embeddable Widget   (widget.js, any site)
└── Internal Dashboard  (Netlify, manager/staff)
        │
        ▼
   AI Router (GPT-4o-mini · topic classifier)
        │
   ┌────┼────┬─────────┐
   ▼    ▼    ▼         ▼
Legal  HR  Support  Escalation
Agent Agent Agent    Agent
   │    │    │         │
   └────┴────┘         │
        │              ▼
  Supabase          Telegram
  pgvector       (alert + log)
  Knowledge
   Base
        │
   n8n Workflows
   WF1 · WF2 · WF3 · WF4 · WF5
        │
  Supabase Tables
  conversations · agent_logs · api_keys
  clients · analytics · knowledge_gaps
  documents · escalations
```

See [`architecture.svg`](./architecture.svg) for the full visual diagram.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Workflow automation | n8n v2.6.3 |
| Vector database | Supabase (PostgreSQL + pgvector) |
| AI routing & agents | OpenAI GPT-4o-mini |
| Embeddings (ingestion) | OpenAI text-embedding-3-small |
| Embeddings (query) | OpenAI text-embedding-ada-002 |
| Frontend dashboard | Netlify (HTML + JS + Chart.js) |
| Escalation notifications | Telegram Bot API |
| Local tunnel | ngrok |

---

## 📁 Repository Structure

```
bfs-suite/
├── README.md
├── architecture.svg
├── n8n-workflows/
│   ├── BFS_01_Ingestion.json
│   ├── BFS_02_Query.json
│   ├── BFS_03_Logging.json
│   ├── BFS_04_Upload.json
│   └── BFS_05_Escalation.json
├── dashboard/
│   ├── index.html
│   └── widget.js
├── docs/
│   └── setup.md
└── .env.example
```

---

## ⚙️ n8n Workflows

| Workflow | Description |
|----------|-------------|
| **WF1 — Ingestion** | Manual trigger → fetches documents without embeddings → generates embeddings via OpenAI → saves back to Supabase |
| **WF2 — Query** | Webhook → escalation check → AI router (returns agent_type + confidence) → Parse Router Response → Legal / HR / Support / Ambiguous → RAG search → response → logging |
| **WF3 — Logging** | Triggered by WF2 → saves conversation to `conversations` table → logs metadata to `agent_logs` |
| **WF4 — Upload** | Webhook from dashboard → prepares document → generates embedding → stores in Supabase |
| **WF5 — Escalation** | Triggered by WF2 on: (1) low similarity score, (2) explicit user request, (3) ambiguous routing (confidence < 0.7) → sends Telegram alert → inserts record to `escalations` |

---

## 🗄️ Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `documents` | Knowledge base with `embedding vector(1536)`, `agent_type`, `is_public` |
| `conversations` | Dialog history per session and channel |
| `agent_logs` | Technical logs — status, tokens used, response time |
| `api_keys` | Public (widget) and private (dashboard) keys per client |
| `clients` | Company data — name, domain, plan |
| `analytics` | Aggregated stats per agent and channel |
| `knowledge_gaps` | Questions with no satisfactory answer (similarity below threshold) |
| `escalations` | Escalation records with reason, score, session info |

**Constraints:**
- `agent_type`: `legal` | `hr` | `support`
- `channel`: `web_widget` | `dashboard`
- `status` (agent_logs): `success` | `error` | `warning`
- `plan` (clients): `starter` | `standard` | `advanced`

---

## 🚀 Getting Started

### Prerequisites

- n8n instance (local or cloud)
- Supabase project with pgvector enabled
- OpenAI API key
- Telegram Bot (for escalation notifications)
- ngrok (for local webhook exposure)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bfs-suite.git
cd bfs-suite
```

### 2. Configure environment

Copy `.env.example` and fill in your credentials:

```bash
cp .env.example .env
```

```env
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
NGROK_URL=YOUR_NGROK_URL
```

### 3. Set up Supabase

Enable the `pgvector` extension and create the required tables and the `match_documents` function. See [`docs/setup.md`](./docs/setup.md) for the full SQL schema.

### 4. Import n8n workflows

1. Open your n8n instance
2. Go to **Workflows → Import**
3. Import each JSON file from `n8n-workflows/` in order: WF1 → WF5
4. Configure credentials (Supabase, OpenAI, Telegram) in each workflow
5. Activate WF2, WF3, WF4, WF5

### 5. Ingest documents

Add your documents to the `documents` table in Supabase (title, content, agent_type, is_public), then run **WF1** manually to generate embeddings.

### 6. Deploy the dashboard

Deploy the `dashboard/` folder to Netlify (or any static host). Update the API endpoint URLs to point to your ngrok/n8n webhook.

---

## 🔐 Access Model

| Mode | API Key | Documents visible |
|------|---------|-------------------|
| Web widget | Public key | `is_public = true` only |
| Dashboard | Private key | All documents |

---

## 📊 Dashboard Features

- **Chat** — real-time conversation with agents
- **Documents** — view and upload knowledge base documents
- **Knowledge Gaps** — questions the system couldn't answer
- **Analytics** — live charts by agent, channel, and time period
- **Conversation History** — full log of all sessions
- **Agent Logs** — technical performance data
- **Settings** — API key and configuration management

---

## 🚨 Escalation Logic

An escalation is triggered when:
1. **Low similarity score** — RAG search returns no relevant document above the threshold
2. **Explicit user request** — user asks to speak with a human agent
3. **Ambiguous routing** — AI Router confidence score drops below 0.7 (e.g. Legal/HR overlap); instead of guessing, the system forwards to a human with reason: `ambiguous_query`

On escalation:
- Telegram notification is sent with session details, agent type, user question, similarity score, and escalation reason
- Record is inserted into the `escalations` table
- User receives a friendly message that a human specialist will follow up

---

## 📄 License

MIT License — feel free to use, modify, and build upon this project.

---

## 👤 Author

Built by **Yevhenii** as a portfolio project demonstrating production-grade AI automation for small businesses.

- 🌐 Website: [neolithai.netlify.app](https://neolithai.netlify.app)
- 💼 LinkedIn: *(your LinkedIn URL)*
- 🛠️ Upwork: *(your Upwork URL)*
