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

- **Gemini API Key**: For Google's models.
- **OpenAI API Key**: For GPT models.
- **Local LLM URL**: For connecting to a locally running model.

*Note: All keys are stored locally in your browser.*

## License

Distributed under the MIT License. See `LICENSE` for more information.
