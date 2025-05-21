# SuperPlato

**SuperPlato** is an attendance automation platform designed for students at Pusan National University (PNU).  
It automates lecture attendance by logging into the PLATO system, locates classrooms across campus buildings, and provides a fully featured REST API consumed by a React frontend.

Originally built as a personal automation tool, SuperPlato now serves as an academic infrastructure prototype and is deployed via Cloudflare Tunnel on a personal Mac mini server.

---

## 🚀 Installation (Quick Start)

### 1. Clone the Repository

```bash
git clone https://github.com/ghapert/superplato.git
cd superplato
```

---

### 2. Backend Setup (FastAPI + MySQL)

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

Create a `.env` file in the backend/ directory:

```bash
cp .env.example .env
```

Or manually fill the required variables:

```
SQLALCHEMY_DATABASE_URL="mysql+pymysql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST/YOUR_DATABASE"
FERNET_KEY=YOUR_FERNET_KEY
SECRET_KEY=YOUR_SECRET_KEY
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional admin bootstrap
SPECIAL_ADMIN_STUDENT_ID=202512345
SPECIAL_ADMIN_PASSWORD=superplato
```

**How to generate keys:**

- To generate a Fernet key (for encryption), run:
  ```bash
  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```
- To generate a random secret key (for FastAPI session/cookie signing), run:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

Initialize the database and run the server:

```bash
# Run Alembic migrations
alembic upgrade head

# Start the API server
uvicorn main:app --reload
```

- Default API URL: http://localhost:8000

---

### 3. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

- Default Frontend URL: http://localhost:5173

> ⚠️ If you set `VITE_API_BASE_URL` in your frontend `.env`, make sure it matches the actual backend API URL (e.g., `http://localhost:8000`).  
> This ensures all API requests from the frontend are routed correctly to your backend server.

---

### Frontend Environment Variables

Create a `.env` file inside the `frontend/` directory with the following keys:

```env
# API base URL (optional, e.g. http://localhost:8000)
VITE_API_BASE_URL=

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Kakao Maps
VITE_KAKAO_MAP_API_KEY=...

# Bug report and contact
VITE_BUG_REPORT_EMAIL=...
VITE_CONTACT_EMAIL=...

# Privacy and Terms metadata
VITE_PRIVACY_MANAGER_NAME=...
VITE_PRIVACY_MANAGER_EMAIL=...
VITE_PRIVACY_POLICY_UPDATED_AT=...
VITE_PRIVACY_POLICY_EFFECTIVE_AT=...
VITE_TERMS_UPDATED_AT=...
VITE_TERMS_EFFECTIVE_AT=...
```

You can use `.env.example` as a template:

```bash
cp .env.example .env
```

---

### 4. Firebase Configuration

- Place your Firebase service account key at:  
  `backend/credentials/firebase-service-account.json`
- This file is required for Firebase Authentication and Admin SDK operations.
- Do NOT commit this file to Git. It should be excluded via .gitignore.

---

### 5. Background Runner (Optional, for Pro users)

The background attendance runner (`backend/runners/auto_attendance_runner.py`) is designed to be executed independently.  
To run it, first activate your backend Python virtual environment:

```bash
cd backend
source venv/bin/activate
python runners/auto_attendance_runner.py
```

This script enables true background attendance automation for SuperPlato Pro users.

---

## Features

- Smart Attendance Submission: At the scheduled class time, SuperPlato automatically detects your current lecture and submits the required attendance authentication code for you—no manual selection needed.
- True Background Attendance for Pro Users: If you are a SuperPlato Pro user, you don't even need to enter the attendance code—attendance is fully automated and performed in the background without any manual input.
- Firebase Authentication: Supports secure login, with optional “ProKey” upgrade for privileged users.
- Lecture Locator: Easily find lecture room locations on campus with building codes and map integration.
- Assignment Helper: Upload files or text to OpenAI for grammar and content feedback.
- Attendance Summary & AI Analysis: View a summary of your attendance for each lecture. SuperPlato Pro users receive an additional GPT-powered analysis and feedback on their attendance patterns.
- FastAPI Backend: Modular, scalable architecture using routers, services, and background runners.
- React Frontend (Vite): Built as a Single Page Application with fast reloads and modern tooling.
- Session Management: PLATO login sessions and cookies are stored securely and reused when possible.

---

## Tech Stack

| Layer     | Technologies                                         |
|-----------|------------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS, Firebase Auth, Kakao Maps API |
| Backend   | FastAPI, SQLAlchemy, Alembic, Uvicorn                |
| Database  | MySQL                                                |
| Auth      | Firebase, JWT                                        |
| Infra     | Self-hosted (Mac mini) via Cloudflare Tunnel         |
| Tools     | Playwright, BeautifulSoup, OpenAI API, Tesseract OCR, PyPDF2 |

---

## Project Structure

```text
superplato/
├── backend/
│   ├── config/               # Pydantic settings and Firebase initialization
│   ├── migrations/           # Alembic migration files
│   ├── models/               # SQLAlchemy ORM models
│   ├── routers/              # FastAPI route definitions
│   ├── runners/              # Headless browser logic (e.g., Playwright)
│   ├── script/               # Scrapers, seeding scripts, helpers
│   ├── services/             # Core business logic
│   ├── utils/                # Helper functions
│   ├── database.py           # DB engine and session setup
│   ├── init_db.py            # Optional database seeding
│   └── main.py               # FastAPI app entrypoint
├── frontend/
│   ├── public/               # Static files (favicon, etc.)
│   ├── src/                  # React components, hooks, routes
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite build configuration
└── README.md
```

---

## Cautions

- ⚠️ Never commit the following:
  - `.env`
  - `firebase-service-account.json`
  - Any cookie/session storage files
- Temporary runner logs and cookies are excluded via .gitignore
- Future versions will implement encrypted secret storage for greater safety
- **Important:** The "bruteforce" attendance feature (which attempts all possible attendance codes automatically) may be legally or ethically controversial depending on your institution's policy. **Use of this feature is discouraged and at your own risk.**

---

## License

This project is licensed under the **MIT License** —  
feel free to use, modify, and distribute it, but **without any warranty**.  
See the [LICENSE](./LICENSE) file for full details.

---

## Maintainer

Jeong Yonhui (@ghapert)  
1st-year undergraduate at Pusan National University, Undeclared Major  
[github.com/ghapert](https://github.com/ghapert)

---

## Contributions

External contributions are open and encouraged!

If you’re a fellow developer, designer, or just someone who loves building better student tools —
pull requests, feature suggestions, and UI redesign ideas are all welcome.

I’m especially looking for help improving the frontend design.

Feel free to open an issue, fork the project, or just dive in and start creating.

---
