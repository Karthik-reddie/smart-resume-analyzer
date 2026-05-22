# Smart Resume Analyzer — Setup & Running Guide

Welcome to the **Smart Resume Analyzer** setup guide! Follow the detailed step-by-step instructions below to configure the dependencies and run both the Python/Flask backend and the React/Vite frontend on your local machine.

---

## Prerequisites
Ensure you have the following installed on your machine:
1. **Python 3.9+** (Python 3.13 is fully tested and verified)
2. **Node.js v18+** and **npm**

---

## Step 1: Run the Backend Flask Server

The backend acts as the core REST API engine, extracting text from resumes (PDF, DOCX, TXT) and calculating detailed ATS compatibility scores.

1. **Open a terminal window** and navigate to the project root directory:
   ```bash
   cd /Users/wallstreet62/Desktop/smart-resume-analyzer
   ```

2. **Activate the Python virtual environment**:
   ```bash
   source venv/bin/activate
   ```
   *(If the virtual environment is not already created, you can initialize it with `python3 -m venv venv` and install the requirements via `pip install -r engine/requirements.txt`)*

3. **Set the environment variable & run the server**:
   We configure `PYTHONPATH=.` so python can locate the `engine` package cleanly:
   ```bash
   PYTHONPATH=. python engine/app.py
   ```

4. **Verify the server is running**:
   You should see output similar to the following:
   ```text
    * Serving Flask app 'app'
    * Running on http://127.0.0.1:5005
   ```
   The API endpoint `/api/score-resume` and `/api/upload-resume` are now active.


---

## Step 2: Run the Frontend Vite React Server

The frontend is built using React, TypeScript, and Tailwind CSS. It features a side-by-side workspace and interactive real-time score adjustment sliders.

1. **Open a new terminal window** (do not close the backend terminal).
2. **Navigate to the frontend folder**:
   ```bash
   cd /Users/wallstreet62/Desktop/smart-resume-analyzer/experience
   ```

3. **Install the node dependencies** (if not already done):
   ```bash
   npm install
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

5. **Verify the server is active**:
   Vite will report that the app is listening:
   ```text
     ➜  Local:   http://localhost:5173/
   ```

---

## Step 3: Access the Application

1. Open your web browser and navigate to:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. **Test Ingestion**: Under **1. RESUME INGESTION**, drag and drop or browse to select a resume file (e.g. `/Users/wallstreet62/Desktop/smart-resume-analyzer/tests/sample_resume.txt`).
3. **Set Role Target**: Switch to the **2. ROLE TARGET** tab and paste the text of a job description you are targetting.
4. **Calculate Alignment**: Click **CALCULATE ATS ALIGNMENT** to run the matching model and view your interactive breakdown metrics, circular scores, skill matrices, and dynamic refactoring recommendations.
5. **Optimize**: Click the `+` buttons next to missing skills to watch your score climb in real-time!

---

## Verification & Testing
To ensure the backend service remains perfectly integrated, you can run the pytest test suite at the project root:
```bash
cd /Users/wallstreet62/Desktop/smart-resume-analyzer
./venv/bin/pytest
```
All 11 tests should return green/passed.
