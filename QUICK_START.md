# ⚡ Quick Reference Guide

## 🚀 Start Here

### Option 1: Frontend Only (No Backend)
```bash
# Just open in browser
open index.html

# Or use Python server
python -m http.server 8000
# Visit: http://localhost:8000
```

### Option 2: Full Stack (Frontend + Backend)
```bash
# Terminal 1: Backend
cd Smart-Study-Planner
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                      # http://localhost:5000

# Terminal 2: Frontend
python -m http.server 8000         # http://localhost:8000
```

---

## 📚 Documentation Files

| File | Read When | Purpose |
|------|-----------|---------|
| **README.md** | First! | Project overview & features |
| **BACKEND_SUMMARY.md** | Quick overview | What's in the backend |
| **SETUP.md** | Installing backend | Step-by-step setup guide |
| **BACKEND_API.md** | Using the API | Complete endpoint reference |
| **DATABASE_EXAMPLES.md** | Writing queries | 50+ SQL examples |
| **.env.example** | Configuring | Environment variables |

---

## 🔑 Key Files

### Frontend
- `index.html` - Main dashboard
- `script.js` - Core planner logic
- `styles.css` - All styling
- `api-client.js` - Backend integration

### Backend
- `app.py` - Flask REST API
- `requirements.txt` - Dependencies
- `.env` - Configuration (copy from .env.example)

### PWA
- `manifest.json` - App metadata
- `service-worker.js` - Offline support

---

## 🧪 Test the Backend

### With cURL
```bash
# Register user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'

# Copy the access_token from response

# Get subjects (replace TOKEN with your token)
curl http://localhost:5000/api/subjects \
  -H "Authorization: Bearer TOKEN"
```

### With Frontend
1. Open http://localhost:8000
2. Go to login page
3. Register new account
4. Observe network tab → sees API calls
5. Data saved in database

---

## 🛠️ Troubleshooting

### Backend won't start?
```bash
# Check Python version
python --version          # Should be 3.8+

# Reinstall packages
pip install -r requirements.txt --force-reinstall

# Check port is free
netstat -an | grep 5000
```

### "ModuleNotFoundError: No module named 'flask'"?
```bash
# Make sure you're in virtual environment
source venv/bin/activate    # Mac/Linux
venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt
```

### CORS errors in browser console?
```python
# Ensure CORS is enabled in app.py (it is by default)
from flask_cors import CORS
CORS(app)
```

### "Port 5000 already in use"?
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9   # Mac/Linux
netstat -ano | findstr :5000     # Windows (find PID), then taskkill /PID <PID>

# Or use different port
python app.py --port 5001
```

---

## 🌐 API Endpoints Overview

### Authentication
- `POST /api/register` - Sign up
- `POST /api/login` - Sign in
- `GET /api/user` - Get profile

### Subjects
- `GET /api/subjects` - List all
- `POST /api/subjects` - Create
- `PUT /api/subjects/<id>` - Update
- `DELETE /api/subjects/<id>` - Delete

### Gamification
- `GET /api/gamification` - Get stats
- `POST /api/gamification/xp` - Add XP
- `POST /api/gamification/streak` - Update streak
- `POST /api/gamification/badges` - Award badge
- `POST /api/gamification/mode` - Set mode

### Sessions
- `GET /api/sessions` - Get history
- `POST /api/sessions` - Record session

### Reflections
- `GET /api/reflections` - Get all
- `POST /api/reflections` - Record

### Analytics
- `GET /api/analytics/summary` - Stats
- `GET /api/analytics/heatmap` - Study map

---

## 💾 Database

### Reset Database
```bash
# Delete existing
rm smart_study_planner.db

# Recreate on next run
python app.py
```

### Browse Database
```python
# Python shell
python
>>> from app import db, User, Subject
>>> users = User.query.all()
>>> for user in users:
...     print(f"{user.name}: {user.email}")
>>> exit()
```

---

## 📦 Install/Update Dependencies

```bash
# Create venv (first time only)
python -m venv venv

# Activate venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# Install packages
pip install -r requirements.txt

# Add new package
pip install flask-extra
pip freeze > requirements.txt  # Update file
```

---

## 🚀 Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set JWT_SECRET_KEY=your-secret-key
git push heroku main
heroku logs --tail
```

### Docker
```bash
# Build image
docker build -t study-planner .

# Run container
docker run -p 5000:5000 -e JWT_SECRET_KEY=secret study-planner
```

---

## 🔐 Environment Setup

### Create .env file
```bash
# Copy template
cp .env.example .env

# Edit .env with your settings
JWT_SECRET_KEY=your-random-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
```

### Production .env
```
JWT_SECRET_KEY=<strong-random-string>
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:pass@host/db
```

---

## 📊 Verify Setup

### Frontend Works?
```
✅ Open http://localhost:8000
✅ See dashboard
✅ Can add subjects (stored in localStorage)
```

### Backend Works?
```
✅ Run: python app.py
✅ See: "Running on http://127.0.0.1:5000"
✅ Database file created: smart_study_planner.db
```

### Both Work Together?
```
✅ Register user in frontend
✅ Check browser Network tab
✅ See POST to /api/register
✅ Token stored in localStorage
✅ Data synced to database
```

---

## 🔗 Integration Steps

1. **Backend running**: `python app.py` ✅
2. **Frontend running**: `python -m http.server 8000` ✅
3. **api-client.js loaded** in index.html ✅
4. **Try registration**: Should see API call ✅
5. **Data persisted**: Check SQLite database ✅

---

## 📱 Test Features

### Test Subject Management
```javascript
// In browser console
api.addSubject('Math', 20, 'hard', 'high', '2026-02-15')
api.getSubjects()
api.updateSubject(1, {completed_chapters: 5})
```

### Test Gamification
```javascript
api.addXP(50)
api.updateStreak()
api.awardBadge('seven_day_streak')
api.getGamification()
```

### Test Analytics
```javascript
api.getAnalyticsSummary()
api.getStudyHeatmap()
```

---

## 🎯 Common Tasks

### Add Test User Programmatically
```python
from app import app, db, User, Gamification

with app.app_context():
    user = User(name="Test", email="test@test.com")
    user.set_password("test123")
    gamification = Gamification(user=user)
    db.session.add(user)
    db.session.add(gamification)
    db.session.commit()
    print("User created!")
```

### Export User Data
```python
from app import app, User

with app.app_context():
    user = User.query.filter_by(email="test@test.com").first()
    data = {
        'user': user.to_dict(),
        'subjects': [s.to_dict() for s in user.subjects],
        'gamification': user.gamification.to_dict()
    }
    print(json.dumps(data))
```

### Reset User's Gamification
```python
from app import app, User

with app.app_context():
    user = User.query.filter_by(email="test@test.com").first()
    user.gamification.xp = 0
    user.gamification.level = 1
    user.gamification.streak = 0
    db.session.commit()
    print("Reset!")
```

---

## 📞 Need Help?

1. **Setup issues?** → Read [SETUP.md](SETUP.md)
2. **API questions?** → Check [BACKEND_API.md](BACKEND_API.md)
3. **Database help?** → See [DATABASE_EXAMPLES.md](DATABASE_EXAMPLES.md)
4. **Feature overview?** → Read [README.md](README.md)
5. **Backend summary?** → Check [BACKEND_SUMMARY.md](BACKEND_SUMMARY.md)

---

## ⚡ TL;DR - Fastest Start

```bash
# Frontend only (2 seconds)
python -m http.server 8000 && open http://localhost:8000

# Full stack (5 minutes)
# Terminal 1:
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py

# Terminal 2:
python -m http.server 8000 && open http://localhost:8000
```

---

**Happy coding! 🚀📚**
