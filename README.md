# AI Chain

<div align="center">
  <h3>Intelligent Model Switching Chatbot</h3>
  <p>Seamless conversations with automated failover and multi-provider support.</p>
  <a href="https://filokloi.github.io/ai-chain/"><strong>View Live Demo »</strong></a>
</div>

<br />

## Overview

**AI Chain** is a robust chat application designed to solve the problem of API rate limits and service interruptions. By intelligently cascading through a configured list of AI models, it ensures your conversation continues smoothly even if a specific provider goes down or caps your usage.

Built with performance and flexibility in mind, AI Chain supports major cloud providers and local LLMs, giving you control over "Intelligence vs. Cost" strategies.

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
