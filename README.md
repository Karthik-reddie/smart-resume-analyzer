# Smart Resume Analyzer

> ATS-style resume scoring platform that compares a candidate’s resume against a target job description and provides compatibility scoring, skill-gap analysis, and actionable recommendations.

# 🚀 Overview

**Smart Resume Analyzer** helps candidates understand how well their resume aligns with a target role using ATS-inspired scoring logic.

The platform:

- Parses uploaded resumes (`PDF`, `DOCX`, `TXT`)
- Extracts and analyzes resume content
- Compares resumes against job descriptions
- Calculates ATS compatibility scores
- Identifies missing skills
- Provides optimization recommendations
- Visualizes scoring insights in a modern React dashboard

---

# ✨ Features

## 📄 Resume Upload & Parsing

Supports multiple file formats:

- PDF
- DOCX
- TXT

The system automatically extracts resume text for scoring and analysis.

---

## 🧠 ATS Alignment Scoring

Generates:

- Overall ATS compatibility score
- Section-wise scoring breakdown
- Evidence used during evaluation
- Keyword alignment metrics

---

## 🎯 Skill Gap Recommendations

Highlights:

- Missing keywords
- Missing technical skills
- Resume optimization suggestions
- Skills that can improve ATS score

Interactive UI allows users to simulate score improvements in real time.

---

## ⚡ Modern Frontend Experience

Built with:

- React
- TypeScript
- Vite
- Tailwind CSS

Features include:

- Drag & drop uploads
- Real-time score visualization
- Responsive UI
- Interactive optimization controls

---

# 🏗️ Architecture

```text
smart-resume-analyzer/
│
├── engine/                  # Flask backend
│   ├── api/                 # REST API routes
│   ├── parsers/             # PDF/DOCX/TXT parsers
│   ├── services/            # Scoring & business logic
│   └── app.py               # Flask entrypoint
│
├── experience/              # React + Vite frontend
│   ├── src/components/
│   ├── src/pages/
│   └── src/App.tsx
│
├── neuron/                  # Pipeline + modeling experiments
├── planning-mds/            # Architecture/design docs
│
├── tests/
│   ├── backend/
│   ├── frontend/
│   └── integration/
│
└── CONTRIBUTING.md
```

---

# 🛠️ Tech Stack

## Backend

- Python 3.9+
- Flask REST API
- PyPDF / DOC parsers
- Service-oriented architecture

### Key Backend Modules

| Module | Purpose |
|---|---|
| `engine/app.py` | Flask application entrypoint |
| `engine/api/` | API route handlers |
| `engine/parsers/` | Resume parsing |
| `engine/services/` | Business logic & scoring |

---

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

---

# 📦 Installation

## Prerequisites

Make sure you have installed:

- Python `3.9+`
- Node.js `18+`
- npm

---

# ⚙️ Backend Setup (Flask)

## 1️⃣ Navigate to Project Root

```bash
cd /Users/wallstreet62/Desktop/smart-resume-analyzer
```

---

## 2️⃣ Create Virtual Environment

```bash
python3 -m venv venv
```

---

## 3️⃣ Activate Virtual Environment

### macOS/Linux

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## 4️⃣ Install Backend Dependencies

```bash
pip install -r engine/requirements.txt
```

---

## 5️⃣ Run Flask Server

```bash
PYTHONPATH=. python engine/app.py
```

Backend will start at:

```text
http://127.0.0.1:5005
```

---

# 🔌 Backend APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload-resume` | Upload & parse resume |
| POST | `/api/score-resume` | Generate ATS compatibility score |

---

# 💻 Frontend Setup (React + Vite)

## 1️⃣ Open New Terminal

Keep backend running and open another terminal.

---

## 2️⃣ Navigate to Frontend

```bash
cd /Users/wallstreet62/Desktop/smart-resume-analyzer/experience
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

## 4️⃣ Start Development Server

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173/
```

---

# 🧪 Testing

Run the full pytest suite:

```bash
cd /Users/wallstreet62/Desktop/smart-resume-analyzer
./venv/bin/pytest
```

Test directories:

```text
tests/backend/
tests/frontend/
tests/integration/
```

---

# 🎮 How to Use

## Step 1 — Upload Resume

Upload a resume using drag-and-drop or file picker.

Example:

```text
tests/sample_resume.txt
```

---

## Step 2 — Paste Job Description

Paste the target role description into the text area.

---

## Step 3 — Calculate ATS Alignment

Click:

```text
CALCULATE ATS ALIGNMENT
```

---

## Step 4 — Optimize Resume

Use the interactive `+` controls next to missing skills to:

- Simulate resume improvements
- Observe score changes instantly
- Identify high-impact keywords

---

# 📊 Example Workflow

```text
Resume Upload
      ↓
Text Extraction
      ↓
Keyword & Skill Matching
      ↓
ATS Compatibility Scoring
      ↓
Gap Analysis
      ↓
Recommendations & Optimization
```

---

# 🧠 Scoring Engine Highlights

The scoring engine evaluates:

- Keyword overlap
- Technical skills match
- Role alignment
- Experience relevance
- Missing requirements
- Resume completeness

---

# 🔍 Project Highlights

✅ Modular backend architecture  
✅ Clean API separation  
✅ Interactive frontend UX  
✅ Automated backend/frontend testing  
✅ ATS-inspired scoring logic  
✅ Real-time optimization feedback  

---

# 🤝 Contributing

Please read:

```text
CONTRIBUTING.md
```

before contributing.

Contributions are welcome for:

- Improved scoring logic
- UI enhancements
- Better NLP matching
- Additional resume formats
- Performance optimization

---

# 📌 Development Notes

- Backend follows service-oriented architecture for scalability.
- Resume parsers are separated by file type.
- Frontend uses Tailwind for responsive modern UI.
- Integration tests validate backend/frontend contract consistency.

---


# 👨‍💻 Author

Built with ❤️ for smarter hiring and resume optimization.
