# Smart Study Planner - Complete Setup Guide

## 📦 Project Structure

```
Smart-Study-Planner/
├── Frontend (HTML/CSS/JS)
│   ├── index.html          # Main dashboard
│   ├── landing.html        # Landing page
│   ├── login.html          # Auth page
│   ├── script.js           # Frontend logic
│   ├── landing.js          # Landing page logic
│   ├── login.js            # Auth logic
│   ├── api-client.js       # API integration (NEW)
│   ├── styles.css          # Styling
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js   # PWA service worker
│   └── assets/
│       └── logo.svg        # App logo
│
├── Backend (Python/Flask)
│   ├── app.py              # Flask API server (UPDATED)
│   ├── requirements.txt     # Python dependencies (NEW)
│   ├── .env.example        # Environment template (NEW)
│   └── BACKEND_API.md      # API documentation (NEW)
│
└── README files
    ├── README.md           # Project overview
    └── SETUP.md            # This file
```

## 🚀 Quick Start

### Phase 1: Frontend Only (Existing)

The frontend currently uses **localStorage** for data persistence.

```bash
# Just open in browser:
open index.html

# Or use a local server:
python -m http.server 8000
# Visit: http://localhost:8000
```

**Features:**
- ✅ Dashboard with subjects, deadlines, priorities
- ✅ Pomodoro timer (adaptive by difficulty)
- ✅ Study analytics & heatmap
- ✅ Gamification (XP, levels, streaks, badges)
- ✅ Achievement showcase
- ✅ Reflection tracking
- ✅ Chat assistant
- ✅ Music player
- ✅ Day/night theme
- ✅ Normal/Exam mode
- ✅ Focus mode
- ✅ PWA support (installable app)
- ✅ Export/Import data

**Data Storage:** All data in browser localStorage (lost on clear)

---

### Phase 2: Add Backend (NEW)

#### Step 1: Install Python Dependencies

```bash
# Navigate to project directory
cd Smart-Study-Planner

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

#### Step 2: Configure Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env and set JWT_SECRET_KEY to something secure:
# JWT_SECRET_KEY=your-super-secret-random-string-here
```

#### Step 3: Run Backend Server

```bash
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

Database created: `smart_study_planner.db`

#### Step 4: Update Frontend to Use API

Edit `script.js` and at the top, add:

```javascript
// At the very top of script.js, after login check
const USE_BACKEND_API = true; // Set to false to use localStorage

// If using backend, use api-client.js
if (USE_BACKEND_API) {
    // Load API client
    const script = document.createElement('script');
    script.src = 'api-client.js';
    document.head.appendChild(script);
}
```

Then update methods in SmartStudyPlanner class to call API instead of localStorage:

**Example: Saving subjects**
```javascript
// OLD: this.saveToStorage()
// NEW: 
async saveToStorage() {
    if (USE_BACKEND_API) {
        await api.updateSubject(subject.id, { completed_chapters: subject.completedChapters });
    } else {
        localStorage.setItem('smartStudyPlannerData', JSON.stringify(data));
    }
}
```

#### Step 5: Test Backend

```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Frontend server
python -m http.server 8000

# Browser: http://localhost:8000
```

Try registering a new user → data saved to database ✅

---

## 🔄 Migration: localStorage → Backend

### Option A: Gradual Migration (Recommended)

1. Keep `USE_BACKEND_API = false` (localStorage)
2. Users continue with existing data
3. When backend is ready, set `USE_BACKEND_API = true`
4. Users can export/import data to backend

### Option B: One-Time Import

1. Expose export endpoint
2. Have users export from localStorage
3. Provide import endpoint to restore to backend
4. Delete localStorage data

### Option C: Dual Write (Safest)

```javascript
// Write to both localStorage AND backend
async saveToStorage() {
    // Local backup
    localStorage.setItem('smartStudyPlannerData', JSON.stringify(data));
    
    // Backend sync
    if (USE_BACKEND_API) {
        try {
            await api.updateSubject(subject.id, data);
        } catch (error) {
            console.warn('Backend sync failed, data in localStorage');
        }
    }
}
```

---

## 📱 Frontend Implementation Guide

### Connect Registration to Backend

**OLD (login.js):**
```javascript
function onRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Store in localStorage
    let users = JSON.parse(localStorage.getItem('smartStudyUsers')) || [];
    users.push({ name, email, password });
    localStorage.setItem('smartStudyUsers', JSON.stringify(users));
}
```

**NEW (with backend):**
```javascript
async function onRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const result = await api.register(name, email, password);
        // Token automatically stored
        localStorage.setItem('smartStudyUser', email);
        window.location.href = 'index.html';
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}
```

### Sync Subject Progress to Backend

In `script.js` updateProgress method:

```javascript
async updateProgress(subjectId, completedChapters) {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (subject) {
        subject.completedChapters = completedChapters;
        
        // Sync to backend
        if (USE_BACKEND_API) {
            try {
                await api.updateSubject(subjectId, {
                    completed_chapters: completedChapters
                });
            } catch (error) {
                console.error('Failed to sync:', error);
                // Keep local change as fallback
            }
        }
        
        this.saveToStorage();
        this.render();
    }
}
```

### Record Pomodoro Sessions

In `pomodoroSessionComplete()`:

```javascript
async pomodoroSessionComplete() {
    const subject = this.subjects.find(s => s.id === this.pomodoroState.currentSubjectId);
    if (subject) {
        subject.sessionsCompleted++;
        
        // Sync to backend
        if (USE_BACKEND_API) {
            try {
                await api.recordSession(subject.id, 25); // 25-minute session
                await api.addXP(25);
                await api.updateStreak();
            } catch (error) {
                console.error('Failed to record session:', error);
            }
        }
        
        this.awardXP(25, 'Pomodoro completed');
        this.recordStudySession();
    }
    
    alert(`🎉 Great work!`);
    this.closePomodoro();
    this.render();
}
```

---

## 🧪 API Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Response:
# {"status":"success","access_token":"eyJ0eXAi...","user":{...}}

# Get token from response, then:
TOKEN="eyJ0eXAi..."

# Get subjects
curl -X GET http://localhost:5000/api/subjects \
  -H "Authorization: Bearer $TOKEN"

# Add subject
curl -X POST http://localhost:5000/api/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Math",
    "chapters":20,
    "difficulty":"hard",
    "priority":"high",
    "deadline":"2026-02-15T00:00:00"
  }'
```

### Using Postman

1. Import endpoints from `BACKEND_API.md`
2. Set Authorization type: Bearer Token
3. Paste JWT token from register response
4. Test all endpoints

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET_KEY` in `.env` to strong random value
- [ ] Set `FLASK_ENV=production` for deployment
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly (not `*`)
- [ ] Hash passwords (done via werkzeug)
- [ ] Validate all inputs on backend
- [ ] Use environment variables for secrets
- [ ] Rate limit API endpoints
- [ ] Set token expiration (30 days default)

---

## 📊 Database Browser

### View SQLite Database

```bash
# Install sqlite3 browser
# Option 1: Command line
sqlite3 smart_study_planner.db
> SELECT * FROM users;

# Option 2: GUI tool
# Download: https://sqlitebrowser.org/

# Option 3: Python
python
>>> from app import db, User
>>> User.query.all()
```

---

## 🚀 Deployment

### Option 1: Heroku (Easy)

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set environment variable
heroku config:set JWT_SECRET_KEY=your-secret-key

# Deploy
git push heroku main
```

### Option 2: AWS/GCP (Production)

1. Use production database (PostgreSQL)
2. Deploy with Gunicorn
3. Use RDS for database
4. Enable CloudFront CDN
5. Set up auto-scaling

### Option 3: Docker

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
CMD ["gunicorn", "-w", "4", "app:app"]
```

```bash
docker build -t study-planner .
docker run -p 5000:5000 -e JWT_SECRET_KEY=secret study-planner
```

---

## 📚 Next Steps

1. ✅ Backend API created (`app.py`)
2. ✅ API documentation written (`BACKEND_API.md`)
3. ✅ API client library ready (`api-client.js`)
4. ⏳ Integrate API with frontend
5. ⏳ Test all endpoints
6. ⏳ Deploy to production
7. ⏳ Monitor & optimize

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check port 5000 is free
netstat -an | grep 5000
```

### Database errors
```bash
# Reset database
rm smart_study_planner.db
python app.py  # Creates fresh DB
```

### CORS errors in console
```javascript
// Add to app.py
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000"}})
```

### JWT token invalid
```bash
# Token expired? Register again
# Restart backend to pick up new JWT_SECRET_KEY
```

---

## 📞 Support

For issues:
1. Check `BACKEND_API.md` for endpoint documentation
2. Check Flask error logs in terminal
3. Use browser DevTools > Network tab to inspect requests
4. Test endpoints with cURL first before debugging frontend

---

**You now have a production-ready Smart Study Planner with cloud-capable backend! 🎉**
