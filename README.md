# AI Chain

<div align="center">
  <h3>Chat, Compare & Run AI Models</h3>
  <p>Multi-provider chat with automatic failover + a live catalog of 300+ models with free options and self-hosting guidance.</p>
  <a href="https://filokloi.github.io/ai-chain/"><strong>Open the Site »</strong></a>
</div>

<br />

## Overview

**AI Chain** is the interface plane of a two-part system:

- **This site** (interface plane) — a chat application with intelligent model cascading, plus content pages: a sortable comparison of every model in the catalog, a guide to genuinely free AI options, a self-hosting guide for open-weight models, and solutions & ideas.
- **[AIchain](https://github.com/filokloi/AIchain)** (data plane) — a GitHub Actions pipeline that re-scores ~336 models every 12 hours from multiple sources and publishes the ranked catalog this site renders. Its local sidecar, `aichaind`, applies the same catalog to live routing decisions.

The chat solves API rate limits and service interruptions by cascading through a configured list of AI models, so your conversation continues even when a provider goes down or caps your usage.

## Site sections

| Route | What it does |
|---|---|
| `#/chat` | Multi-provider chat with automatic failover (the original AI Chain app). |
| `#/models` | Sortable, filterable comparison of all catalog models: intelligence, speed, cost ($/M tokens), context, per-task scores, tiers. |
| `#/free` | Every zero-cost path: free frontier models, OpenRouter `:free` variants, subscription bridges — with practical access tips. |
| `#/selfhost` | Open-weight models grouped by hardware class (consumer / workstation / server) with runtimes and quantization info. |
| `#/ideas` | The two-plane architecture explained, budget stack recipes, and roadmap. |

Catalog data is fetched from the AIchain GitHub Pages deployment (same origin, no CORS) and cached locally for 12 hours to match the upstream refresh cadence.

## Key Features

- **🚀 Intelligent Model Cascading**: Automatically detects failures or rate limits and seamlessly switches to the next available model in your strategy.
- **🧠 Multi-Strategy Support**:
  - **Economy**: Prioritizes free or low-cost models.
  - **Balanced**: A middle-ground approach for everyday tasks.
  - **Power**: Uses the most capable models available for complex reasoning.
- **🔌 Universal Compatibility**:
  - **Cloud**: Google Gemini, OpenAI, Anthropic.
  - **Local**: Connect to any local LLM server (e.g., LM Studio, Ollama) via standard endpoints.
- **💾 Local Persistence**: Your API keys and chat history are stored significantly in your browser's local storage—never sent to our servers.
- **📁 Multi-Modal Capabilities**: Analyze images and document attachments with supported models.

## Tech Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (Custom `useChatManager`)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- NPM or Yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/filokloi/ai-chain.git
   cd ai-chain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Configuration

Upon first launch, you will be prompted to enter your API keys. You can configure:

- **Google (Gemini) API Key** — called directly.
- **OpenAI API Key** — called directly.
- **Anthropic API Key** — called directly via the Messages API.
- **Groq API Key** — called directly (OpenAI-compatible endpoint).
- **Zhipu API Key** — called directly (JWT-signed).
- **OpenRouter API Key** — universal fallback that can reach every other provider (Cohere, Mistral, xAI, Alibaba, Moonshot, etc.).
- **Local LLM URL** — any OpenAI-compatible server (LM Studio, Ollama, etc.).

Only models the app can actually reach with your current keys are shown in the
model picker — providers without direct support require an OpenRouter key, and
unreachable models are filtered out rather than listed and failing at send time.

*Note: All keys are stored locally in your browser and are never sent to our servers.*

## Development

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:3000)
npm run typecheck # TypeScript type checking
npm test         # run the Vitest unit suite
npm run build    # production build to ./dist
```

CI (`.github/workflows/ci.yml`) runs type-checking, tests, and a production
build on every push and pull request. Deployment to GitHub Pages is gated on
the same checks passing.

## License

Distributed under the MIT License. See `LICENSE` for more information.
