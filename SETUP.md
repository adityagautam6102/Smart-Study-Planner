# Setup Guide

## Quick Start (Full Stack)

1. **Backend Server:**
   ```bash
   cd BACKEND
   python -m venv venv
   source venv/Scripts/activate # on windows
   pip install -r requirements.txt
   python app.py
   ```
   The backend will run on `http://localhost:5000`. An SQLite database will be initialized automatically.

2. **Frontend Server:**
   ```bash
   cd FRONTEND
   python -m http.server 8000
   ```
   Open `http://localhost:8000/login.html` in your browser.
