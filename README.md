# AI Command Line Interface

An intelligent command-line interface that combines the power of AI chatbot capabilities with website UI cloning functionality. Built with Node.js and powered by Google's Gemini AI.

## 🎥 Demo

[Watch the Demo](https://youtu.be/ujkAfBUTYBc)

## 🌟 Features

- **AI Chat Interface**: Interactive conversations with an AI assistant with previous context
- **Website UI Cloning**: Clone any website's UI by providing its URL
- **Asset Management**: Automatically handles asset downloading and path rewriting
- **Smart Path Resolution**: Maintains proper file structure and asset references

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/raaaghavv/AI-CLI.git
cd AI-CLI
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- NPM (v8 or higher)
- A Google Cloud Gemini API key

## 🎯 Usage

1. Start the CLI:

```bash
node cli.js
```

2. Follow the interactive prompts:
   - Ask general questions
   - Clone a website by providing its URL
   - Review results and continue chatting

### Example Commands

```bash
# To clone a website:
> How Can I Help You?
Clone the website https://example.com
```

```bash
# To ask general questions:
> How Can I Help You?
What are the best practices for responsive web design?
```

## 🛠️ Technical Stack

- **AI/LLM**: Google Gemini API
- **Web Scraping**: Puppeteer
- **HTTP Client**: Axios
- **CLI Interface**: Inquirer
- **File System**: Node.js fs/promises
- **Environment**: dotenv

## 📁 Project Structure

```
AI-CLI/
├── src/
│   ├── aiHandler.js    # AI interaction logic
│   └── tools.js        # Utility functions and tools
├── cli.js              # Command-line interface
├── package.json        # Project dependencies
└── .env               # Environment variables (create this)
```

## ⚙️ Configuration

The project uses environment variables for configuration:

- `GEMINI_API_KEY`: Your Google Gemini API key

## ⚠️ Disclaimer

This tool is for educational purposes only. Be sure to comply with the terms of service and robots.txt of any website you interact with.

---

Made with ❤️ by [raaaghavv](https://github.com/raaaghavv/)
