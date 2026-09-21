# Pramax AI-Powered Customer Engagement Web Application

This project is a modern, responsive web application built with **React (Next.js)**, **Tailwind CSS**, and **TypeScript**. 
It includes a complete frontend interface showcasing Pramax’s services, solutions, industry-specific frameworks, case studies, and a dynamic Admin Dashboard. 

Additionally, it features an interactive **AI Chatbot card placed front-and-center** in the hero section (modeled after the Infosys search design) which is fully state-controlled and ready for backend API hooks.

---

## 🚀 How to Set Up and Run in VS Code

### Step 1: Install Node.js (Prerequisite)
The project requires **Node.js** (version 18.0.0 or higher) to install packages and run the local development server.
1. Download Node.js from the official website: [https://nodejs.org/](https://nodejs.org/)
2. Choose the **LTS (Long Term Support)** version for your OS (Windows, macOS, or Linux) and install it.
3. Verify the installation by opening your terminal (or Command Prompt) and running:
   ```bash
   node -v
   npm -v
   ```

### Step 2: Open the Project in VS Code
1. Open **Visual Studio Code**.
2. Go to **File** > **Open Folder...** (or **Open...** on macOS).
3. Select the `pramax-web-app` folder and click Open.

### Step 3: Run the Development Server
1. In VS Code, open a new integrated terminal by pressing `Ctrl + \`` (or going to **Terminal** > **New Terminal** in the top menu).
2. Install the project dependencies by running:
   ```bash
   npm install
   ```
3. Once installation is complete, start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000` to view the website.

---

## 🛠️ Project Structure

```
pramax-web-app/
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript settings
├── tailwind.config.js        # Tailwind CSS custom themes and configuration
├── postcss.config.js         # CSS compiler integration settings
└── src/
    └── app/
        ├── layout.tsx        # HTML Page Wrapper (Global font, SEO Title / Meta config)
        ├── globals.css       # Core stylesheets & Tailwind directives
        ├── page.tsx          # Main React Application (Multi-page tab system with AI integration)
        └── api/              # BACKEND API ROUTING (For Node.js / FastAPI developer)
            ├── chat/
            │   └── route.ts  # Handles AI chat prompts, Vector database searches, and LLM output
            ├── lead/
            │   └── route.ts  # Handles lead database logging
            └── admin/
                └── route.ts  # Handles RAG Vector updates
```

---

## 🤝 Handoff & Backend Integration Guide

The frontend is fully set up to communicate with local Next.js API routes under the `src/app/api` directory.
When you run the development server, if the backend APIs are not customized, the frontend has **automatic mock fallbacks** (using client-side state) so that you can demo the website, submit forms, and inject knowledge nodes locally right away.

### API Integration Points for the Backend Developer:

1. **AI Chat Assistant Hook (`src/app/api/chat/route.ts`)**:
   - The frontend sends a `POST` request to `/api/chat` with:
     ```json
     { "message": "user question text", "knowledgeBase": [...] }
     ```
   - **Backend Task**: Fetch relevant knowledge/documents matching the trigger parameters from your vector store (PostgreSQL `pgvector`, MongoDB Atlas Vector Search, Pinecone, etc.), formulate the system context, call the LLM API (OpenAI, Azure OpenAI, Anthropic, etc.), and return the result:
     ```json
     { "response": "LLM generated response text" }
     ```

2. **Lead Generation Database Hook (`src/app/api/lead/route.ts`)**:
   - The frontend sends a `POST` request to `/api/lead` with:
     ```json
     { "name": "name", "email": "email", "requirements": "objectives" }
     ```
   - **Backend Task**: Connect your database model client (e.g., Prisma, Mongoose, Knex) and save the lead requirements.

3. **Knowledge Base Node Hook (`src/app/api/admin/route.ts`)**:
   - The frontend sends a `POST` request to `/api/admin` with:
     ```json
     { "trigger": "keyword", "response": "answer text" }
     ```
   - **Backend Task**: Insert the new knowledge base entry, convert the text response into a vector embedding, and save it in your Vector DB so it can be scanned for semantic similarity during user questions.
