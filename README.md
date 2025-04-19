# 🔐 AI VulnScanner

AI VulnScanner is a real-time website vulnerability scanner that detects security flaws and uses **Gemini AI** to suggest effective fixes. Built for developers, ethical hackers, and students, this tool simplifies web vulnerability detection and remediation.

---

## 🌟 Features

- 🔍 Scan websites for XSS, insecure headers, SSL misconfigs, and more
- 🤖 Gemini AI-generated remediation suggestions
- 🧪 “Test My Fix” feature to validate fixes using AI
- 🛠️ Fix Playground – try your own headers/config and test live
- 🧠 Ask Gemini custom follow-up questions per vulnerability
- ✅ Gemini Confidence and pass/fail indicators
- 🕓 Scan history with timestamps
- 📋 Copy recommendations
- 📱 Mobile-responsive UI

---

## 📦 Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Express, Node.js
- **AI**: Google Gemini 2.0 API
- **Scanner**: [web-vuln-scanner](https://www.npmjs.com/package/web-vuln-scanner)
- **Hosting**: Vercel

---

## 🚀 Live Demo

🔗 [https://your-vercel-link.vercel.app](https://scannervuln.vercel.app/)

---

## 🛠️ Getting Started

### Clone and Install

```bash
git clone https://github.com/your-username/ai-vulnscanner.git
cd ai-vulnscanner

# Install frontend dependencies
npm install

# If backend is in /server
cd server
npm install
